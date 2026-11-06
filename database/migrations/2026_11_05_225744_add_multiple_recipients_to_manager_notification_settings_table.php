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
        Schema::table('manager_notification_settings', function (Blueprint $table) {
            $table->text('additional_phones')->nullable()->after('phone_number');
            $table->text('additional_emails')->nullable()->after('email');
            $table->json('recipients')->nullable()->after('additional_emails');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manager_notification_settings', function (Blueprint $table) {
            $table->dropColumn(['additional_phones', 'additional_emails', 'recipients']);
        });
    }
};
