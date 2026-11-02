<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add extra fields to employees if not exists
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'gender')) {
                $table->string('gender')->nullable()->after('full_name');
            }
            if (!Schema::hasColumn('employees', 'nida_number')) {
                $table->string('nida_number')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('employees', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('hire_date');
            }
            if (!Schema::hasColumn('employees', 'address')) {
                $table->string('address')->nullable()->after('emergency_contact');
            }
            if (!Schema::hasColumn('employees', 'bank_name')) {
                $table->string('bank_name')->nullable()->after('salary_minor');
            }
            if (!Schema::hasColumn('employees', 'bank_account')) {
                $table->string('bank_account')->nullable()->after('bank_name');
            }
        });

        // 2. Staff Leaves (Usimamizi wa Likizo)
        if (!Schema::hasTable('staff_leaves')) {
            Schema::create('staff_leaves', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
                $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->string('leave_type')->default('annual'); // annual, sick, maternity, paternity, emergency, unpaid
                $table->date('start_date');
                $table->date('end_date');
                $table->integer('days_count')->default(1);
                $table->text('reason')->nullable();
                $table->string('status')->default('pending'); // pending, approved, rejected, cancelled
                $table->foreignId('approved_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('manager_remarks')->nullable();
                $table->timestamps();
            });
        }

        // 3. Staff Payroll Records (Mishahara na Marupurupu)
        if (!Schema::hasTable('staff_payrolls')) {
            Schema::create('staff_payrolls', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
                $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->string('payroll_month'); // e.g. '2026-11'
                $table->bigInteger('base_salary_minor')->default(0);
                $table->bigInteger('allowance_minor')->default(0);
                $table->bigInteger('overtime_minor')->default(0);
                $table->bigInteger('nssf_deduction_minor')->default(0);
                $table->bigInteger('paye_deduction_minor')->default(0);
                $table->bigInteger('other_deductions_minor')->default(0);
                $table->bigInteger('net_salary_minor')->default(0);
                $table->string('payment_method')->default('bank'); // bank, mpesa, tigo_pesa, airtel_money, cash
                $table->string('payment_reference')->nullable();
                $table->string('status')->default('draft'); // draft, approved, paid
                $table->timestamp('paid_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // 4. Staff Disciplinary & Performance Records (Maadili & Tathmini)
        if (!Schema::hasTable('staff_disciplinary_records')) {
            Schema::create('staff_disciplinary_records', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
                $table->foreignUuid('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->string('record_type')->default('warning'); // warning, commendation, query, appraisal, training
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('incident_date')->nullable();
                $table->string('action_taken')->nullable();
                $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('staff_disciplinary_records');
        Schema::dropIfExists('staff_payrolls');
        Schema::dropIfExists('staff_leaves');
    }
};

