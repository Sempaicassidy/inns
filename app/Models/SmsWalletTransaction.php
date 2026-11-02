<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SmsWalletTransaction extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'sms_wallet_id',
        'type', // allocation, purchase, deduction, refund, adjustment
        'credits',
        'balance_after',
        'rate_per_credit_minor',
        'amount_minor',
        'currency',
        'reference',
        'idempotency_key',
        'description',
        'sms_message_id',
        'performed_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'credits' => 'integer',
            'balance_after' => 'integer',
            'rate_per_credit_minor' => 'integer',
            'amount_minor' => 'integer',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(SmsWallet::class, 'sms_wallet_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by_user_id');
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(SmsMessage::class, 'sms_message_id');
    }

    public static function generateReference(string $type = 'TXN'): string
    {
        $prefix = match ($type) {
            'allocation' => 'ALC',
            'purchase' => 'PUR',
            'deduction' => 'DED',
            'refund' => 'RFD',
            'adjustment' => 'ADJ',
            default => 'SMS',
        };

        return 'TXN-'.$prefix.'-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(4)));
    }
}
