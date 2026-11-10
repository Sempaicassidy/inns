<?php

namespace App\Services\Offline;

use App\Models\Guest;
use App\Models\HousekeepingTask;
use App\Models\OfflineDevice;
use App\Models\OfflineOperation;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
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

            if (!$opId) {
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
                Log::error("[OfflineSync] Operation {$opId} failed: " . $e->getMessage(), [
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
     * Process an offline POS Order
     */
    protected function processPosOrder(User $user, string $deviceId, array $payload): array
    {
        $tenantId = $user->tenant_id;
        $orderData = $payload['data'] ?? $payload;

        $orderNumber = $orderData['order_number'] ?? 'ORD-' . strtoupper(substr(uniqid(), -6));
        $totalMinor = (int) ($orderData['total_minor'] ?? $orderData['grand_total'] ?? 0);
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

        $posOrder = PosOrder::create([
            'tenant_id' => $tenantId,
            'property_id' => $propertyId,
            'user_id' => $user->id,
            'order_number' => $orderNumber,
            'order_type' => $orderType,
            'department' => $department,
            'table_number' => $orderData['table_number'] ?? null,
            'room_id' => $orderData['room_id'] ?? null,
            'guest_name' => $orderData['guest_name'] ?? 'Walk-in Guest',
            'subtotal_minor' => (int) ($orderData['subtotal_minor'] ?? $totalMinor),
            'tax_minor' => (int) ($orderData['tax_minor'] ?? Math_round($totalMinor * 0.18)),
            'total_minor' => $totalMinor,
            'payment_status' => 'paid',
            'payment_method' => $paymentMethod,
            'status' => 'completed',
            'notes' => ($orderData['notes'] ?? '') . " [Synced from offline device {$deviceId}]",
        ]);

        foreach ($items as $item) {
            $itemId = $item['item_id'] ?? $item['id'] ?? null;
            $itemName = $item['name'] ?? $item['description'] ?? 'Item';
            $qty = (int) ($item['quantity'] ?? 1);
            $unitPrice = (int) ($item['unit_price'] ?? $item['price_minor'] ?? 0);
            $itemTotal = (int) ($item['amount'] ?? ($unitPrice * $qty));

            if (! $itemId || ! PosItem::where('tenant_id', $tenantId)->where('id', $itemId)->exists()) {
                $posItem = PosItem::where('tenant_id', $tenantId)->first();
                if (! $posItem) {
                    $category = PosCategory::where('tenant_id', $tenantId)->first();
                    if (! $category) {
                        $category = PosCategory::create([
                            'tenant_id' => $tenantId,
                            'property_id' => $propertyId,
                            'department' => $department,
                            'name' => 'General',
                            'is_active' => true,
                        ]);
                    }

                    $posItem = PosItem::create([
                        'tenant_id' => $tenantId,
                        'property_id' => $propertyId,
                        'pos_category_id' => $category->id,
                        'name' => $itemName,
                        'department' => $department,
                        'price_minor' => $unitPrice,
                        'is_available' => true,
                    ]);
                }
                $itemId = $posItem->id;
            }

            PosOrderItem::create([
                'pos_order_id' => $posOrder->id,
                'pos_item_id' => $itemId,
                'item_name' => $itemName,
                'quantity' => $qty,
                'unit_price_minor' => $unitPrice,
                'total_minor' => $itemTotal,
                'notes' => $item['notes'] ?? null,
            ]);
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

        if (!$roomId) {
            throw new Exception("Room ID is required for housekeeping update.");
        }

        $room = Room::where('tenant_id', $user->tenant_id)->findOrFail($roomId);
        $room->update(['status' => $status]);

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
            'notes' => ($payload['notes'] ?? '') . ' [Created offline]',
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
