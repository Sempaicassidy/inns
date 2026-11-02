<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SaasInvoice extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'invoice_number',
        'tenant_id',
        'saas_subscription_id',
        'saas_quotation_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'billing_reason',
        'subtotal_minor',
        'discount_minor',
        'tax_minor',
        'total_minor',
        'paid_amount_minor',
        'balance_minor',
        'currency',
        'status',
        'issue_date',
        'due_date',
        'paid_at',
        'access_token',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_minor' => 'integer',
            'discount_minor' => 'integer',
            'tax_minor' => 'integer',
            'total_minor' => 'integer',
            'paid_amount_minor' => 'integer',
            'balance_minor' => 'integer',
            'issue_date' => 'date',
            'due_date' => 'date',
            'paid_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->access_token)) {
                $model->access_token = Str::random(40);
            }
            if (empty($model->invoice_number)) {
                $count = static::count() + 1;
                $model->invoice_number = 'INV-'.date('Y').'-'.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
            }
            if (! isset($model->balance_minor)) {
                $model->balance_minor = $model->total_minor - ($model->paid_amount_minor ?? 0);
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(SaasSubscription::class, 'saas_subscription_id');
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(SaasQuotation::class, 'saas_quotation_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaasInvoiceItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(SaasPayment::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(SaasReceipt::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid' || $this->balance_minor <= 0;
    }
}
