<?php

namespace Tests\Feature;

use App\Models\SmsPricingRule;
use App\Models\SmsWallet;
use App\Models\SmsWalletTransaction;
use App\Models\Tenant;
use App\Services\SmsWalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SmsWalletServiceTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private SmsWalletService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'SMS Test Hotel',
            'slug' => 'sms-test',
            'plan' => 'enterprise',
        ]);

        SmsPricingRule::create([
            'tenant_id' => $this->tenant->id,
            'provider_cost_per_credit_minor' => 50,
            'selling_price_per_credit_minor' => 100,
            'currency' => 'TZS',
            'is_active' => true,
        ]);

        $this->service = app(SmsWalletService::class);
    }

    private function wallet(int $credits = 10): SmsWallet
    {
        return SmsWallet::create([
            'tenant_id' => $this->tenant->id,
            'balance_credits' => $credits,
            'total_credits_purchased' => $credits,
            'total_credits_used' => 0,
            'status' => 'active',
        ]);
    }

    public function test_debit_reduces_balance_and_creates_ledger(): void
    {
        $wallet = $this->wallet(10);

        $result = $this->service->debitForMessage(
            tenantId: $this->tenant->id,
            recipientPhone: '+255712345678',
            messageText: 'Test message',
            segments: 2,
        );

        $this->assertTrue($result['success']);
        $this->assertSame(8, $wallet->fresh()->balance_credits);
        $this->assertSame(2, $wallet->fresh()->total_credits_used);

        $txn = SmsWalletTransaction::where('sms_wallet_id', $wallet->id)->first();
        $this->assertNotNull($txn);
        $this->assertSame('deduction', $txn->type);
        $this->assertSame(-2, $txn->credits);
        $this->assertSame(8, $txn->balance_after);
        $this->assertSame(200, $txn->amount_minor); // 2 credits * 100 minor
    }

    public function test_insufficient_balance_blocks_debit(): void
    {
        $wallet = $this->wallet(1);

        $result = $this->service->debitForMessage(
            tenantId: $this->tenant->id,
            recipientPhone: '+255712345678',
            messageText: 'Test',
            segments: 5,
        );

        $this->assertFalse($result['success']);
        $this->assertStringContainsString('Insufficient', $result['error']);
        $this->assertSame(1, $wallet->fresh()->balance_credits);
        $this->assertSame(0, SmsWalletTransaction::count());
    }

    public function test_idempotency_key_prevents_double_debit(): void
    {
        $wallet = $this->wallet(10);
        $key = 'test-idem-123';

        $first = $this->service->debitForMessage(
            tenantId: $this->tenant->id,
            recipientPhone: '+255712345678',
            messageText: 'Test',
            segments: 1,
            idempotencyKey: $key,
        );

        $second = $this->service->debitForMessage(
            tenantId: $this->tenant->id,
            recipientPhone: '+255712345678',
            messageText: 'Test',
            segments: 1,
            idempotencyKey: $key,
        );

        $this->assertTrue($first['success']);
        $this->assertTrue($second['success']);
        $this->assertTrue($second['already_exists'] ?? false);
        $this->assertSame(9, $wallet->fresh()->balance_credits); // only one debit
        $this->assertSame(1, SmsWalletTransaction::count());
    }

    public function test_failed_send_refunds_credits_once(): void
    {
        $wallet = $this->wallet(5);

        $debit = $this->service->debitForMessage(
            tenantId: $this->tenant->id,
            recipientPhone: '+255712345678',
            messageText: 'Test',
            segments: 2,
        );
        $this->assertTrue($debit['success']);
        $this->assertSame(3, $wallet->fresh()->balance_credits);

        $message = $debit['message'];
        $this->service->finalizeMessage($message, 'failed', null, null, 'Provider error');

        $this->assertSame(5, $wallet->fresh()->balance_credits); // refunded
        $this->assertSame('failed', $message->fresh()->status);

        // Second finalize must not double-refund
        $this->service->finalizeMessage($message->fresh(), 'failed');
        $this->assertSame(5, $wallet->fresh()->balance_credits);
        $this->assertSame(1, SmsWalletTransaction::where('type', 'refund')->count());
    }

    public function test_successful_send_marks_sent_no_refund(): void
    {
        $wallet = $this->wallet(5);

        $debit = $this->service->debitForMessage(
            tenantId: $this->tenant->id,
            recipientPhone: '+255712345678',
            messageText: 'Test',
            segments: 1,
        );

        $this->service->finalizeMessage($debit['message'], 'sent', 'PROV-123');

        $this->assertSame(4, $wallet->fresh()->balance_credits);
        $this->assertSame('sent', $debit['message']->fresh()->status);
        $this->assertSame('PROV-123', $debit['message']->fresh()->provider_message_id);
        $this->assertSame(0, SmsWalletTransaction::where('type', 'refund')->count());
    }

    public function test_inactive_wallet_blocks_debit(): void
    {
        SmsWallet::create([
            'tenant_id' => $this->tenant->id,
            'balance_credits' => 100,
            'status' => 'suspended',
        ]);

        $result = $this->service->debitForMessage(
            tenantId: $this->tenant->id,
            recipientPhone: '+255712345678',
            messageText: 'Test',
            segments: 1,
        );

        $this->assertFalse($result['success']);
    }
}
