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

    /**
     * Get a setting from the JSON settings store with fallback.
     */
    public function getSetting(string $key, mixed $default = null): mixed
    {
        return $this->settings[$key] ?? $default;
    }

    /**
     * Get system display name for this tenant.
     */
    public function getSystemNameAttribute(): string
    {
        return $this->getSetting('system_name', $this->name ?? 'THE INNS');
    }

    /**
     * Get SMS / WhatsApp sender brand name.
     */
    public function getSenderIdAttribute(): string
    {
        return $this->getSetting('sender_id', $this->name ?? 'THE INNS');
    }

    /**
     * Get Tax Identification Number (TIN).
     */
    public function getTinAttribute(): ?string
    {
        return $this->getSetting('tin');
    }

    /**
     * Get VAT Registration Number (VRN).
     */
    public function getVrnAttribute(): ?string
    {
        return $this->getSetting('vrn');
    }

    /**
     * Get customized receipt header.
     */
    public function getReceiptHeaderAttribute(): string
    {
        return $this->getSetting('receipt_header', 'OFFICIAL CASH RECEIPT / INVOICE');
    }

    /**
     * Get customized receipt footer terms note.
     */
    public function getReceiptFooterAttribute(): string
    {
        return $this->getSetting('receipt_footer', 'Thank you for your patronage! Goods & services once paid are non-refundable.');
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
