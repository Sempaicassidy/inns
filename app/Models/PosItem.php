<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PosItem extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'pos_category_id',
        'department',
        'name',
        'code',
        'description',
        'price_minor',
        'cost_price_minor',
        'stock_quantity',
        'reorder_level',
        'unit',
        'image',
        'is_available',
    ];

    protected function casts(): array
    {
        return [
            'price_minor' => 'integer',
            'cost_price_minor' => 'integer',
            'stock_quantity' => 'integer',
            'reorder_level' => 'integer',
            'is_available' => 'boolean',
        ];
    }

    public function scopeRestaurant($query)
    {
        return $query->where('department', 'restaurant');
    }

    public function scopeGrocery($query)
    {
        return $query->where('department', 'grocery');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(PosCategory::class, 'pos_category_id');
    }
}
