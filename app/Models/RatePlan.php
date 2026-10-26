<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class RatePlan extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'property_id',
        'code',
        'name',
        'meal_plan',
        'is_resident_only',
        'cancellation_policy',
        'rules',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_resident_only' => 'boolean',
            'cancellation_policy' => 'array',
            'rules' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function rates(): HasMany
    {
        return $this->hasMany(Rate::class);
    }
}
