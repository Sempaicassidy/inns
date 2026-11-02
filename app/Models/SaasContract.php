<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class SaasContract extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'contract_number',
        'tenant_id',
        'saas_contract_template_id',
        'saas_subscription_id',
        'saas_quotation_id',
        'title',
        'category',
        'rendered_content',
        'status',
        'access_token',
        'signer_name',
        'signer_email',
        'signer_title',
        'signed_at',
        'signer_ip',
        'signer_user_agent',
        'signature_data',
        'document_hash',
        'valid_from',
        'valid_until',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'signed_at' => 'datetime',
            'valid_from' => 'date',
            'valid_until' => 'date',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->access_token)) {
                $model->access_token = Str::random(40);
            }
            if (empty($model->contract_number)) {
                $count = static::count() + 1;
                $model->contract_number = 'CTR-'.date('Y').'-'.str_pad((string) $count, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(SaasContractTemplate::class, 'saas_contract_template_id');
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(SaasSubscription::class, 'saas_subscription_id');
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(SaasQuotation::class, 'saas_quotation_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(SaasContractAuditLog::class);
    }

    public function isSigned(): bool
    {
        return $this->status === 'signed' && ! empty($this->signed_at);
    }
}
