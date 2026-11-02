<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SaasPayment extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'payment_reference',
        'tenant_id',
        'saas_invoice_id',
        'amount_minor',
        'currency',
        'payment_method',
        'gateway_provider',
        'gateway_transaction_id',
        'proof_attachment_path',
        'status',
        'verified_at',
        'verified_by_user_id',
        'rejection_reason',
        'idempotency_key',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount_minor' => 'integer',
            'verified_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->payment_reference)) {
                $count = static::count() + 1;
                $model->payment_reference = 'PAY-'.date('Y').'-'.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SaasInvoice::class, 'saas_invoice_id');
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(SaasReceipt::class, 'saas_payment_id');
    }

    public function isVerified(): bool
    {
        return $this->status === 'successful' && ! empty($this->verified_at);
    }
}
