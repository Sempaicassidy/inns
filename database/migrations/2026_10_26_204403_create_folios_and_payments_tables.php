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
        Schema::create('cashier_shifts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->dateTime('opened_at');
            $table->dateTime('closed_at')->nullable();
            $table->unsignedBigInteger('opening_float_minor')->default(0);
            $table->unsignedBigInteger('cash_expected_minor')->default(0);
            $table->unsignedBigInteger('cash_counted_minor')->default(0);
            $table->bigInteger('variance_minor')->default(0);
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->text('closing_notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'property_id', 'user_id', 'status']);
        });

        Schema::create('folios', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('reservation_id')->nullable()->constrained('reservations')->nullOnDelete();
            $table->foreignUuid('stay_id')->nullable()->constrained('stays')->nullOnDelete();
            $table->string('folio_number', 40);
            $table->enum('owner_type', ['guest', 'company'])->default('guest');
            $table->uuid('owner_id');
            $table->string('currency', 3)->default('TZS');
            $table->bigInteger('total_charges_minor')->default(0);
            $table->bigInteger('total_payments_minor')->default(0);
            $table->bigInteger('balance_minor')->default(0);
            $table->enum('status', ['open', 'settled', 'closed'])->default('open');
            $table->timestamps();

            $table->unique(['tenant_id', 'property_id', 'folio_number']);
            $table->index(['tenant_id', 'property_id', 'status']);
        });

        Schema::create('folio_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('folio_id')->constrained('folios')->cascadeOnDelete();
            $table->date('business_date');
            $table->enum('line_type', ['room', 'restaurant', 'bar', 'laundry', 'tour', 'minibar', 'miscellaneous', 'adjustment'])->default('room');
            $table->string('description');
            $table->bigInteger('amount_minor');
            $table->bigInteger('tax_minor')->default(0);
            $table->string('source_ref')->nullable();
            $table->uuid('reversed_line_id')->nullable();
            $table->string('idempotency_key')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tenant_id', 'folio_id', 'business_date']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('folio_id')->constrained('folios')->cascadeOnDelete();
            $table->foreignUuid('cashier_shift_id')->nullable()->constrained('cashier_shifts')->nullOnDelete();
            $table->date('business_date');
            $table->enum('payment_method', ['cash', 'mpesa', 'tigopesa', 'airtelmoney', 'halopesa', 'card', 'bank_transfer', 'city_ledger'])->default('cash');
            $table->string('provider')->nullable();
            $table->string('provider_ref')->nullable();
            $table->bigInteger('amount_minor');
            $table->string('currency', 3)->default('TZS');
            $table->enum('status', ['pending', 'confirmed', 'failed', 'refunded'])->default('confirmed');
            $table->foreignId('received_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'folio_id', 'business_date', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('folio_lines');
        Schema::dropIfExists('folios');
        Schema::dropIfExists('cashier_shifts');
    }
};
