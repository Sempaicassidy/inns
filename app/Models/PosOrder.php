<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosOrder extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'user_id',
        'order_number',
        'outlet_type',
        'order_type',
        'table_number',
        'stay_id',
        'room_id',
        'guest_name',
        'subtotal_minor',
        'tax_minor',
        'total_minor',
        'payment_status',
        'payment_method',
        'folio_id',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_minor' => 'integer',
            'tax_minor' => 'integer',
            'total_minor' => 'integer',
        ];
    }

    public function scopeRestaurant($query)
    {
        return $query->where('outlet_type', 'restaurant');
    }

    public function scopeGrocery($query)
    {
        return $query->where('outlet_type', 'grocery');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PosOrderItem::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function stay(): BelongsTo
    {
        return $this->belongsTo(Stay::class);
    }

    public function folio(): BelongsTo
    {
        return $this->belongsTo(Folio::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function server(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
