<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('front_office_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('report_date');
            $table->string('shift_type')->default('morning'); // morning, evening, night, full_day
            $table->string('shift_handover_to')->nullable();
            $table->integer('occupancy_count')->default(0);
            $table->integer('arrivals_count')->default(0);
            $table->integer('departures_count')->default(0);
            $table->integer('in_house_count')->default(0);
            $table->text('operational_summary');
            $table->text('guest_issues')->nullable();
            $table->text('maintenance_issues')->nullable();
            $table->text('handover_notes')->nullable();
            $table->string('status')->default('submitted');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('front_office_reports');
    }
};

