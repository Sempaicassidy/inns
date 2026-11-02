<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add manager inventory tracking fields to pos_items
        Schema::table('pos_items', function (Blueprint $table) {
            if (! Schema::hasColumn('pos_items', 'cost_price_minor')) {
                $table->integer('cost_price_minor')->default(0)->after('price_minor');
            }
            if (! Schema::hasColumn('pos_items', 'stock_quantity')) {
                $table->integer('stock_quantity')->default(50)->after('cost_price_minor');
            }
            if (! Schema::hasColumn('pos_items', 'reorder_level')) {
                $table->integer('reorder_level')->default(10)->after('stock_quantity');
            }
            if (! Schema::hasColumn('pos_items', 'unit')) {
                $table->string('unit', 30)->default('pcs')->after('reorder_level');
            }
        });

        // 2. Central Store & Departmental Inventory Items
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('inventory_items');

        Schema::create('inventory_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->string('sku', 64)->index();
            $table->string('name', 150);
            $table->string('department', 50)->default('general'); // linens, amenities, kitchen, beverage, maintenance, general
            $table->string('unit', 30)->default('pcs'); // pcs, kg, bottles, boxes, sets, liters
            $table->integer('current_quantity')->default(0);
            $table->integer('reorder_level')->default(10);
            $table->integer('unit_cost_minor')->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 3. Stock Movements & Requisition Logs (Audit Trail for Manager)
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
            $table->foreignUuid('inventory_item_id')->nullable()->constrained('inventory_items')->nullOnDelete();
            $table->foreignUuid('pos_item_id')->nullable()->constrained('pos_items')->nullOnDelete();
            $table->string('movement_type', 50); // receive_stock, issue_requisition, damage_adjustment, sales_deduction
            $table->integer('quantity'); // Positive for in, negative for out
            $table->integer('unit_cost_minor')->default(0);
            $table->string('department', 50)->nullable(); // Target department (e.g. Housekeeping, Kitchen, Restaurant)
            $table->string('reference_no', 60)->nullable(); // Invoice, PO, or Requisition Slip #
            $table->text('notes')->nullable();
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('inventory_items');

        Schema::table('pos_items', function (Blueprint $table) {
            $cols = [];
            foreach (['cost_price_minor', 'stock_quantity', 'reorder_level', 'unit'] as $col) {
                if (Schema::hasColumn('pos_items', $col)) {
                    $cols[] = $col;
                }
            }
            if (! empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
