<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add department to pos_categories if not present
        if (! Schema::hasColumn('pos_categories', 'department')) {
            Schema::table('pos_categories', function (Blueprint $table) {
                $table->string('department', 32)->default('restaurant')->index()->after('property_id');
            });
        }

        // 2. Add department to pos_items if not present
        if (! Schema::hasColumn('pos_items', 'department')) {
            Schema::table('pos_items', function (Blueprint $table) {
                $table->string('department', 32)->default('restaurant')->index()->after('pos_category_id');
            });
        }

        // 3. Add outlet_type to pos_orders if not present
        if (! Schema::hasColumn('pos_orders', 'outlet_type')) {
            Schema::table('pos_orders', function (Blueprint $table) {
                $table->string('outlet_type', 32)->default('restaurant')->index()->after('order_number');
            });
        }

        // 4. Migrate existing grocery categories and items to department 'grocery'
        DB::table('pos_categories')
            ->where('name', 'like', '%Grocery%')
            ->orWhere('name', 'like', '%Retail%')
            ->orWhere('name', 'like', '%Minimart%')
            ->orWhere('name', 'like', '%Shop%')
            ->update(['department' => 'grocery']);

        $groceryCatIds = DB::table('pos_categories')
            ->where('department', 'grocery')
            ->pluck('id');

        if ($groceryCatIds->isNotEmpty()) {
            DB::table('pos_items')
                ->whereIn('pos_category_id', $groceryCatIds)
                ->update(['department' => 'grocery']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('pos_orders', 'outlet_type')) {
            Schema::table('pos_orders', function (Blueprint $table) {
                $table->dropColumn('outlet_type');
            });
        }

        if (Schema::hasColumn('pos_items', 'department')) {
            Schema::table('pos_items', function (Blueprint $table) {
                $table->dropColumn('department');
            });
        }

        if (Schema::hasColumn('pos_categories', 'department')) {
            Schema::table('pos_categories', function (Blueprint $table) {
                $table->dropColumn('department');
            });
        }
    }
};

