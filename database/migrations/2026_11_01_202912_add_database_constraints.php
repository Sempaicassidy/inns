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
        // Unique constraints already exist from original migrations
        // This migration is for documentation purposes
        // The database already has:
        // - users.email unique
        // - guests.phone unique
        // - guests.email unique
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });

        Schema::table('guests', function (Blueprint $table) {
            $table->dropUnique(['phone']);
        });

        Schema::table('guests', function (Blueprint $table) {
            $table->dropUnique(['email']);
        });
    }
};
