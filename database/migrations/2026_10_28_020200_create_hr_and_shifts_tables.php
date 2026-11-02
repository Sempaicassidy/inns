<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Employees (HR Directory)
        Schema::create('employees', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('employee_code')->unique();
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('department'); // front_office, housekeeping, food_beverage, maintenance, security, accounts, management
            $table->string('position'); // Receptionist, Chef, Waiter, Housekeeper, Maintenance Tech, Duty Manager
            $table->date('hire_date');
            $table->integer('salary_minor')->default(0);
            $table->string('employment_type')->default('full_time'); // full_time, part_time, contract, casual
            $table->string('status')->default('active'); // active, on_leave, terminated
            $table->string('emergency_contact')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Work Shifts & Roster Schedule
        Schema::create('staff_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('shift_date');
            $table->string('shift_type'); // morning (07:00-15:00), evening (15:00-23:00), night (23:00-07:00), off
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('status')->default('scheduled'); // scheduled, present, absent, on_leave
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. Staff Attendance Logs
        Schema::create('staff_attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
            $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->timestamp('check_in_at')->nullable();
            $table->timestamp('check_out_at')->nullable();
            $table->string('status')->default('on_time'); // on_time, late, early_departure, overtime
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_attendances');
        Schema::dropIfExists('staff_schedules');
        Schema::dropIfExists('employees');
    }
};
