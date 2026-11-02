<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsDeliveryReport extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'sms_message_id',
        'provider_message_id',
        'status',
        'status_code',
        'raw_payload',
        'received_at',
    ];

    protected function casts(): array
    {
        return [
            'raw_payload' => 'array',
            'received_at' => 'datetime',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(SmsMessage::class, 'sms_message_id');
    }
}
