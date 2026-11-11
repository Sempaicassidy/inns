<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class OccurrenceBookEntry extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    public const CATEGORIES = [
        'security_incident',
        'theft',
        'assault',
        'trespass',
        'vandalism',
        'fire',
        'medical',
        'disturbance',
        'lost_property',
        'other',
    ];

    protected $fillable = [
        'tenant_id',
        'property_id',
        'reference',
        'occurred_at',
        'location',
        'category',
        'description',
        'involved_persons',
        'action_taken',
        'status',
        'created_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function amendments(): HasMany
    {
        return $this->hasMany(OccurrenceBookAmendment::class);
    }
}
