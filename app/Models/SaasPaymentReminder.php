<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaasPaymentReminder extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id',
        'saas_subscription_id',
        'saas_invoice_id',
        'reminder_type',
        'channel',
        'sent_to',
        'status',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(SaasSubscription::class, 'saas_subscription_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(SaasInvoice::class, 'saas_invoice_id');
    }
}
