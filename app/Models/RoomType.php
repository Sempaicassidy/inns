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

    /**
     * Ensure standard default room types and starter rooms exist for a property.
     */
    public static function ensureDefaultsForProperty(Property $property)
    {
        $existing = static::withoutGlobalScopes()
            ->where('property_id', $property->id)
            ->where('is_active', true)
            ->get();

        if ($existing->isNotEmpty()) {
            return $existing;
        }

        $standard = static::withoutGlobalScopes()->create([
            'tenant_id' => $property->tenant_id,
            'property_id' => $property->id,
            'code' => 'STD',
            'name' => 'Standard Executive Room',
            'base_occupancy' => 2,
            'max_adults' => 2,
            'max_children' => 1,
            'base_price_minor' => 18000000, // 180,000 TZS
            'amenities' => ['King Bed', 'En-suite Bathroom', 'WiFi', 'Air Conditioning', 'Flat TV'],
            'description' => 'Comfortable executive room equipped with modern hospitality amenities.',
            'is_active' => true,
        ]);

        $deluxe = static::withoutGlobalScopes()->create([
            'tenant_id' => $property->tenant_id,
            'property_id' => $property->id,
            'code' => 'DLX',
            'name' => 'Deluxe Garden Suite',
            'base_occupancy' => 2,
            'max_adults' => 3,
            'max_children' => 2,
            'base_price_minor' => 28000000, // 280,000 TZS
            'amenities' => ['King Bed', 'Private Balcony', 'Mini Bar', 'Tea & Coffee Maker', 'WiFi'],
            'description' => 'Spacious deluxe suite offering panoramic property views and premium amenities.',
            'is_active' => true,
        ]);

        $villa = static::withoutGlobalScopes()->create([
            'tenant_id' => $property->tenant_id,
            'property_id' => $property->id,
            'code' => 'VILLA',
            'name' => 'Presidential Family Villa',
            'base_occupancy' => 4,
            'max_adults' => 6,
            'max_children' => 3,
            'base_price_minor' => 50000000, // 500,000 TZS
            'amenities' => ['2 Master Bedrooms', 'Private Lounge', 'Dedicated Butler', 'Infinity Deck'],
            'description' => 'Exclusive luxury villa tailored for families and VIP guests.',
            'is_active' => true,
        ]);

        // Create initial starter rooms
        $starterRooms = [
            ['number' => 'Room 101', 'type_id' => $standard->id, 'floor' => 'Ground Floor', 'status' => 'clean'],
            ['number' => 'Room 102', 'type_id' => $standard->id, 'floor' => 'Ground Floor', 'status' => 'clean'],
            ['number' => 'Room 103', 'type_id' => $standard->id, 'floor' => 'Ground Floor', 'status' => 'clean'],
            ['number' => 'Suite 201', 'type_id' => $deluxe->id, 'floor' => '1st Floor', 'status' => 'clean'],
            ['number' => 'Suite 202', 'type_id' => $deluxe->id, 'floor' => '1st Floor', 'status' => 'clean'],
            ['number' => 'Villa 01', 'type_id' => $villa->id, 'floor' => 'VIP Wing', 'status' => 'clean'],
        ];

        foreach ($starterRooms as $sr) {
            Room::withoutGlobalScopes()->updateOrCreate(
                [
                    'tenant_id' => $property->tenant_id,
                    'property_id' => $property->id,
                    'room_number' => $sr['number'],
                ],
                [
                    'room_type_id' => $sr['type_id'],
                    'floor' => $sr['floor'],
                    'status_occupancy' => 'vacant',
                    'status_hk' => $sr['status'],
                    'is_active' => true,
                ]
            );
        }

        return static::withoutGlobalScopes()
            ->where('property_id', $property->id)
            ->where('is_active', true)
            ->get();
    }
}
