<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosOrderItem extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'pos_order_id',
        'pos_item_id',
        'item_name',
        'unit_price_minor',
        'quantity',
        'total_minor',
        'instructions',
    ];

    protected function casts(): array
    {
        return [
            'unit_price_minor' => 'integer',
            'quantity' => 'integer',
            'total_minor' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(PosOrder::class, 'pos_order_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(PosItem::class, 'pos_item_id');
    }

    public function posItem(): BelongsTo
    {
        return $this->belongsTo(PosItem::class, 'pos_item_id');
    }
}
