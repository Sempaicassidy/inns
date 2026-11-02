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
        // 1. SaaS Subscription Plans
        Schema::create('saas_subscription_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 100);
            $table->string('code', 50)->unique(); // starter, pro, enterprise
            $table->string('badge', 60)->nullable();
            $table->bigInteger('monthly_price_minor'); // in TZS cents (e.g. 12000000 = 120,000 TZS)
            $table->bigInteger('annual_price_minor')->nullable();
            $table->integer('max_branches')->default(1);
            $table->integer('max_rooms')->nullable(); // null for unlimited
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        // 2. SaaS Subscriptions
        Schema::create('saas_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->string('plan_code', 50);
            $table->string('billing_cycle', 20)->default('monthly'); // monthly, quarterly, annually
            $table->bigInteger('amount_minor');
            $table->string('currency', 10)->default('TZS');
            $table->string('status', 30)->default('pending'); // pending, active, upcoming_renewal, past_due, grace_period, suspended, cancelled, expired
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('next_billing_at')->nullable();
            $table->integer('grace_period_days')->default(3);
            $table->timestamp('grace_period_ends_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('last_reactivated_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
        });

        // 3. SaaS Quotations
        Schema::create('saas_quotations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('quotation_number', 50)->unique(); // QT-2026-000001
            $table->uuid('tenant_id')->nullable(); // nullable for new customer leads
            $table->string('customer_name', 120);
            $table->string('customer_email', 120);
            $table->string('customer_phone', 40)->nullable();
            $table->string('company_name', 120)->nullable();
            $table->string('plan_code', 50)->default('pro');
            $table->bigInteger('subtotal_minor')->default(0);
            $table->bigInteger('discount_minor')->default(0);
            $table->bigInteger('tax_minor')->default(0);
            $table->bigInteger('total_minor')->default(0);
            $table->string('currency', 10)->default('TZS');
            $table->string('status', 30)->default('draft'); // draft, sent, viewed, accepted, rejected, expired, converted, cancelled
            $table->date('valid_until')->nullable();
            $table->text('terms_and_conditions')->nullable();
            $table->string('access_token', 80)->unique();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->unsignedBigInteger('created_by_user_id')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        // 4. SaaS Quotation Items
        Schema::create('saas_quotation_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('saas_quotation_id');
            $table->string('description', 255);
            $table->integer('quantity')->default(1);
            $table->bigInteger('unit_price_minor');
            $table->bigInteger('total_minor');
            $table->timestamps();

            $table->foreign('saas_quotation_id')->references('id')->on('saas_quotations')->cascadeOnDelete();
        });

        // 5. SaaS Invoices
        Schema::create('saas_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('invoice_number', 50)->unique(); // INV-2026-000001
            $table->uuid('tenant_id');
            $table->uuid('saas_subscription_id')->nullable();
            $table->uuid('saas_quotation_id')->nullable();
            $table->string('customer_name', 120);
            $table->string('customer_email', 120);
            $table->string('customer_phone', 40)->nullable();
            $table->string('billing_reason', 50)->default('new_subscription'); // new_subscription, renewal, sms_credits, custom_service
            $table->bigInteger('subtotal_minor')->default(0);
            $table->bigInteger('discount_minor')->default(0);
            $table->bigInteger('tax_minor')->default(0);
            $table->bigInteger('total_minor');
            $table->bigInteger('paid_amount_minor')->default(0);
            $table->bigInteger('balance_minor');
            $table->string('currency', 10)->default('TZS');
            $table->string('status', 30)->default('unpaid'); // draft, unpaid, partially_paid, paid, overdue, cancelled, refunded
            $table->date('issue_date');
            $table->date('due_date');
            $table->timestamp('paid_at')->nullable();
            $table->string('access_token', 80)->unique();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
            $table->index(['due_date', 'status']);
        });

        // 6. SaaS Invoice Items
        Schema::create('saas_invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('saas_invoice_id');
            $table->string('description', 255);
            $table->integer('quantity')->default(1);
            $table->bigInteger('unit_price_minor');
            $table->bigInteger('total_minor');
            $table->timestamps();

            $table->foreign('saas_invoice_id')->references('id')->on('saas_invoices')->cascadeOnDelete();
        });

        // 7. SaaS Payments
        Schema::create('saas_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('payment_reference', 60)->unique(); // PAY-2026-000001
            $table->uuid('tenant_id');
            $table->uuid('saas_invoice_id');
            $table->bigInteger('amount_minor');
            $table->string('currency', 10)->default('TZS');
            $table->string('payment_method', 40)->default('bank_transfer'); // bank_transfer, mobile_money, card, cash
            $table->string('gateway_provider', 40)->default('manual'); // manual, dpo, mpesa, flutterwave
            $table->string('gateway_transaction_id', 100)->nullable();
            $table->string('proof_attachment_path', 255)->nullable();
            $table->string('status', 30)->default('pending'); // initiated, pending, successful, failed, cancelled, refunded, under_review
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('verified_by_user_id')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->string('idempotency_key', 100)->nullable()->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('saas_invoice_id')->references('id')->on('saas_invoices')->cascadeOnDelete();
            $table->index(['status', 'created_at']);
        });

        // 8. SaaS Receipts
        Schema::create('saas_receipts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('receipt_number', 50)->unique(); // RCT-2026-000001
            $table->uuid('tenant_id');
            $table->uuid('saas_invoice_id');
            $table->uuid('saas_payment_id');
            $table->string('customer_name', 120);
            $table->bigInteger('amount_paid_minor');
            $table->string('currency', 10)->default('TZS');
            $table->string('payment_method', 40);
            $table->string('payment_reference', 60);
            $table->timestamp('issued_at');
            $table->string('access_token', 80)->unique();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('saas_invoice_id')->references('id')->on('saas_invoices')->cascadeOnDelete();
            $table->foreign('saas_payment_id')->references('id')->on('saas_payments')->cascadeOnDelete();
        });

        // 9. Contract Templates
        Schema::create('saas_contract_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 120);
            $table->string('category', 50)->default('subscription'); // subscription, service, sla, nda, disclosure, sales
            $table->string('description', 255)->nullable();
            $table->longText('content'); // contains {{variables}}
            $table->boolean('is_active')->default(true);
            $table->string('version', 20)->default('1.0');
            $table->timestamps();
        });

        // 10. Contracts
        Schema::create('saas_contracts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('contract_number', 50)->unique(); // CTR-2026-000001
            $table->uuid('tenant_id');
            $table->uuid('saas_contract_template_id')->nullable();
            $table->uuid('saas_subscription_id')->nullable();
            $table->uuid('saas_quotation_id')->nullable();
            $table->string('title', 150);
            $table->string('category', 50)->default('subscription');
            $table->longText('rendered_content');
            $table->string('status', 30)->default('pending_signature'); // draft, pending_signature, signed, rejected, expired, cancelled
            $table->string('access_token', 80)->unique();
            $table->string('signer_name', 100)->nullable();
            $table->string('signer_email', 100)->nullable();
            $table->string('signer_title', 100)->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->string('signer_ip', 60)->nullable();
            $table->string('signer_user_agent', 255)->nullable();
            $table->longText('signature_data')->nullable(); // svg or base64 or drawn signature
            $table->string('document_hash', 100)->nullable(); // SHA-256 integrity hash
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->unsignedBigInteger('created_by_user_id')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
        });

        // 11. Contract Audit Logs
        Schema::create('saas_contract_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('saas_contract_id');
            $table->string('action', 50); // created, sent, viewed, signed, rejected, downloaded, renewed
            $table->string('actor_type', 30); // super_admin, customer, system
            $table->string('actor_id', 80)->nullable();
            $table->string('ip_address', 60)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->json('details')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('saas_contract_id')->references('id')->on('saas_contracts')->cascadeOnDelete();
        });

        // 12. Payment Reminders
        Schema::create('saas_payment_reminders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('saas_subscription_id');
            $table->uuid('saas_invoice_id')->nullable();
            $table->string('reminder_type', 40); // 7_days_before, 3_days_before, 1_day_before, due_date, grace_period, suspension_warning
            $table->string('channel', 30)->default('email'); // email, sms, whatsapp, in_app
            $table->string('sent_to', 100);
            $table->string('status', 30)->default('sent'); // queued, sent, failed
            $table->timestamp('sent_at')->useCurrent();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('saas_subscription_id')->references('id')->on('saas_subscriptions')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('saas_payment_reminders');
        Schema::dropIfExists('saas_contract_audit_logs');
        Schema::dropIfExists('saas_contracts');
        Schema::dropIfExists('saas_contract_templates');
        Schema::dropIfExists('saas_receipts');
        Schema::dropIfExists('saas_payments');
        Schema::dropIfExists('saas_invoice_items');
        Schema::dropIfExists('saas_invoices');
        Schema::dropIfExists('saas_quotation_items');
        Schema::dropIfExists('saas_quotations');
        Schema::dropIfExists('saas_subscriptions');
        Schema::dropIfExists('saas_subscription_plans');
    }
};

