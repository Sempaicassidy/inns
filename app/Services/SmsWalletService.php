<?php

namespace App\Services;

use App\Models\SmsMessage;
use App\Models\SmsPricingRule;
use App\Models\SmsWallet;
use App\Models\SmsWalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SmsWalletService
{
    /**
     * Credits required for a message = billable SMS segments (1 credit per segment).
     */
    public function creditsForSegments(int $segments): int
    {
        return max(1, $segments);
    }

    /**
     * Selling price (minor units) for the given number of credits/segments.
     */
    public function priceForCredits(string $tenantId, int $credits): int
    {
        $rule = SmsPricingRule::getEffectiveRule($tenantId);

        return $credits * (int) ($rule->selling_price_per_credit_minor ?? 0);
    }

    /**
     * Debit the tenant SMS wallet and queue an SmsMessage record.
     * Must be called BEFORE submitting to the SMS provider.
     *
     * @return array{success: bool, message?: SmsMessage, error?: string, already_exists?: bool}
     */
    public function debitForMessage(
        string $tenantId,
        string $recipientPhone,
        string $messageText,
        int $segments,
        ?string $senderId = null,
        ?string $propertyId = null,
        ?string $contextType = null,
        ?string $contextId = null,
        ?string $idempotencyKey = null,
        ?int $performedByUserId = null,
        ?string $provider = null,
    ): array {
        $idempotencyKey ??= (string) Str::uuid();
        $credits = $this->creditsForSegments($segments);

        return DB::transaction(function () use (
            $tenantId, $recipientPhone, $messageText, $segments, $credits,
            $senderId, $propertyId, $contextType, $contextId,
            $idempotencyKey, $performedByUserId, $provider
        ) {
            // Idempotency: same key returns the existing record
            $existing = SmsMessage::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return ['success' => true, 'message' => $existing, 'already_exists' => true];
            }

            $wallet = SmsWallet::where('tenant_id', $tenantId)
                ->lockForUpdate()
                ->first();

            if (! $wallet || $wallet->status !== 'active') {
                return ['success' => false, 'error' => 'SMS wallet is not active for this tenant.'];
            }

            if ((int) $wallet->balance_credits < $credits) {
                return [
                    'success' => false,
                    'error' => "Insufficient SMS credits. Required: {$credits}, available: {$wallet->balance_credits}.",
                ];
            }

            $rule = SmsPricingRule::getEffectiveRule($tenantId);
            $ratePerCredit = (int) ($rule->selling_price_per_credit_minor ?? 0);
            $amountMinor = $credits * $ratePerCredit;

            $wallet->decrement('balance_credits', $credits);
            $wallet->increment('total_credits_used', $credits);
            $wallet->refresh();

            $smsMessage = SmsMessage::create([
                'tenant_id' => $tenantId,
                'property_id' => $propertyId,
                'sms_wallet_id' => $wallet->id,
                'recipient_phone' => $recipientPhone,
                'message' => $messageText,
                'sender_id' => $senderId ?: 'THEINNS',
                'characters_count' => mb_strlen($messageText),
                'segments_count' => $segments,
                'credits_deducted' => $credits,
                'provider' => $provider ?? 'swalasms',
                'status' => 'queued',
                'context_type' => $contextType ?: 'general',
                'context_id' => $contextId,
                'idempotency_key' => $idempotencyKey,
                'sent_by_user_id' => $performedByUserId,
            ]);

            SmsWalletTransaction::create([
                'tenant_id' => $tenantId,
                'sms_wallet_id' => $wallet->id,
                'type' => 'deduction',
                'credits' => -$credits,
                'balance_after' => (int) $wallet->balance_credits,
                'rate_per_credit_minor' => $ratePerCredit,
                'amount_minor' => $amountMinor,
                'currency' => $rule->currency ?? 'TZS',
                'reference' => $smsMessage->id,
                'idempotency_key' => $idempotencyKey,
                'description' => "SMS to {$recipientPhone} ({$segments} segment(s))",
                'sms_message_id' => $smsMessage->id,
                'performed_by_user_id' => $performedByUserId,
            ]);

            return ['success' => true, 'message' => $smsMessage];
        });
    }

    /**
     * Mark an SmsMessage as sent/failed/delivered after provider response.
     * Failed messages are automatically refunded to the wallet.
     */
    public function finalizeMessage(SmsMessage $smsMessage, string $status, ?string $providerMessageId = null, ?string $description = null, ?string $error = null): void
    {
        $terminalFailure = in_array($status, ['failed', 'rejected'], true);

        DB::transaction(function () use ($smsMessage, $status, $providerMessageId, $description, $error, $terminalFailure) {
            $smsMessage->update([
                'status' => $status,
                'provider_message_id' => $providerMessageId ?? $smsMessage->provider_message_id,
                'status_description' => $description,
                'error_message' => $error,
                'sent_at' => in_array($status, ['sent', 'delivered'], true) ? now() : $smsMessage->sent_at,
                'delivered_at' => $status === 'delivered' ? now() : $smsMessage->delivered_at,
            ]);

            if ($terminalFailure && (int) $smsMessage->credits_deducted > 0) {
                $this->refundCredits($smsMessage, 'SMS send failed — credits refunded');
            }
        });
    }

    /**
     * Refund credits for a failed message exactly once.
     */
    protected function refundCredits(SmsMessage $smsMessage, string $reason): void
    {
        $credits = (int) $smsMessage->credits_deducted;
        if ($credits <= 0) {
            return;
        }

        $alreadyRefunded = SmsWalletTransaction::where('sms_message_id', $smsMessage->id)
            ->where('type', 'refund')
            ->exists();

        if ($alreadyRefunded) {
            return;
        }

        $wallet = SmsWallet::where('id', $smsMessage->sms_wallet_id)->lockForUpdate()->first();
        if (! $wallet) {
            return;
        }

        $wallet->increment('balance_credits', $credits);
        $wallet->decrement('total_credits_used', $credits);
        $wallet->refresh();

        SmsWalletTransaction::create([
            'tenant_id' => $smsMessage->tenant_id,
            'sms_wallet_id' => $wallet->id,
            'type' => 'refund',
            'credits' => $credits,
            'balance_after' => (int) $wallet->balance_credits,
            'rate_per_credit_minor' => 0,
            'amount_minor' => 0,
            'currency' => 'TZS',
            'reference' => $smsMessage->id.':refund',
            'idempotency_key' => $smsMessage->idempotency_key.':refund',
            'description' => $reason,
            'sms_message_id' => $smsMessage->id,
        ]);

        $smsMessage->update(['credits_deducted' => 0]);
    }
}
