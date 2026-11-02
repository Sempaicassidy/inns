<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\SaasInvoice;
use App\Models\SaasInvoiceItem;
use App\Models\SaasPayment;
use App\Models\SaasSubscription;
use App\Models\SystemNotification;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SaasSubscriptionService
{
    /**
     * Plan pricing defaults in minor units (cents).
     */
    public const PLAN_PRICES = [
        'starter' => 12000000,    // TZS 120,000 / month
        'pro' => 28000000,        // TZS 280,000 / month
        'enterprise' => 65000000, // TZS 650,000 / month
    ];

    /**
     * Create a new subscription record for a tenant.
     */
    public function createSubscription(Tenant $tenant, string $planCode, string $billingCycle = 'monthly', ?int $customAmount = null): SaasSubscription
    {
        $amount = $customAmount ?? self::PLAN_PRICES[$planCode] ?? 28000000;

        return SaasSubscription::create([
            'tenant_id' => $tenant->id,
            'plan_code' => $planCode,
            'billing_cycle' => $billingCycle,
            'amount_minor' => $amount,
            'currency' => 'TZS',
            'status' => 'pending',
            'grace_period_days' => 3,
            'notes' => 'Created via SaaS Lifecycle Engine',
        ]);
    }

    /**
     * Activate a subscription upon verified payment & contract.
     */
    public function activateSubscription(SaasSubscription $subscription, ?SaasPayment $payment = null): bool
    {
        return DB::transaction(function () use ($subscription) {
            $now = Carbon::now();
            $durationMonths = match ($subscription->billing_cycle) {
                'quarterly' => 3,
                'annually' => 12,
                default => 1,
            };

            $expiresAt = ($subscription->expires_at && $subscription->expires_at->isFuture())
                ? $subscription->expires_at->copy()->addMonths($durationMonths)
                : $now->copy()->addMonths($durationMonths);

            $subscription->update([
                'status' => 'active',
                'starts_at' => $subscription->starts_at ?? $now,
                'expires_at' => $expiresAt,
                'next_billing_at' => $expiresAt->copy()->subDays(7),
                'grace_period_ends_at' => null,
                'suspended_at' => null,
                'last_reactivated_at' => $now,
            ]);

            // Update Tenant model
            $subscription->tenant->update([
                'plan' => $subscription->plan_code,
                'subscription_status' => 'active',
                'license_expiry' => $expiresAt->toDateString(),
                'is_active' => true,
            ]);

            // Notify Tenant Owner / Managers
            $this->notifyTenantUsers(
                $subscription->tenant,
                'Subscription Activated Successfully',
                "Your {$subscription->plan_code} subscription is now ACTIVE until {$expiresAt->format('d M Y')}. All hotel modules are restored.",
                'subscription_activated'
            );

            // Notify Super Admin
            $this->notifySuperAdmins(
                'Tenant Subscription Activated',
                "Tenant {$subscription->tenant->name} has activated their {$subscription->plan_code} subscription until {$expiresAt->format('d M Y')}."
            );

            return true;
        });
    }

    /**
     * Generate an automated renewal invoice for a subscription.
     */
    public function generateRenewalInvoice(SaasSubscription $subscription): SaasInvoice
    {
        // Idempotency check: don't create duplicate unpaid invoices for the same upcoming cycle
        $existing = SaasInvoice::where('saas_subscription_id', $subscription->id)
            ->where('billing_reason', 'renewal')
            ->whereIn('status', ['unpaid', 'partially_paid'])
            ->first();

        if ($existing) {
            return $existing;
        }

        $now = Carbon::now();
        $dueDate = $subscription->expires_at ?? $now->copy()->addDays(7);

        return DB::transaction(function () use ($subscription, $now, $dueDate) {
            $invoice = SaasInvoice::create([
                'tenant_id' => $subscription->tenant_id,
                'saas_subscription_id' => $subscription->id,
                'customer_name' => $subscription->tenant->name,
                'customer_email' => $subscription->tenant->users()->first()?->email ?? 'billing@hotel.com',
                'billing_reason' => 'renewal',
                'subtotal_minor' => $subscription->amount_minor,
                'discount_minor' => 0,
                'tax_minor' => 0,
                'total_minor' => $subscription->amount_minor,
                'paid_amount_minor' => 0,
                'balance_minor' => $subscription->amount_minor,
                'currency' => $subscription->currency,
                'status' => 'unpaid',
                'issue_date' => $now->toDateString(),
                'due_date' => $dueDate->toDateString(),
                'notes' => "Automated renewal invoice for {$subscription->plan_code} tier.",
            ]);

            SaasInvoiceItem::create([
                'saas_invoice_id' => $invoice->id,
                'description' => "THE INNS SaaS Subscription Renewal — {$subscription->plan_code} Plan (".ucfirst($subscription->billing_cycle).')',
                'quantity' => 1,
                'unit_price_minor' => $subscription->amount_minor,
                'total_minor' => $subscription->amount_minor,
            ]);

            // Notify Tenant
            $this->notifyTenantUsers(
                $subscription->tenant,
                "Renewal Invoice Generated ({$invoice->invoice_number})",
                "Your subscription renewal invoice for {$subscription->plan_code} is ready. Due date: {$dueDate->format('d M Y')}.",
                'invoice_renewal'
            );

            return $invoice;
        });
    }

    /**
     * Move expired unpaid subscription into Grace Period (Default: 3 days).
     */
    public function enterGracePeriod(SaasSubscription $subscription): void
    {
        $graceEndsAt = Carbon::now()->addDays($subscription->grace_period_days ?? 3);

        $subscription->update([
            'status' => 'grace_period',
            'grace_period_ends_at' => $graceEndsAt,
        ]);

        $subscription->tenant->update([
            'subscription_status' => 'grace_period',
        ]);

        $this->notifyTenantUsers(
            $subscription->tenant,
            'Grace Period Warning — Payment Due Immediately',
            "Your subscription has expired. You have entered a {$subscription->grace_period_days}-day grace period ending on {$graceEndsAt->format('d M Y H:i')}. Please settle outstanding invoices to avoid automated service suspension.",
            'grace_period'
        );
    }

    /**
     * Automatically suspend tenant's paid functionality when grace period ends.
     */
    public function suspendSubscription(SaasSubscription $subscription, string $reason = 'Unpaid subscription past grace period'): void
    {
        DB::transaction(function () use ($subscription, $reason) {
            $now = Carbon::now();

            $subscription->update([
                'status' => 'suspended',
                'suspended_at' => $now,
                'cancellation_reason' => $reason,
            ]);

            $subscription->tenant->update([
                'subscription_status' => 'suspended',
                'is_active' => false,
            ]);

            $this->notifyTenantUsers(
                $subscription->tenant,
                'Account Suspended Due to Overdue Balance',
                'Your hotel management access has been suspended due to overdue invoices. Access the Billing & Recovery Portal to settle payment and restore services instantly.',
                'subscription_suspended'
            );

            $this->notifySuperAdmins(
                'Tenant Automatically Suspended',
                "Tenant {$subscription->tenant->name} has been suspended automatically after grace period expired."
            );
        });
    }

    /**
     * Automatically restore suspended subscription upon verified payment.
     */
    public function reactivateSubscription(SaasSubscription $subscription): void
    {
        $this->activateSubscription($subscription);
    }

    /**
     * Run daily automated lifecycle monitoring across all tenants.
     */
    public function runDailyLifecycleMonitoring(): array
    {
        $now = Carbon::now();
        $stats = [
            'renewals_generated' => 0,
            'reminders_sent' => 0,
            'entered_grace_period' => 0,
            'suspended' => 0,
        ];

        // 1. Generate renewal invoices for active subscriptions expiring within 7 days
        $upcoming = SaasSubscription::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', $now->copy()->addDays(7))
            ->get();

        foreach ($upcoming as $sub) {
            $this->generateRenewalInvoice($sub);
            $stats['renewals_generated']++;
        }

        // 2. Expired active subscriptions move to Grace Period
        $expired = SaasSubscription::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', $now)
            ->get();

        foreach ($expired as $sub) {
            $this->enterGracePeriod($sub);
            $stats['entered_grace_period']++;
        }

        // 3. Grace Period expired -> Suspend
        $overdueGrace = SaasSubscription::where('status', 'grace_period')
            ->whereNotNull('grace_period_ends_at')
            ->where('grace_period_ends_at', '<', $now)
            ->get();

        foreach ($overdueGrace as $sub) {
            $this->suspendSubscription($sub, 'Automated suspension: 3-day grace period expired with unpaid balance.');
            $stats['suspended']++;
        }

        return $stats;
    }

    /**
     * Helper to send notification to Tenant users.
     */
    protected function notifyTenantUsers(Tenant $tenant, string $title, string $message, string $category): void
    {
        $users = $tenant->users()->get();
        foreach ($users as $u) {
            SystemNotification::create([
                'tenant_id' => $tenant->id,
                'user_id' => $u->id,
                'title' => $title,
                'message' => $message,
                'category' => $category,
                'severity' => in_array($category, ['subscription_suspended', 'grace_period']) ? 'critical' : 'info',
            ]);
        }
    }

    /**
     * Helper to send notification to Super Admins.
     */
    protected function notifySuperAdmins(string $title, string $message): void
    {
        $superAdmins = User::where('role', 'super_admin')->get();
        foreach ($superAdmins as $sa) {
            SystemNotification::create([
                'tenant_id' => $sa->tenant_id,
                'user_id' => $sa->id,
                'title' => $title,
                'message' => $message,
                'category' => 'super_admin_alert',
                'severity' => 'info',
            ]);
        }
    }
}
