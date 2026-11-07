<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FrontOfficeReport extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'user_id',
        'report_date',
        'shift_type',
        'shift_handover_to',
        'occupancy_count',
        'arrivals_count',
        'departures_count',
        'in_house_count',
        'operational_summary',
        'guest_issues',
        'maintenance_issues',
        'handover_notes',
        'status',
    ];

    protected $casts = [
        'report_date' => 'date',
        'occupancy_count' => 'integer',
        'arrivals_count' => 'integer',
        'departures_count' => 'integer',
        'in_house_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}

