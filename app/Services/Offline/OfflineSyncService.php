<?php

namespace App\Services\Offline;

use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Guest;
use App\Models\HousekeepingTask;
use App\Models\OfflineOperation;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\LedgerService;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OfflineSyncService
{
    public function __construct(
        protected ConflictResolutionService $conflictResolver
    ) {}

    /**
     * Process a batch of offline operations from a client device.
     */
    public function syncBatch(User $user, string $deviceId, array $operations): array
    {
        $tenantId = $user->tenant_id;
        $confirmedIds = [];
        $results = [];
        $failedOperations = [];

        foreach ($operations as $op) {
            $opId = $op['operation_id'] ?? null;
            $type = $op['type'] ?? 'general';
            $action = $op['action'] ?? 'create';
            $payload = $op['payload'] ?? [];

            if (! $opId) {
                continue;
            }

            $payloadHash = hash('sha256', json_encode($payload));

            // 1. Idempotency Check
            $existingOp = OfflineOperation::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('operation_id', $opId)
                ->first();

            if ($existingOp) {
                $confirmedIds[] = $opId;
                $results[$opId] = [
                    'status' => $existingOp->status,
                    'result' => $existingOp->server_result,
                    'cached' => true,
                ];

                continue;
            }

            // 1b. Role gate: the active role must be permitted for this operation type
            $roleError = $this->authorizeOperationType($user, $type);
            if ($roleError !== null) {
                OfflineOperation::create([
                    'tenant_id' => $tenantId,
                    'device_id' => $deviceId,
                    'user_id' => $user->id,
                    'operation_id' => $opId,
                    'operation_type' => $type,
                    'payload_hash' => $payloadHash,
                    'status' => 'rejected',
                    'server_result' => ['error' => $roleError],
                ]);

                $failedOperations[] = [
                    'operation_id' => $opId,
                    'error' => $roleError,
                ];

                continue;
            }

            // 2. Process Operation within a Transaction
            DB::beginTransaction();
            try {
                $processResult = match ($type) {
                    'pos_order' => $this->processPosOrder($user, $deviceId, $payload),
                    'housekeeping_update' => $this->processHousekeepingUpdate($user, $payload),
                    'guest_registration' => $this->processGuestRegistration($user, $payload),
                    default => $this->processGenericAction($user, $action, $payload),
                };

                // Record successful operation
                OfflineOperation::create([
                    'tenant_id' => $tenantId,
                    'device_id' => $deviceId,
                    'user_id' => $user->id,
                    'operation_id' => $opId,
                    'operation_type' => $type,
                    'payload_hash' => $payloadHash,
                    'status' => 'confirmed',
                    'server_result' => $processResult,
                ]);

                DB::commit();

                $confirmedIds[] = $opId;
                $results[$opId] = [
                    'status' => 'confirmed',
                    'result' => $processResult,
                ];
            } catch (Exception $e) {
                DB::rollBack();
                Log::error("[OfflineSync] Operation {$opId} failed: ".$e->getMessage(), [
                    'tenant_id' => $tenantId,
                    'device_id' => $deviceId,
                    'type' => $type,
                    'trace' => $e->getTraceAsString(),
                ]);

                // Record failure for audit
                OfflineOperation::create([
                    'tenant_id' => $tenantId,
                    'device_id' => $deviceId,
                    'user_id' => $user->id,
                    'operation_id' => $opId,
                    'operation_type' => $type,
                    'payload_hash' => $payloadHash,
                    'status' => 'rejected',
                    'server_result' => ['error' => $e->getMessage()],
                ]);

                $failedOperations[] = [
                    'operation_id' => $opId,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'success' => true,
            'confirmed_operation_ids' => $confirmedIds,
            'results' => $results,
            'failed' => $failedOperations,
            'server_timestamp' => now()->toISOString(),
            'cursor' => (string) (now()->getTimestampMs()),
        ];
    }

    /**
     * Verify the user's active role is permitted to submit a given
     * offline operation type. Mirrors the module.access role mapping.
     */
    protected function authorizeOperationType(User $user, string $type): ?string
    {
        if ($user->isSuperAdmin()) {
            return null;
        }

        $role = $user->active_role;

        $allowed = match ($type) {
            'pos_order' => [
                'owner', 'super_admin', 'general_manager', 'manager', 'admin',
                'pos_cashier', 'cashier', 'waiter', 'bartender', 'chef',
                'restaurant_cashier', 'restaurant_staff',
                'grocery_cashier', 'supermarket_cashier', 'storekeeper',
                'receptionist', 'front_desk', 'front_office', 'front_office_manager',
            ],
            'housekeeping_update' => [
                'owner', 'super_admin', 'general_manager', 'manager', 'admin',
                'housekeeper', 'housekeeping_supervisor', 'staff',
            ],
            'guest_registration' => [
                'owner', 'super_admin', 'general_manager', 'manager', 'admin',
                'receptionist', 'front_desk', 'front_office', 'front_office_manager',
            ],
            default => null,
        };

        if ($allowed === null) {
            return null; // unknown types pass through (acknowledged only)
        }

        if (! in_array($role, $allowed, true)) {
            return "Your current role ({$role}) is not permitted to sync '{$type}' operations.";
        }

        return null;
    }

    /**
     * Process an offline POS Order
     */
    protected function processPosOrder(User $user, string $deviceId, array $payload): array
    {
        $tenantId = $user->tenant_id;
        $orderData = $payload['data'] ?? $payload;

        $orderNumber = $orderData['order_number'] ?? 'ORD-'.strtoupper(substr(uniqid(), -6));
        $orderType = $orderData['order_type'] ?? 'dine_in';
        $department = $orderData['department'] ?? 'restaurant';
        $paymentMethod = $orderData['payment_method'] ?? 'cash';
        $items = $orderData['items'] ?? [];

        // Check if an order with this order_number already exists for tenant
        $existingOrder = PosOrder::where('tenant_id', $tenantId)
            ->where('order_number', $orderNumber)
            ->first();

        if ($existingOrder) {
            return [
                'order_id' => $existingOrder->id,
                'order_number' => $existingOrder->order_number,
                'status' => 'existing_confirmed',
            ];
        }

        $propertyId = $user->property_id ?? Property::where('tenant_id', $tenantId)->value('id');

        // Resolve order lines. When an item is linked to the catalog, the
        // server-side price is authoritative — client totals are never trusted
        // for catalog items. Legacy offline payloads without item_id keep the
        // client-supplied amounts (they cannot be verified server-side).
        $orderLines = [];
        $serverSubtotal = 0;
        $allCatalogLinked = true;

        foreach ($items as $item) {
            $itemId = $item['item_id'] ?? $item['id'] ?? null;
            $qty = max(1, (int) ($item['quantity'] ?? 1));

            if ($itemId) {
                $catalogItem = PosItem::where('tenant_id', $tenantId)
                    ->where('department', $department)
                    ->find($itemId);

                if (! $catalogItem) {
                    throw new Exception("POS item {$itemId} not found in {$department} catalog for this tenant.");
                }

                $unitPrice = (int) $catalogItem->price_minor;
                $itemName = $catalogItem->name;
            } else {
                $allCatalogLinked = false;
                $unitPrice = (int) ($item['unit_price'] ?? $item['price_minor'] ?? 0);
                $itemName = $item['name'] ?? $item['description'] ?? 'Item';
            }

            $lineTotal = $unitPrice * $qty;
            $serverSubtotal += $lineTotal;

            $orderLines[] = [
                'pos_item_id' => $itemId,
                'item_name' => $itemName,
                'quantity' => $qty,
                'unit_price_minor' => $unitPrice,
                'total_minor' => $lineTotal,
                'instructions' => $item['notes'] ?? $item['instructions'] ?? null,
            ];
        }

        if ($allCatalogLinked && $orderLines !== []) {
            $subtotalMinor = $serverSubtotal;
            $taxMinor = (int) round($subtotalMinor * 0.18);
            $totalMinor = $subtotalMinor + $taxMinor;
        } else {
            // Unverifiable legacy payload: keep client totals
            $subtotalMinor = (int) ($orderData['subtotal_minor'] ?? 0);
            $taxMinor = (int) ($orderData['tax_minor'] ?? 0);
            $totalMinor = (int) ($orderData['total_minor'] ?? $orderData['grand_total'] ?? ($subtotalMinor + $taxMinor));
        }

        $isRoomCharge = $paymentMethod === 'room_folio';

        $posOrder = PosOrder::create([
            'tenant_id' => $tenantId,
            'property_id' => $propertyId,
            'user_id' => $user->id,
            'order_number' => $orderNumber,
            'outlet_type' => $department === 'grocery' ? 'grocery' : 'restaurant',
            'order_type' => $orderType,
            'department' => $department,
            'table_number' => $orderData['table_number'] ?? null,
            'room_id' => $orderData['room_id'] ?? null,
            'guest_name' => $orderData['guest_name'] ?? 'Walk-in Guest',
            'subtotal_minor' => $subtotalMinor,
            'tax_minor' => $taxMinor,
            'total_minor' => $totalMinor,
            'payment_status' => $isRoomCharge ? 'posted_to_room' : 'paid',
            'payment_method' => $paymentMethod,
            'folio_id' => $orderData['folio_id'] ?? null,
            'status' => 'completed',
            'notes' => ($orderData['notes'] ?? '')." [Synced from offline device {$deviceId}]",
        ]);

        foreach ($orderLines as $line) {
            $line['pos_order_id'] = $posOrder->id;
            PosOrderItem::create($line);
        }

        // Ledger posting for the synced sale (same rules as online POS)
        $ledgerAmount = $posOrder->total_minor;
        if ($isRoomCharge) {
            app(LedgerService::class)->post(
                (string) $tenantId,
                $propertyId,
                'pos_order',
                (string) $posOrder->id,
                "Offline POS order #{$orderNumber} charged to guest folio",
                [
                    ['code' => '1050', 'direction' => 'debit', 'amount_minor' => $ledgerAmount],
                    ['code' => $department === 'grocery' ? '4003' : '4002', 'direction' => 'credit', 'amount_minor' => $ledgerAmount],
                ],
            );
        } else {
            app(LedgerService::class)->post(
                (string) $tenantId,
                $propertyId,
                'pos_order',
                (string) $posOrder->id,
                "Offline POS order #{$orderNumber} ({$paymentMethod})",
                [
                    ['code' => LedgerService::tenderCode($paymentMethod), 'direction' => 'debit', 'amount_minor' => $ledgerAmount],
                    ['code' => $department === 'grocery' ? '4003' : '4002', 'direction' => 'credit', 'amount_minor' => $ledgerAmount],
                ],
            );
        }

        // Grocery sales must deduct stock like the online checkout does
        if ($department === 'grocery') {
            foreach ($items as $item) {
                $itemId = $item['item_id'] ?? $item['id'] ?? null;
                $qty = max(1, (int) ($item['quantity'] ?? 1));
                if (! $itemId) {
                    continue;
                }
                $catalogItem = PosItem::where('tenant_id', $tenantId)->find($itemId);
                if (! $catalogItem) {
                    continue;
                }
                $catalogItem->decrement('stock_quantity', $qty);
                StockMovement::create([
                    'tenant_id' => $tenantId,
                    'property_id' => $propertyId,
                    'pos_item_id' => $catalogItem->id,
                    'movement_type' => 'issue_department',
                    'quantity' => $qty,
                    'unit_cost_minor' => $catalogItem->cost_price_minor ?? 0,
                    'department' => 'retail_grocery',
                    'reference_no' => 'OFFLINE-'.$orderNumber,
                    'notes' => 'Offline retail counter sale',
                    'performed_by' => $user->id,
                ]);
            }
        }

        // Room-charge orders must post to the guest folio so revenue is not lost
        if ($isRoomCharge && ! empty($orderData['folio_id'])) {
            $folio = Folio::where('tenant_id', $tenantId)->find($orderData['folio_id']);
            if ($folio) {
                FolioLine::create([
                    'tenant_id' => $tenantId,
                    'folio_id' => $folio->id,
                    'business_date' => now()->toDateString(),
                    'line_type' => $department === 'grocery' ? 'grocery' : 'restaurant',
                    'description' => "Offline POS Order #{$orderNumber}",
                    'amount_minor' => $totalMinor,
                    'tax_minor' => $taxMinor,
                    'posted_by' => $user->id,
                ]);

                $folio->recalculateBalance();
            }
        }

        return [
            'order_id' => $posOrder->id,
            'order_number' => $posOrder->order_number,
            'total_minor' => $posOrder->total_minor,
            'status' => 'created',
        ];
    }

    /**
     * Process an offline Housekeeping Task / Room Status Update
     */
    protected function processHousekeepingUpdate(User $user, array $payload): array
    {
        $roomId = $payload['room_id'] ?? null;
        $status = $payload['status'] ?? 'clean';
        $notes = $payload['notes'] ?? 'Updated offline';

        if (! $roomId) {
            throw new Exception('Room ID is required for housekeeping update.');
        }

        $room = Room::where('tenant_id', $user->tenant_id)->findOrFail($roomId);

        // Rooms expose status_hk (housekeeping state), not a generic status column
        $hkMap = [
            'clean' => 'clean',
            'dirty' => 'dirty',
            'inspected' => 'inspected',
            'out_of_order' => 'out_of_order',
            'out_of_service' => 'out_of_service',
        ];
        $hkStatus = $hkMap[strtolower((string) $status)] ?? 'clean';

        $room->update(['status_hk' => $hkStatus]);

        HousekeepingTask::create([
            'tenant_id' => $user->tenant_id,
            'property_id' => $room->property_id,
            'room_id' => $room->id,
            'assigned_to' => $user->id,
            'status' => 'completed',
            'priority' => 'normal',
            'notes' => $notes,
            'completed_at' => now(),
        ]);

        return [
            'room_id' => $room->id,
            'room_number' => $room->room_number,
            'status' => $status,
        ];
    }

    /**
     * Process an offline Guest Registration
     */
    protected function processGuestRegistration(User $user, array $payload): array
    {
        $tenantId = $user->tenant_id;
        $firstName = $payload['first_name'] ?? 'Guest';
        $lastName = $payload['last_name'] ?? '';
        $phone = $payload['phone'] ?? null;
        $email = $payload['email'] ?? null;

        $guest = Guest::create([
            'tenant_id' => $tenantId,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'phone' => $phone,
            'email' => $email,
            'identification_type' => $payload['identification_type'] ?? 'national_id',
            'id_number' => $payload['id_number'] ?? null,
            'nationality' => $payload['nationality'] ?? 'Tanzanian',
            'notes' => ($payload['notes'] ?? '').' [Created offline]',
        ]);

        return [
            'guest_id' => $guest->id,
            'name' => "{$guest->first_name} {$guest->last_name}",
        ];
    }

    /**
     * Process generic offline queued action
     */
    protected function processGenericAction(User $user, string $action, array $payload): array
    {
        return [
            'action' => $action,
            'status' => 'acknowledged',
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get initial baseline dataset for a tenant so device can work offline immediately.
     */
    public function getBootstrapData(User $user): array
    {
        $tenant = $user->tenant;
        $tenantId = $user->tenant_id;

        // 1. POS Items & Categories
        $categories = PosCategory::where('tenant_id', $tenantId)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'icon', 'department']);

        $items = PosItem::where('tenant_id', $tenantId)
            ->where('is_available', true)
            ->get(['id', 'name', 'code', 'pos_category_id', 'price_minor', 'unit', 'department', 'track_inventory', 'current_stock']);

        // 2. Rooms & Room Types
        $roomTypes = RoomType::where('tenant_id', $tenantId)
            ->get(['id', 'name', 'code', 'base_rate_minor', 'amenities', 'capacity_adults']);

        $rooms = Room::where('tenant_id', $tenantId)
            ->get(['id', 'room_type_id', 'room_number', 'floor', 'status', 'hk_status']);

        $ratePlans = RatePlan::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->get(['id', 'name', 'code', 'rate_modifier_type', 'rate_modifier_amount']);

        // 3. Properties
        $properties = Property::where('tenant_id', $tenantId)
            ->get(['id', 'name', 'code', 'currency', 'tax_config', 'address', 'phone', 'checkin_time', 'checkout_time']);

        return [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'currency' => $tenant->currency ?? 'TZS',
                'tin' => $tenant->tin ?? null,
                'vrn' => $tenant->vrn ?? null,
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ?? 'staff',
            ],
            'properties' => $properties,
            'categories' => $categories,
            'items' => $items,
            'room_types' => $roomTypes,
            'rooms' => $rooms,
            'rate_plans' => $ratePlans,
            'server_timestamp' => now()->toISOString(),
            'cursor' => (string) now()->getTimestampMs(),
        ];
    }

    /**
     * Download incremental changes since a given timestamp or cursor.
     */
    public function getChanges(User $user, ?string $cursor): array
    {
        $tenantId = $user->tenant_id;
        $since = $cursor ? date('Y-m-d H:i:s', (int) ($cursor / 1000)) : now()->subHours(24)->toDateTimeString();

        $updatedRooms = Room::where('tenant_id', $tenantId)
            ->where('updated_at', '>=', $since)
            ->get(['id', 'room_type_id', 'room_number', 'status', 'hk_status']);

        $updatedItems = PosItem::where('tenant_id', $tenantId)
            ->where('updated_at', '>=', $since)
            ->get(['id', 'name', 'code', 'pos_category_id', 'price_minor', 'is_available', 'current_stock']);

        return [
            'rooms' => $updatedRooms,
            'items' => $updatedItems,
            'server_timestamp' => now()->toISOString(),
            'cursor' => (string) now()->getTimestampMs(),
        ];
    }
}
