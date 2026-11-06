<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manager_notification_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();

            $table->string('manager_name')->default('General Manager');
            $table->string('phone_number')->nullable(); // Namba ya simu ya kupokea SMS na WhatsApp
            $table->string('email')->nullable();        // Barua pepe ya kupokea ripoti

            // Muda wa ripoti ya kila siku (Default 12:30 au saa yoyote anayochagua manager)
            $table->string('report_time', 10)->default('12:30'); 

            // Njia 3 za kutuma taarifa
            $table->boolean('send_via_sms')->default(true);
            $table->boolean('send_via_whatsapp')->default(true);
            $table->boolean('send_via_email')->default(true);

            // Aina za matukio ya kutuma
            $table->boolean('notify_on_reservation')->default(true); // Alert ya chumba kinapowekewa reservation
            $table->boolean('notify_daily_report')->default(true);    // Ripoti ya siku (summarizing room, pos, grocery, revenue)

            // Tarehe/Saa ilipotumwa ripoti ya mwisho (kuepusha kurudia siku hiyo)
            $table->dateTime('last_daily_report_sent_at')->nullable();
            $table->date('last_daily_report_date')->nullable();

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['tenant_id', 'is_active']);
            $table->index(['report_time', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manager_notification_settings');
    }
};
