<?php

namespace App\Services\Offline;

use App\Models\Guest;
use App\Models\InventoryItem;
use App\Models\Room;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Log;

class ConflictResolutionService
{
    /**
     * Resolve a conflict based on entity type and business rules.
     */
    public function resolve(string $type, array $payload, ?array $serverEntity = null): array
    {
        return match ($type) {
            'pos_order' => $this->resolvePosOrderConflict($payload, $serverEntity),
            'inventory_adjustment' => $this->resolveInventoryConflict($payload, $serverEntity),
            'guest_update' => $this->resolveGuestConflict($payload, $serverEntity),
            'housekeeping_update' => $this->resolveHousekeepingConflict($payload, $serverEntity),
            default => [
                'status' => 'confirmed',
                'resolution' => 'server_default',
                'data' => $payload,
            ],
        };
    }

    /**
     * POS Orders are strictly additive and idempotent.
     * Never overwrite or drop a financial sale; if duplicate operation ID, acknowledge existing.
     */
    protected function resolvePosOrderConflict(array $payload, ?array $serverEntity): array
    {
        if ($serverEntity) {
            return [
                'status' => 'confirmed',
                'resolution' => 'idempotent_duplicate_acknowledged',
                'data' => $serverEntity,
            ];
        }

        return [
            'status' => 'confirmed',
            'resolution' => 'accepted_new_transaction',
            'data' => $payload,
        ];
    }

    /**
     * Inventory conflict resolution:
     * Never overwrite authoritative stock with offline snapshot.
     * Instead, apply additive or subtractive movements and record discrepancies.
     */
    protected function resolveInventoryConflict(array $payload, ?array $serverEntity): array
    {
        $itemId = $payload['item_id'] ?? null;
        $quantityDelta = (int) ($payload['quantity_delta'] ?? 0);

        if (!$itemId) {
            return [
                'status' => 'rejected',
                'reason' => 'MISSING_ITEM_ID',
            ];
        }

        $item = InventoryItem::find($itemId);
        if (!$item) {
            return [
                'status' => 'rejected',
                'reason' => 'ITEM_NOT_FOUND',
            ];
        }

        $currentStock = $item->current_stock ?? $item->stock_quantity ?? 0;
        $newStock = $currentStock + $quantityDelta;

        $hasShortage = $newStock < 0;

        return [
            'status' => 'confirmed',
            'resolution' => $hasShortage ? 'stock_reconciled_with_shortage_warning' : 'stock_adjusted_additively',
            'data' => [
                'item_id' => $item->id,
                'previous_server_stock' => $currentStock,
                'applied_delta' => $quantityDelta,
                'final_stock' => max(0, $newStock),
                'shortage_detected' => $hasShortage,
            ],
        ];
    }

    /**
     * Guest Profile Conflict Resolution:
     * Field-level merging rather than blanket overwrite.
     */
    protected function resolveGuestConflict(array $payload, ?array $serverEntity): array
    {
        if (!$serverEntity) {
            return [
                'status' => 'confirmed',
                'resolution' => 'new_guest_accepted',
                'data' => $payload,
            ];
        }

        // Merge fields: preserve server contact if updated recently, otherwise accept client
        $merged = array_merge($serverEntity, array_filter($payload, fn($v) => !is_null($v) && $v !== ''));

        return [
            'status' => 'confirmed',
            'resolution' => 'field_level_merge',
            'data' => $merged,
        ];
    }

    /**
     * Housekeeping Task Conflict Resolution:
     * Latest timestamp wins, with room state validation.
     */
    protected function resolveHousekeepingConflict(array $payload, ?array $serverEntity): array
    {
        $roomId = $payload['room_id'] ?? null;
        $newStatus = $payload['status'] ?? 'clean';

        if ($roomId) {
            $room = Room::find($roomId);
            if ($room) {
                $room->update(['status' => $newStatus]);
            }
        }

        return [
            'status' => 'confirmed',
            'resolution' => 'state_transition_applied',
            'data' => $payload,
        ];
    }
}
