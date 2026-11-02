<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Central SMS Provider Configuration (NextSMS)
        Schema::create('sms_provider_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('provider_name', 50)->default('nextsms');
            $table->string('sender_id', 30)->default('NEXTSMS');
            $table->string('base_url', 150)->default('https://messaging-service.co.tz');
            $table->string('username', 100)->nullable();
            $table->text('password')->nullable(); // encrypted
            $table->text('api_token')->nullable(); // encrypted
            $table->string('environment', 30)->default('production'); // production, sandbox
            $table->integer('balance_credits_cached')->default(0);
            $table->timestamp('balance_checked_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        // 2. Tenant SMS Wallets
        Schema::create('sms_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->unique();
            $table->uuid('property_id')->nullable();
            $table->integer('balance_credits')->default(0);
            $table->integer('total_credits_purchased')->default(0);
            $table->integer('total_credits_used')->default(0);
            $table->string('status', 30)->default('inactive'); // inactive, active, suspended, expired
            $table->integer('spending_limit_daily')->nullable();
            $table->integer('spending_limit_monthly')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('last_issued_at')->nullable();
            $table->uuid('last_issued_by_user_id')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });

        // 3. SMS Credit Packages
        Schema::create('sms_credit_packages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100); // e.g. "Starter (500 SMS)", "Standard (1,000 SMS)"
            $table->integer('credits_count'); // 500, 1000, 5000, 10000
            $table->bigInteger('selling_price_minor'); // in TZS cents (e.g. 1000000 = TZS 10,000)
            $table->bigInteger('cost_price_minor')->default(0); // in TZS cents (e.g. 800000 = TZS 8,000)
            $table->string('currency', 10)->default('TZS');
            $table->string('description', 255)->nullable();
            $table->boolean('is_popular')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // 4. SMS Wallet Issuance Records (Super Admin Allocation)
        Schema::create('sms_wallet_issues', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('sms_wallet_id');
            $table->uuid('package_id')->nullable();
            $table->integer('credits_issued');
            $table->bigInteger('unit_cost_minor')->default(1600); // TZS 16.00
            $table->bigInteger('selling_price_minor')->default(2000); // TZS 20.00
            $table->bigInteger('amount_paid_minor')->default(0);
            $table->string('currency', 10)->default('TZS');
            $table->string('payment_method', 50)->default('bank'); // bank, mobile_money, cash, gateway
            $table->string('payment_reference', 100)->nullable();
            $table->boolean('is_verified')->default(true);
            $table->unsignedBigInteger('issued_by_user_id')->nullable();
            $table->timestamp('issued_at');
            $table->timestamp('expires_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('sms_wallet_id')->references('id')->on('sms_wallets')->cascadeOnDelete();
        });

        // 5. SMS Wallet Transactions (Immutable Ledger)
        Schema::create('sms_wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('sms_wallet_id');
            $table->string('type', 40); // allocation, purchase, deduction, refund, adjustment
            $table->integer('credits'); // signed integer (+500, -2)
            $table->integer('balance_after');
            $table->bigInteger('rate_per_credit_minor')->default(2000);
            $table->bigInteger('amount_minor')->default(0);
            $table->string('currency', 10)->default('TZS');
            $table->string('reference', 80)->unique(); // e.g. "TXN-SMS-20261101-ABCD"
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->string('description', 255);
            $table->uuid('sms_message_id')->nullable();
            $table->unsignedBigInteger('performed_by_user_id')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('sms_wallet_id')->references('id')->on('sms_wallets')->cascadeOnDelete();
            $table->index(['tenant_id', 'created_at']);
        });

        // 6. Pricing Rules
        Schema::create('sms_pricing_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable(); // null for global default
            $table->bigInteger('provider_cost_per_credit_minor')->default(1600); // TZS 16.00
            $table->bigInteger('selling_price_per_credit_minor')->default(2000); // TZS 20.00
            $table->string('currency', 10)->default('TZS');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 7. SMS Messages
        Schema::create('sms_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('property_id')->nullable();
            $table->uuid('sms_wallet_id');
            $table->string('recipient_phone', 40);
            $table->text('message');
            $table->string('sender_id', 30)->default('NEXTSMS');
            $table->integer('characters_count')->default(0);
            $table->integer('segments_count')->default(1);
            $table->integer('credits_deducted')->default(1);
            $table->string('provider', 40)->default('nextsms');
            $table->string('provider_message_id', 100)->nullable()->index();
            $table->string('status', 40)->default('sent'); // queued, sent, delivered, failed, rejected
            $table->string('status_description', 255)->nullable();
            $table->text('error_message')->nullable();
            $table->string('context_type', 50)->default('general'); // booking_confirmation, payment_receipt, check_in, check_out, guest_notification, folio
            $table->string('context_id', 100)->nullable(); // reservation_id, payment_id, guest_id
            $table->string('idempotency_key', 100)->nullable()->index();
            $table->unsignedBigInteger('sent_by_user_id')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('sms_wallet_id')->references('id')->on('sms_wallets')->cascadeOnDelete();
            $table->index(['tenant_id', 'context_type']);
            $table->index(['tenant_id', 'status']);
        });

        // 8. SMS Delivery Reports
        Schema::create('sms_delivery_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('sms_message_id')->nullable();
            $table->string('provider_message_id', 100)->nullable()->index();
            $table->string('status', 40);
            $table->string('status_code', 50)->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamp('received_at');
            $table->timestamps();
        });

        // 9. Staff SMS Permissions
        Schema::create('sms_permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->unsignedBigInteger('user_id');
            $table->string('permission', 80); // sms.send, sms.send.booking_confirmation, sms.send.payment_confirmation, sms.send.guest_notification, sms.view_wallet, sms.view_history, sms.purchase
            $table->unsignedBigInteger('granted_by_user_id')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['tenant_id', 'user_id', 'permission'], 'sms_perm_tenant_user_perm_unique');
        });

        // 10. SMS Provider Activity Logs
        Schema::create('sms_provider_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('endpoint', 150);
            $table->string('method', 10)->default('POST');
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->integer('http_status')->default(200);
            $table->integer('duration_ms')->default(0);
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        // 11. SMS Audit Logs
        Schema::create('sms_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('action', 80); // wallet_issued, wallet_suspended, wallet_reactivated, credits_adjusted, permission_granted, permission_revoked
            $table->json('details')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_audit_logs');
        Schema::dropIfExists('sms_provider_logs');
        Schema::dropIfExists('sms_permissions');
        Schema::dropIfExists('sms_delivery_reports');
        Schema::dropIfExists('sms_messages');
        Schema::dropIfExists('sms_pricing_rules');
        Schema::dropIfExists('sms_wallet_transactions');
        Schema::dropIfExists('sms_wallet_issues');
        Schema::dropIfExists('sms_credit_packages');
        Schema::dropIfExists('sms_wallets');
        Schema::dropIfExists('sms_provider_accounts');
    }
};
