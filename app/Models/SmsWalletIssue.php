<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsWalletIssue extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'sms_wallet_id',
        'package_id',
        'credits_issued',
        'unit_cost_minor',
        'selling_price_minor',
        'amount_paid_minor',
        'currency',
        'payment_method',
        'payment_reference',
        'is_verified',
        'issued_by_user_id',
        'issued_at',
        'expires_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'credits_issued' => 'integer',
            'unit_cost_minor' => 'integer',
            'selling_price_minor' => 'integer',
            'amount_paid_minor' => 'integer',
            'is_verified' => 'boolean',
            'issued_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(SmsWallet::class, 'sms_wallet_id');
    }

    public function package(): BelongsTo
    {
        return $this->belongsTo(SmsCreditPackage::class, 'package_id');
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by_user_id');
    }
}
