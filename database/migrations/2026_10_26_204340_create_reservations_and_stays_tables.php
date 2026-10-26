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
        Schema::create('reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->string('ref_no', 30);
            $table->foreignUuid('guest_id')->constrained('guests')->cascadeOnDelete();
            $table->foreignUuid('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->enum('source', ['walk_in', 'phone', 'email', 'website', 'booking_com', 'agent', 'corporate'])->default('walk_in');
            $table->enum('status', ['inquiry', 'tentative', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'])->default('confirmed');
            $table->date('check_in');
            $table->date('check_out');
            $table->unsignedInteger('adults')->default(1);
            $table->unsignedInteger('children')->default(0);
            $table->unsignedBigInteger('total_minor')->default(0);
            $table->unsignedBigInteger('deposit_minor')->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'property_id', 'ref_no'], 'res_ref_uniq');
            $table->index(['tenant_id', 'property_id', 'status', 'check_in', 'check_out'], 'res_status_dates_idx');
        });

        Schema::create('reservation_rooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('reservation_id')->constrained('reservations')->cascadeOnDelete();
            $table->foreignUuid('room_type_id')->constrained('room_types')->cascadeOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignUuid('rate_plan_id')->constrained('rate_plans')->cascadeOnDelete();
            $table->date('check_in');
            $table->date('check_out');
            $table->unsignedBigInteger('rate_price_minor');
            $table->enum('status', ['tentative', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'])->default('confirmed');
            $table->timestamps();

            $table->index(['tenant_id', 'room_id', 'check_in', 'check_out', 'status'], 'res_rooms_dates_idx');
        });

        Schema::create('stays', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('reservation_room_id')->constrained('reservation_rooms')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->foreignUuid('guest_id')->constrained('guests')->cascadeOnDelete();
            $table->dateTime('checked_in_at');
            $table->dateTime('checked_out_at')->nullable();
            $table->json('registration_data')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'room_id', 'checked_in_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stays');
        Schema::dropIfExists('reservation_rooms');
        Schema::dropIfExists('reservations');
    }
};
