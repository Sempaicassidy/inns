<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('employees') && ! Schema::hasColumn('employees', 'is_active')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('employees') && Schema::hasColumn('employees', 'is_active')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->dropColumn('is_active');
            });
        }
    }
};
