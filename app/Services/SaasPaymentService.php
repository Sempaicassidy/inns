<?php

namespace App\Services;

use App\Models\SaasInvoice;
use App\Models\SaasPayment;
use App\Models\SaasReceipt;
use App\Models\SystemNotification;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaasPaymentService
{
    public function __construct(
        protected SaasSubscriptionService $subscriptionService
    ) {}

    /**
     * Record a customer payment submission (e.g. Bank slip or Mobile money reference).
     */
    public function recordPayment(SaasInvoice $invoice, array $data): SaasPayment
    {
        return DB::transaction(function () use ($invoice, $data) {
            $amount = $data['amount_minor'] ?? $invoice->balance_minor;

            $payment = SaasPayment::create([
                'tenant_id' => $invoice->tenant_id,
                'saas_invoice_id' => $invoice->id,
                'amount_minor' => $amount,
                'currency' => $invoice->currency,
                'payment_method' => $data['payment_method'] ?? 'bank_transfer',
                'gateway_provider' => $data['gateway_provider'] ?? 'manual',
                'gateway_transaction_id' => $data['gateway_transaction_id'] ?? null,
                'proof_attachment_path' => $data['proof_attachment_path'] ?? null,
                'status' => 'pending',
                'idempotency_key' => $data['idempotency_key'] ?? Str::uuid()->toString(),
                'paid_at' => Carbon::now(),
            ]);

            // Notify Super Admin of pending payment verification
            $superAdmins = User::where('role', 'super_admin')->get();
            foreach ($superAdmins as $sa) {
                SystemNotification::create([
                    'tenant_id' => $sa->tenant_id,
                    'user_id' => $sa->id,
                    'title' => 'Payment Verification Required',
                    'message' => 'Payment of TZS '.number_format($amount / 100)." from {$invoice->customer_name} requires verification ({$payment->payment_reference}).",
                    'category' => 'payment_pending',
                    'severity' => 'warning',
                ]);
            }

            return $payment;
        });
    }

    /**
     * Verify and approve a payment: settles invoice, issues receipt, activates subscription.
     */
    public function verifyPayment(SaasPayment $payment, ?int $verifiedByUserId = null): SaasReceipt
    {
        $adminId = $verifiedByUserId ?? auth()->id() ?? 1;

        return DB::transaction(function () use ($payment, $adminId) {
            $now = Carbon::now();

            // 1. Update Payment status
            $payment->update([
                'status' => 'successful',
                'verified_at' => $now,
                'verified_by_user_id' => $adminId,
            ]);

            // 2. Update Invoice balance and status
            $invoice = $payment->invoice;
            $newPaid = $invoice->paid_amount_minor + $payment->amount_minor;
            $newBalance = max(0, $invoice->total_minor - $newPaid);
            $newStatus = $newBalance <= 0 ? 'paid' : 'partially_paid';

            $invoice->update([
                'paid_amount_minor' => $newPaid,
                'balance_minor' => $newBalance,
                'status' => $newStatus,
                'paid_at' => $newBalance <= 0 ? $now : $invoice->paid_at,
            ]);

            // 3. Automatically issue Official Receipt
            $receipt = SaasReceipt::create([
                'tenant_id' => $invoice->tenant_id,
                'saas_invoice_id' => $invoice->id,
                'saas_payment_id' => $payment->id,
                'customer_name' => $invoice->customer_name,
                'amount_paid_minor' => $payment->amount_minor,
                'currency' => $payment->currency,
                'payment_method' => $payment->payment_method,
                'payment_reference' => $payment->payment_reference,
                'issued_at' => $now,
            ]);

            // 4. If invoice is fully paid and attached to a subscription -> Activate / Reactivate
            if ($newBalance <= 0 && $invoice->saas_subscription_id) {
                $sub = $invoice->subscription;
                if ($sub) {
                    $this->subscriptionService->activateSubscription($sub, $payment);
                }
            }

            // 5. Notify Tenant Owner and Accountant
            $tenant = $payment->tenant;
            if ($tenant) {
                $stakeholders = $tenant->users()
                    ->whereIn('role', ['general_manager', 'owner', 'accountant', 'senior_accountant'])
                    ->get();

                foreach ($stakeholders as $user) {
                    SystemNotification::create([
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'title' => 'Payment Verified & Official Receipt Issued',
                        'message' => 'Payment of TZS '.number_format($payment->amount_minor / 100)." for Invoice #{$invoice->invoice_number} has been verified. Receipt #{$receipt->receipt_number} generated.",
                        'category' => 'payment_verified',
                        'severity' => 'info',
                    ]);
                }
            }

            return $receipt;
        });
    }

    /**
     * Reject a payment submission with reasons.
     */
    public function rejectPayment(SaasPayment $payment, string $reason, int $verifiedByUserId): bool
    {
        return DB::transaction(function () use ($payment, $reason, $verifiedByUserId) {
            $payment->update([
                'status' => 'failed',
                'verified_by_user_id' => $verifiedByUserId,
                'rejection_reason' => $reason,
            ]);

            // Notify Tenant
            $tenant = $payment->tenant;
            if ($tenant) {
                $managers = $tenant->users()->whereIn('role', ['general_manager', 'owner'])->get();
                foreach ($managers as $mgr) {
                    SystemNotification::create([
                        'tenant_id' => $tenant->id,
                        'user_id' => $mgr->id,
                        'title' => 'Payment Verification Rejected',
                        'message' => "Payment #{$payment->payment_reference} could not be verified. Reason: {$reason}. Please re-submit valid payment proof.",
                        'category' => 'payment_rejected',
                        'severity' => 'warning',
                    ]);
                }
            }

            return true;
        });
    }
}
