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
        Schema::create('offline_operations', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('device_id', 100);
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('operation_id', 100);
            $table->string('operation_type', 50);
            $table->string('payload_hash', 64);
            $table->enum('status', ['pending', 'confirmed', 'rejected', 'conflict'])->default('confirmed');
            $table->json('server_result')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'operation_id'], 'off_op_tenant_op_uniq');
            $table->index(['tenant_id', 'device_id'], 'off_op_tenant_device_idx');
            $table->index(['tenant_id', 'operation_type', 'status'], 'off_op_tenant_type_status_idx');
            $table->index(['created_at'], 'off_op_created_at_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offline_operations');
    }
};
