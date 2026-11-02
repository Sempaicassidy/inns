<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SaasReceipt extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'receipt_number',
        'tenant_id',
        'saas_invoice_id',
        'saas_payment_id',
        'customer_name',
        'amount_paid_minor',
        'currency',
        'payment_method',
        'payment_reference',
        'issued_at',
        'access_token',
    ];

    protected function casts(): array
    {
        return [
            'amount_paid_minor' => 'integer',
            'issued_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->access_token)) {
                $model->access_token = Str::random(40);
            }
            if (empty($model->receipt_number)) {
                $count = static::count() + 1;
                $model->receipt_number = 'RCT-'.date('Y').'-'.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
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

    public function payment(): BelongsTo
    {
        return $this->belongsTo(SaasPayment::class, 'saas_payment_id');
    }
}
