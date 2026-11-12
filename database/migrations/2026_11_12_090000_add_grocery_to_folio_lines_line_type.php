<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE folio_lines MODIFY COLUMN line_type VARCHAR(50) NOT NULL DEFAULT 'room'");
        } else {
            Schema::table('folio_lines', function (Blueprint $table) {
                $table->string('line_type', 50)->default('room')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE folio_lines MODIFY COLUMN line_type ENUM('room', 'restaurant', 'bar', 'laundry', 'tour', 'minibar', 'miscellaneous', 'adjustment') NOT NULL DEFAULT 'room'");
        } else {
            Schema::table('folio_lines', function (Blueprint $table) {
                $table->string('line_type', 20)->default('room')->change();
            });
        }
    }
};

