<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmsWallet extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'balance_credits',
        'total_credits_purchased',
        'total_credits_used',
        'status',
        'spending_limit_daily',
        'spending_limit_monthly',
        'expires_at',
        'last_issued_at',
        'last_issued_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'balance_credits' => 'integer',
            'total_credits_purchased' => 'integer',
            'total_credits_used' => 'integer',
            'spending_limit_daily' => 'integer',
            'spending_limit_monthly' => 'integer',
            'expires_at' => 'datetime',
            'last_issued_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(SmsWalletTransaction::class)->latest();
    }

    public function issues(): HasMany
    {
        return $this->hasMany(SmsWalletIssue::class)->latest();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SmsMessage::class)->latest();
    }

    public function isActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function canSpend(int $credits = 1): bool
    {
        return $this->isActive() && $this->balance_credits >= $credits;
    }
}
