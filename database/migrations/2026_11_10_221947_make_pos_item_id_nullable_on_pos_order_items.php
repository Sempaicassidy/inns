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
        Schema::table('pos_order_items', function (Blueprint $table) {
            // Offline-synced orders may carry ad-hoc items that are not linked
            // to a catalog PosItem, so the reference must be optional.
            $table->foreignUuid('pos_item_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pos_order_items', function (Blueprint $table) {
            $table->foreignUuid('pos_item_id')->nullable(false)->change();
        });
    }
};
