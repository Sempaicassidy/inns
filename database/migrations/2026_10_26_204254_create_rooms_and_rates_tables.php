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
        Schema::create('room_types', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->string('code', 20);
            $table->string('name');
            $table->unsignedInteger('base_occupancy')->default(2);
            $table->unsignedInteger('max_adults')->default(2);
            $table->unsignedInteger('max_children')->default(2);
            $table->unsignedBigInteger('base_price_minor')->default(10000000); // 100,000.00 TZS
            $table->json('amenities')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'property_id', 'is_active']);
            $table->unique(['tenant_id', 'property_id', 'code']);
        });

        Schema::create('rooms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('room_type_id')->constrained('room_types')->cascadeOnDelete();
            $table->string('room_number', 30);
            $table->string('floor', 50)->default('Ground Floor');
            $table->enum('status_occupancy', ['vacant', 'occupied'])->default('vacant');
            $table->enum('status_hk', ['clean', 'dirty', 'inspected', 'out_of_order', 'out_of_service'])->default('clean');
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'property_id', 'room_number']);
            $table->index(['tenant_id', 'property_id', 'status_occupancy', 'status_hk']);
        });

        Schema::create('rate_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->string('code', 30);
            $table->string('name');
            $table->enum('meal_plan', ['RO', 'BB', 'HB', 'FB', 'AI'])->default('BB');
            $table->boolean('is_resident_only')->default(false);
            $table->json('cancellation_policy')->nullable();
            $table->json('rules')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'property_id', 'code']);
        });

        Schema::create('rates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('rate_plan_id')->constrained('rate_plans')->cascadeOnDelete();
            $table->foreignUuid('room_type_id')->constrained('room_types')->cascadeOnDelete();
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->unsignedBigInteger('price_minor');
            $table->unsignedBigInteger('extra_adult_minor')->default(0);
            $table->unsignedBigInteger('extra_child_minor')->default(0);
            $table->timestamps();

            $table->index(['tenant_id', 'rate_plan_id', 'room_type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rates');
        Schema::dropIfExists('rate_plans');
        Schema::dropIfExists('rooms');
        Schema::dropIfExists('room_types');
    }
};
