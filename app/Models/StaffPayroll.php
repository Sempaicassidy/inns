<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffPayroll extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'employee_id',
        'payroll_month',
        'base_salary_minor',
        'allowance_minor',
        'overtime_minor',
        'nssf_deduction_minor',
        'paye_deduction_minor',
        'other_deductions_minor',
        'net_salary_minor',
        'payment_method',
        'payment_reference',
        'status',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'base_salary_minor' => 'integer',
            'allowance_minor' => 'integer',
            'overtime_minor' => 'integer',
            'nssf_deduction_minor' => 'integer',
            'paye_deduction_minor' => 'integer',
            'other_deductions_minor' => 'integer',
            'net_salary_minor' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}

