<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('fiscal_invoices');
        Schema::create('fiscal_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->string('source_type', 50); // folio_payment, pos_order, expense
            $table->string('source_id', 100);
            $table->string('invoice_number', 191)->unique();
            $table->string('environment', 20)->default('sandbox'); // sandbox, production
            $table->string('status', 30)->default('pending');
            // pending, not_configured, queued, submitted, acknowledged, failed, rejected
            $table->json('request_payload')->nullable();
            $table->json('response_payload')->nullable();
            $table->string('fiscal_number')->nullable();
            $table->text('qr_payload')->nullable();
            $table->string('verification_url')->nullable();
            $table->string('error_message')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['source_type', 'source_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fiscal_invoices');
    }
};
