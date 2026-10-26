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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('tenant_id')->nullable()->after('id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->nullable()->after('tenant_id')->constrained('properties')->nullOnDelete();
            $table->string('role')->default('receptionist')->after('password');
            $table->string('phone')->nullable()->after('email');
            $table->string('status')->default('active')->after('role');
            $table->string('pin_code', 6)->nullable()->after('status');
            $table->string('locale', 5)->default('en')->after('pin_code');
            $table->softDeletes()->after('updated_at');

            $table->index(['tenant_id', 'role']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['property_id']);
            $table->dropColumn(['tenant_id', 'property_id', 'role', 'phone', 'status', 'pin_code', 'locale', 'deleted_at']);
        });
    }
};
