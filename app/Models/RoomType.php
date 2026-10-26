<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomType extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'code',
        'name',
        'base_occupancy',
        'max_adults',
        'max_children',
        'base_price_minor',
        'amenities',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'base_occupancy' => 'integer',
            'max_adults' => 'integer',
            'max_children' => 'integer',
            'base_price_minor' => 'integer',
            'amenities' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function rates(): HasMany
    {
        return $this->hasMany(Rate::class);
    }
}
