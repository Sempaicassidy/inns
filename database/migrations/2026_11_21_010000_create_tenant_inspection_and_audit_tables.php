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
        Schema::create('tenant_inspection_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->foreignId('super_admin_id')->constrained('users')->onDelete('cascade');
            $table->string('reason');
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->boolean('is_write_mode')->default(false);
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('actions_performed')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'started_at']);
            $table->index(['super_admin_id', 'started_at']);
        });

        Schema::create('tenant_audit_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('tenant_id');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name')->nullable();
            $table->uuid('branch_id')->nullable();
            $table->string('module', 50); // bookings, pos, financial, users, inventory, config, security, system
            $table->string('action_type', 50); // created, updated, deleted, login, failed_login, permission_change, refund, void, inspected
            $table->text('description');
            $table->string('record_type', 100)->nullable();
            $table->string('record_id', 100)->nullable();
            $table->json('before_state')->nullable();
            $table->json('after_state')->nullable();
            $table->string('status', 20)->default('success'); // success, failure, warning
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index(['tenant_id', 'created_at']);
            $table->index(['module', 'created_at']);
            $table->index(['action_type', 'created_at']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenant_audit_events');
        Schema::dropIfExists('tenant_inspection_sessions');
    }
};
