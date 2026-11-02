<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. WhatsApp Configuration Settings (Multi-Tenant & Per Property)
        Schema::create('whatsapp_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->string('provider')->default('cloud_api'); // cloud_api, twilio, infobip
            $table->string('phone_number_id')->nullable();
            $table->string('business_account_id')->nullable();
            $table->text('access_token')->nullable();
            $table->string('sender_phone_number')->nullable();
            $table->boolean('send_on_reservation_confirmed')->default(true);
            $table->boolean('send_on_checkin')->default(true);
            $table->boolean('send_on_checkout_invoice')->default(true);
            $table->boolean('send_on_housekeeping_ready')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. WhatsApp Message Logs & Delivery Tracking
        Schema::create('whatsapp_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->string('recipient_phone');
            $table->string('recipient_name')->nullable();
            $table->string('message_type'); // booking_confirmation, welcome_checkin, folio_invoice, housekeeping_alert, custom
            $table->text('message_body');
            $table->string('template_name')->nullable();
            $table->string('status')->default('sent'); // queued, sent, delivered, read, failed
            $table->string('external_message_id')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_logs');
        Schema::dropIfExists('whatsapp_settings');
    }
};
