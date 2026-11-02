<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SaasSubscription extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'plan_code',
        'billing_cycle',
        'amount_minor',
        'currency',
        'status',
        'starts_at',
        'expires_at',
        'next_billing_at',
        'grace_period_days',
        'grace_period_ends_at',
        'suspended_at',
        'last_reactivated_at',
        'cancellation_reason',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount_minor' => 'integer',
            'grace_period_days' => 'integer',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
            'next_billing_at' => 'datetime',
            'grace_period_ends_at' => 'datetime',
            'suspended_at' => 'datetime',
            'last_reactivated_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SaasSubscriptionPlan::class, 'plan_code', 'code');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(SaasInvoice::class);
    }

    public function contracts(): HasMany
    {
        return $this->hasMany(SaasContract::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function isInGracePeriod(): bool
    {
        return $this->status === 'grace_period' && $this->grace_period_ends_at && $this->grace_period_ends_at->isFuture();
    }
}
