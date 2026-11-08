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
        'features',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'max_branches' => 'integer',
            'subscription_price' => 'decimal:2',
            'license_expiry' => 'date',
            'settings' => 'array',
            'features' => 'array',
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

    public const AVAILABLE_FEATURES = [
        'calendar' => [
            'key' => 'calendar',
            'name' => 'Room Availability Calendar',
            'category' => 'Front Office',
            'description' => 'Interactive Gantt visual timeline of room bookings, blocks, and availability.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'reservations' => [
            'key' => 'reservations',
            'name' => 'Reservations & Booking Engine',
            'category' => 'Front Office',
            'description' => 'Direct check-in, check-out, room rates, and reservation lifecycle.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'housekeeping' => [
            'key' => 'housekeeping',
            'name' => 'Housekeeping & Room Matrix',
            'category' => 'Front Office',
            'description' => 'Housekeeping statuses, room cleaning tasks, and room matrix management.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'maintenance' => [
            'key' => 'maintenance',
            'name' => 'Facility Maintenance',
            'category' => 'Operations',
            'description' => 'Maintenance work orders, defect tickets, and room repair tracking.',
            'default_starter' => false,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'guests' => [
            'key' => 'guests',
            'name' => 'Guest CRM & Directory',
            'category' => 'Front Office',
            'description' => 'Guest profiles, stay history, ID numbers, and VIP classification.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'folios' => [
            'key' => 'folios',
            'name' => 'Guest Billing & Folios',
            'category' => 'Front Office',
            'description' => 'Guest billing folios, advance payments, invoicing, and checkout settlements.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'front_office_reports' => [
            'key' => 'front_office_reports',
            'name' => 'Front Office Shift Reports',
            'category' => 'Front Office',
            'description' => 'Daily receptionist shift progress, handovers, and manager submissions.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'restaurant_pos' => [
            'key' => 'restaurant_pos',
            'name' => 'Restaurant & Bar POS',
            'category' => 'Food & Beverage',
            'description' => 'Restaurant dining orders, Kitchen Order Tickets (KOT), and dining revenue.',
            'default_starter' => false,
            'default_pro' => false,
            'default_enterprise' => true,
        ],
        'grocery_pos' => [
            'key' => 'grocery_pos',
            'name' => 'Supermarket / Minimart POS',
            'category' => 'Retail',
            'description' => 'Retail grocery point of sale, barcode scanning, and store counter billing.',
            'default_starter' => false,
            'default_pro' => false,
            'default_enterprise' => true,
        ],
        'inventory' => [
            'key' => 'inventory',
            'name' => 'Central Warehouse & Store',
            'category' => 'Inventory',
            'description' => 'Store inventory, stock valuation, supplier purchasing, and stock ledger.',
            'default_starter' => false,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'hr_payroll' => [
            'key' => 'hr_payroll',
            'name' => 'Staff Directory, HR & Payroll',
            'category' => 'Human Resources',
            'description' => 'Employee contracts, attendance, leave management, and monthly payroll slips.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'accounting' => [
            'key' => 'accounting',
            'name' => 'Double-Entry Accounting & Ledger',
            'category' => 'Finance',
            'description' => 'Chart of Accounts, Journal Entries, Trial Balance, P&L, Balance Sheet, and cashbook.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'hotel_reports' => [
            'key' => 'hotel_reports',
            'name' => 'Hotel Executive Analytics',
            'category' => 'Management',
            'description' => 'RevPAR, ADR, occupancy percentages, and executive revenue charts.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'manager_alerts' => [
            'key' => 'manager_alerts',
            'name' => 'Manager Real-Time Alerts',
            'category' => 'Management',
            'description' => 'Automated SMS/WhatsApp flash alerts for GM on check-ins, payments, and audits.',
            'default_starter' => false,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'whatsapp_sms' => [
            'key' => 'whatsapp_sms',
            'name' => 'Guest WhatsApp & SMS',
            'category' => 'Communications',
            'description' => 'Direct SMS & WhatsApp messaging, booking confirmations, and marketing broadcasts.',
            'default_starter' => false,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'branding_settings' => [
            'key' => 'branding_settings',
            'name' => 'Hotel & Receipt Branding',
            'category' => 'Settings',
            'description' => 'Custom logo, header, footer, TIN/VRN, Wi-Fi credentials, and statutory details.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
        'data_entry_hub' => [
            'key' => 'data_entry_hub',
            'name' => 'CSV Data Hub & Bulk Imports',
            'category' => 'Data Management',
            'description' => 'Bulk CSV imports/exports for rooms, guests, inventory, and historical data.',
            'default_starter' => false,
            'default_pro' => false,
            'default_enterprise' => true,
        ],
        'multi_branch' => [
            'key' => 'multi_branch',
            'name' => 'Multi-Property & Branches',
            'category' => 'Enterprise',
            'description' => 'Multiple hotel branches, lodges, or locations under one company group.',
            'default_starter' => false,
            'default_pro' => false,
            'default_enterprise' => true,
        ],
        'offline_pwa' => [
            'key' => 'offline_pwa',
            'name' => 'PWA Offline Standby Mode',
            'category' => 'Mobile & PWA',
            'description' => 'IndexedDB local queue and automatic background data synchronization when offline.',
            'default_starter' => true,
            'default_pro' => true,
            'default_enterprise' => true,
        ],
    ];

    /**
     * Get default features map for a specific plan.
     */
    public static function getPlanFeatureDefaults(?string $plan = null): array
    {
        $plan = strtolower($plan ?? 'pro');
        $defaults = [];
        $keySuffix = match ($plan) {
            'starter', 'basic' => 'default_starter',
            'enterprise', 'ultimate' => 'default_enterprise',
            default => 'default_pro',
        };

        foreach (self::AVAILABLE_FEATURES as $key => $meta) {
            $defaults[$key] = (bool) ($meta[$keySuffix] ?? true);
        }

        return $defaults;
    }

    /**
     * Check if a specific feature is enabled for this tenant.
     */
    public function hasFeature(string $featureKey): bool
    {
        // 1. If explicit tenant-level features override is saved
        if (is_array($this->features) && array_key_exists($featureKey, $this->features)) {
            return (bool) $this->features[$featureKey];
        }

        // 2. Fallback to plan defaults
        $planDefaults = self::getPlanFeatureDefaults($this->plan);
        return $planDefaults[$featureKey] ?? true;
    }

    /**
     * Get complete map of features with their boolean status.
     */
    public function getFeaturesMap(): array
    {
        $planDefaults = self::getPlanFeatureDefaults($this->plan);
        $result = [];

        foreach (self::AVAILABLE_FEATURES as $key => $meta) {
            if (is_array($this->features) && array_key_exists($key, $this->features)) {
                $result[$key] = (bool) $this->features[$key];
            } else {
                $result[$key] = $planDefaults[$key] ?? true;
            }
        }

        return $result;
    }

    /**
     * Get features detailed metadata along with active state for UI control panels.
     */
    public function getFeaturesDetailedList(): array
    {
        $map = $this->getFeaturesMap();
        $list = [];

        foreach (self::AVAILABLE_FEATURES as $key => $meta) {
            $list[] = [
                'key' => $key,
                'name' => $meta['name'],
                'category' => $meta['category'],
                'description' => $meta['description'],
                'enabled' => $map[$key] ?? false,
            ];
        }

        return $list;
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
