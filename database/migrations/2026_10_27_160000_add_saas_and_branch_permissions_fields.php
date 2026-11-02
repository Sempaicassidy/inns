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
        Schema::table('tenants', function (Blueprint $table) {
            $table->unsignedInteger('max_branches')->default(5)->after('plan');
            $table->decimal('subscription_price', 12, 2)->default(0.00)->after('max_branches');
            $table->string('subscription_status')->default('active')->after('subscription_price');
            $table->date('license_expiry')->nullable()->after('subscription_status');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_manage_branches')->default(false)->after('role');
        });

        Schema::table('properties', function (Blueprint $table) {
            $table->boolean('is_main')->default(false)->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['is_main']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['can_manage_branches']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['max_branches', 'subscription_price', 'subscription_status', 'license_expiry']);
        });
    }
};
