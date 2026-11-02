<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SaasQuotation extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'quotation_number',
        'tenant_id',
        'customer_name',
        'customer_email',
        'customer_phone',
        'company_name',
        'plan_code',
        'subtotal_minor',
        'discount_minor',
        'tax_minor',
        'total_minor',
        'currency',
        'status',
        'valid_until',
        'terms_and_conditions',
        'access_token',
        'sent_at',
        'viewed_at',
        'accepted_at',
        'rejected_at',
        'rejection_reason',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'subtotal_minor' => 'integer',
            'discount_minor' => 'integer',
            'tax_minor' => 'integer',
            'total_minor' => 'integer',
            'valid_until' => 'date',
            'sent_at' => 'datetime',
            'viewed_at' => 'datetime',
            'accepted_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->access_token)) {
                $model->access_token = Str::random(40);
            }
            if (empty($model->quotation_number)) {
                $count = static::count() + 1;
                $model->quotation_number = 'QT-'.date('Y').'-'.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaasQuotationItem::class);
    }
}
