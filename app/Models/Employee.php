<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'user_id',
        'employee_code',
        'full_name',
        'email',
        'phone',
        'department',
        'position',
        'hire_date',
        'salary_minor',
        'employment_type',
        'status',
        'is_active',
        'emergency_contact',
        'gender',
        'nida_number',
        'date_of_birth',
        'address',
        'bank_name',
        'bank_account',
    ];

    protected $appends = [
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
            'date_of_birth' => 'date',
            'salary_minor' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function getIsActiveAttribute(): bool
    {
        return ($this->attributes['is_active'] ?? null) !== null
            ? (bool) $this->attributes['is_active']
            : ($this->status === 'active');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(StaffSchedule::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(StaffAttendance::class);
    }

    public function leaves(): HasMany
    {
        return $this->hasMany(StaffLeave::class);
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(StaffPayroll::class);
    }

    public function disciplinaryRecords(): HasMany
    {
        return $this->hasMany(StaffDisciplinaryRecord::class);
    }
}
