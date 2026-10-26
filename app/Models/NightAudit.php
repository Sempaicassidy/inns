<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NightAudit extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'business_date',
        'status',
        'rooms_occupied',
        'rooms_available',
        'total_room_revenue_minor',
        'total_extra_revenue_minor',
        'total_payments_collected_minor',
        'audit_summary',
        'performed_by',
    ];

    protected function casts(): array
    {
        return [
            'business_date' => 'date',
            'rooms_occupied' => 'integer',
            'rooms_available' => 'integer',
            'total_room_revenue_minor' => 'integer',
            'total_extra_revenue_minor' => 'integer',
            'total_payments_collected_minor' => 'integer',
            'audit_summary' => 'array',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}
