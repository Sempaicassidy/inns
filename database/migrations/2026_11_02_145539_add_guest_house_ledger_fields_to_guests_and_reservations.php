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
        Schema::table('guests', function (Blueprint $table) {
            if (!Schema::hasColumn('guests', 'gender')) {
                $table->string('gender', 20)->nullable()->after('last_name');
            }
            if (!Schema::hasColumn('guests', 'age')) {
                $table->unsignedSmallInteger('age')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('guests', 'tribe')) {
                $table->string('tribe', 100)->nullable()->after('nationality');
            }
            if (!Schema::hasColumn('guests', 'origin')) {
                $table->string('origin', 150)->nullable()->after('id_number');
            }
            if (!Schema::hasColumn('guests', 'destination')) {
                $table->string('destination', 150)->nullable()->after('origin');
            }
            if (!Schema::hasColumn('guests', 'vehicle_reg_no')) {
                $table->string('vehicle_reg_no', 50)->nullable()->after('destination');
            }
        });

        Schema::table('reservations', function (Blueprint $table) {
            if (!Schema::hasColumn('reservations', 'check_in_time')) {
                $table->string('check_in_time', 20)->nullable()->after('check_in');
            }
            if (!Schema::hasColumn('reservations', 'check_out_time')) {
                $table->string('check_out_time', 20)->nullable()->after('check_out');
            }
            if (!Schema::hasColumn('reservations', 'origin')) {
                $table->string('origin', 150)->nullable()->after('children');
            }
            if (!Schema::hasColumn('reservations', 'destination')) {
                $table->string('destination', 150)->nullable()->after('origin');
            }
            if (!Schema::hasColumn('reservations', 'vehicle_reg_no')) {
                $table->string('vehicle_reg_no', 50)->nullable()->after('destination');
            }
            if (!Schema::hasColumn('reservations', 'receipt_no')) {
                $table->string('receipt_no', 100)->nullable()->after('deposit_minor');
            }
            if (!Schema::hasColumn('reservations', 'payment_method')) {
                $table->string('payment_method', 50)->nullable()->after('receipt_no');
            }
            if (!Schema::hasColumn('reservations', 'guest_signature')) {
                $table->boolean('guest_signature')->default(false)->after('payment_method');
            }
            if (!Schema::hasColumn('reservations', 'receptionist_name')) {
                $table->string('receptionist_name', 100)->nullable()->after('guest_signature');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guests', function (Blueprint $table) {
            $table->dropColumn(['gender', 'age', 'tribe', 'origin', 'destination', 'vehicle_reg_no']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn([
                'check_in_time',
                'check_out_time',
                'origin',
                'destination',
                'vehicle_reg_no',
                'receipt_no',
                'payment_method',
                'guest_signature',
                'receptionist_name',
            ]);
        });
    }
};
