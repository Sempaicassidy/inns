<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaasSubscriptionPlan extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'code',
        'badge',
        'monthly_price_minor',
        'annual_price_minor',
        'max_branches',
        'max_rooms',
        'features',
        'is_active',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price_minor' => 'integer',
            'annual_price_minor' => 'integer',
            'max_branches' => 'integer',
            'max_rooms' => 'integer',
            'features' => 'array',
            'is_active' => 'boolean',
            'display_order' => 'integer',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(SaasSubscription::class, 'plan_code', 'code');
    }
}
