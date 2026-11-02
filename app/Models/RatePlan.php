<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RatePlan extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'code',
        'name',
        'meal_plan',
        'is_resident_only',
        'cancellation_policy',
        'rules',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_resident_only' => 'boolean',
            'cancellation_policy' => 'array',
            'rules' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function rates(): HasMany
    {
        return $this->hasMany(Rate::class);
    }

    /**
     * Ensure standard default hotel rate plans and meal basis exist for a given property.
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

        $defaults = [
            [
                'code' => 'BB-STD',
                'name' => 'Bed & Breakfast (BB)',
                'meal_plan' => 'BB',
                'is_resident_only' => false,
            ],
            [
                'code' => 'HB-STD',
                'name' => 'Half Board - Breakfast & Dinner (HB)',
                'meal_plan' => 'HB',
                'is_resident_only' => false,
            ],
            [
                'code' => 'FB-STD',
                'name' => 'Full Board - All Meals (FB)',
                'meal_plan' => 'FB',
                'is_resident_only' => false,
            ],
            [
                'code' => 'RO-STD',
                'name' => 'Room Only / European Plan (RO)',
                'meal_plan' => 'RO',
                'is_resident_only' => false,
            ],
            [
                'code' => 'AI-STD',
                'name' => 'All Inclusive Package (AI)',
                'meal_plan' => 'AI',
                'is_resident_only' => false,
            ],
        ];

        foreach ($defaults as $plan) {
            static::withoutGlobalScopes()->updateOrCreate(
                [
                    'tenant_id' => $property->tenant_id,
                    'property_id' => $property->id,
                    'code' => $plan['code'],
                ],
                [
                    'name' => $plan['name'],
                    'meal_plan' => $plan['meal_plan'],
                    'is_resident_only' => $plan['is_resident_only'],
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
