<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('occurrence_book_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->index();
            $table->foreignUuid('property_id')->nullable()->index();
            $table->string('reference', 100)->unique();
            $table->dateTime('occurred_at');
            $table->string('location');
            $table->string('category');
            $table->text('description');
            $table->string('involved_persons')->nullable();
            $table->text('action_taken')->nullable();
            $table->string('status', 50)->default('submitted'); // submitted, under_review, closed
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tenant_id', 'occurred_at']);
            $table->index(['tenant_id', 'status']);
        });

        Schema::create('occurrence_book_amendments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('occurrence_book_entry_id')->index();
            $table->text('original_values');
            $table->text('amended_values');
            $table->text('reason');
            $table->foreignId('amended_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('occurrence_book_amendments');
        Schema::dropIfExists('occurrence_book_entries');
    }
};
