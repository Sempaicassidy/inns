<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SmsPricingRule extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'provider_cost_per_credit_minor',
        'selling_price_per_credit_minor',
        'currency',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'provider_cost_per_credit_minor' => 'integer',
            'selling_price_per_credit_minor' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public static function getEffectiveRule(?string $tenantId = null): self
    {
        if ($tenantId) {
            $tenantRule = self::where('tenant_id', $tenantId)->where('is_active', true)->first();
            if ($tenantRule) {
                return $tenantRule;
            }
        }

        return self::whereNull('tenant_id')->where('is_active', true)->first() ?? new self([
            'provider_cost_per_credit_minor' => 1600, // TZS 16.00
            'selling_price_per_credit_minor' => 2000, // TZS 20.00
            'currency' => 'TZS',
            'is_active' => true,
        ]);
    }
}
