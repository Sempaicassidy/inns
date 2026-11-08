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
        // 1. Add monthly revenue target to properties if not present
        if (! Schema::hasColumn('properties', 'monthly_target_revenue_minor')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->bigInteger('monthly_target_revenue_minor')->default(0)->after('is_active');
            });
        }

        // 2. Executive Directives from Owner to General Managers
        if (! Schema::hasTable('owner_directives')) {
            Schema::create('owner_directives', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->string('title');
                $table->text('directive_text');
                $table->string('priority')->default('normal'); // normal, high, urgent
                $table->string('category')->default('operations'); // operations, finance, policy, maintenance, hr
                $table->date('target_deadline')->nullable();
                $table->string('status')->default('active'); // active, acknowledged, completed
                $table->timestamp('acknowledged_at')->nullable();
                $table->foreignId('acknowledged_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('acknowledgement_notes')->nullable();
                $table->timestamps();
            });
        }

        // 3. Chain of Command: Requisitions & Approvals from General Managers to Owner
        if (! Schema::hasTable('owner_requisitions')) {
            Schema::create('owner_requisitions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignUuid('property_id')->constrained('properties')->cascadeOnDelete();
                $table->foreignId('requested_by')->constrained('users')->cascadeOnDelete();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('requisition_no', 64)->unique();
                $table->string('title');
                $table->string('category')->default('maintenance'); // maintenance, supplies, equipment, renovation, utilities, staff, other
                $table->bigInteger('amount_minor')->default(0);
                $table->string('urgency')->default('routine'); // routine, priority, emergency
                $table->text('justification');
                $table->string('vendor_name')->nullable();
                $table->string('status')->default('pending_owner'); // pending_owner, approved, rejected
                $table->text('owner_notes')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamp('rejected_at')->nullable();
                $table->timestamps();
            });
        }

        // 4. Owner Equity, Drawings & Dividend Withdrawals
        if (! Schema::hasTable('owner_drawings')) {
            Schema::create('owner_drawings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignUuid('property_id')->nullable()->constrained('properties')->nullOnDelete();
                $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
                $table->string('drawing_type')->default('dividend'); // dividend, draw, capital_injection
                $table->bigInteger('amount_minor')->default(0);
                $table->string('payment_method')->default('bank_transfer'); // bank_transfer, cash, mpesa
                $table->string('reference_no')->nullable();
                $table->date('drawing_date');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('owner_drawings');
        Schema::dropIfExists('owner_requisitions');
        Schema::dropIfExists('owner_directives');

        if (Schema::hasColumn('properties', 'monthly_target_revenue_minor')) {
            Schema::table('properties', function (Blueprint $table) {
                $table->dropColumn('monthly_target_revenue_minor');
            });
        }
    }
};
