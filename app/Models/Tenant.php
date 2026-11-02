<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'subdomain',
        'plan',
        'max_branches',
        'subscription_price',
        'subscription_status',
        'license_expiry',
        'is_active',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'max_branches' => 'integer',
            'subscription_price' => 'decimal:2',
            'license_expiry' => 'date',
            'settings' => 'array',
        ];
    }

    public function canAddBranch(): bool
    {
        return $this->properties()->count() < $this->max_branches;
    }

    public function isExpired(): bool
    {
        return $this->license_expiry && $this->license_expiry->isPast();
    }

    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function smsWallet(): HasOne
    {
        return $this->hasOne(SmsWallet::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(SaasSubscription::class);
    }

    public function activeSubscription(): HasOne
    {
        return $this->hasOne(SaasSubscription::class)->where('status', 'active');
    }

    public function saasInvoices(): HasMany
    {
        return $this->hasMany(SaasInvoice::class);
    }

    public function saasContracts(): HasMany
    {
        return $this->hasMany(SaasContract::class);
    }

    public function saasQuotations(): HasMany
    {
        return $this->hasMany(SaasQuotation::class);
    }

    public function saasPayments(): HasMany
    {
        return $this->hasMany(SaasPayment::class);
    }

    public function saasReceipts(): HasMany
    {
        return $this->hasMany(SaasReceipt::class);
    }
}
