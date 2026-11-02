<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. POS Item Categories
        Schema::create('pos_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->string('name');
            $table->string('icon')->default('utensils');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. POS Menu Items
        Schema::create('pos_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->foreignUuid('pos_category_id')->constrained('pos_categories')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->integer('price_minor'); // In minor currency units (cents)
            $table->string('image')->nullable();
            $table->boolean('is_available')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. POS Orders (Restaurant & Bar)
        Schema::create('pos_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('order_number')->unique();
            $table->string('order_type')->default('dine_in'); // dine_in, room_delivery, takeaway
            $table->string('table_number')->nullable();
            $table->foreignUuid('stay_id')->nullable()->constrained('stays')->nullOnDelete();
            $table->foreignUuid('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->string('guest_name')->nullable();
            $table->integer('subtotal_minor')->default(0);
            $table->integer('tax_minor')->default(0);
            $table->integer('total_minor')->default(0);
            $table->string('payment_status')->default('pending'); // pending, paid, posted_to_room
            $table->string('payment_method')->nullable(); // cash, card, mpesa, room_folio
            $table->foreignUuid('folio_id')->nullable()->constrained('folios')->nullOnDelete();
            $table->string('status')->default('served'); // pending, preparing, served, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 4. POS Order Items
        Schema::create('pos_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('pos_order_id')->constrained('pos_orders')->cascadeOnDelete();
            $table->foreignUuid('pos_item_id')->constrained('pos_items')->cascadeOnDelete();
            $table->string('item_name');
            $table->integer('unit_price_minor');
            $table->integer('quantity')->default(1);
            $table->integer('total_minor');
            $table->text('instructions')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_order_items');
        Schema::dropIfExists('pos_orders');
        Schema::dropIfExists('pos_items');
        Schema::dropIfExists('pos_categories');
    }
};
