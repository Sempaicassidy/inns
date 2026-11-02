<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Chart of Accounts / Categories
        Schema::create('accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('type'); // revenue, expense, asset, liability, equity
            $table->string('category')->nullable(); // room_revenue, food_beverage, utilities, maintenance, payroll
            $table->integer('balance_minor')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Hotel Expenses
        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('expense_number')->unique();
            $table->string('title');
            $table->string('category'); // utilities, supplies, maintenance, food_provisions, marketing, other
            $table->string('vendor_name')->nullable();
            $table->integer('amount_minor');
            $table->string('payment_method')->default('cash'); // cash, bank_transfer, mpesa
            $table->date('expense_date');
            $table->string('status')->default('paid'); // pending, approved, paid
            $table->string('receipt_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. Financial Transactions Ledger
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->string('transaction_type'); // debit, credit
            $table->string('source_type'); // folio_payment, pos_sale, expense, night_audit
            $table->string('source_id')->nullable();
            $table->integer('amount_minor');
            $table->string('currency')->default('USD');
            $table->date('transaction_date');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('accounts');
    }
};
