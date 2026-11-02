<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SmsMessage extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'sms_wallet_id',
        'recipient_phone',
        'message',
        'sender_id',
        'characters_count',
        'segments_count',
        'credits_deducted',
        'provider',
        'provider_message_id',
        'status', // queued, sent, delivered, failed, rejected
        'status_description',
        'error_message',
        'context_type', // booking_confirmation, payment_receipt, check_in, check_out, guest_notification, folio
        'context_id',
        'idempotency_key',
        'sent_by_user_id',
        'sent_at',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'characters_count' => 'integer',
            'segments_count' => 'integer',
            'credits_deducted' => 'integer',
            'sent_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(SmsWallet::class, 'sms_wallet_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sent_by_user_id');
    }

    public function deliveryReports(): HasMany
    {
        return $this->hasMany(SmsDeliveryReport::class);
    }
}
