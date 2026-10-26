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
        Schema::create('hk_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->enum('task_type', ['checkout_clean', 'stayover_clean', 'deep_clean', 'inspection', 'touchup'])->default('checkout_clean');
            $table->enum('priority', ['normal', 'high', 'urgent'])->default('normal');
            $table->enum('status', ['pending', 'in_progress', 'completed', 'inspected'])->default('pending');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('inspected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('checklist')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'property_id', 'status', 'priority']);
        });

        Schema::create('business_dates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->date('current_business_date');
            $table->enum('status', ['open', 'closing', 'closed'])->default('open');
            $table->timestamps();

            $table->unique(['tenant_id', 'property_id']);
        });

        Schema::create('night_audits', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->date('business_date');
            $table->enum('status', ['in_progress', 'completed', 'failed'])->default('completed');
            $table->unsignedInteger('rooms_occupied')->default(0);
            $table->unsignedInteger('rooms_available')->default(0);
            $table->unsignedBigInteger('total_room_revenue_minor')->default(0);
            $table->unsignedBigInteger('total_extra_revenue_minor')->default(0);
            $table->unsignedBigInteger('total_payments_collected_minor')->default(0);
            $table->json('audit_summary')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['tenant_id', 'property_id', 'business_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('night_audits');
        Schema::dropIfExists('business_dates');
        Schema::dropIfExists('hk_tasks');
    }
};
