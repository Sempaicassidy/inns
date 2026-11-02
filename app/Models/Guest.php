<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Guest extends Model
{
    use BelongsToTenant, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'first_name',
        'last_name',
        'gender',
        'age',
        'phone',
        'email',
        'nationality',
        'tribe',
        'is_resident',
        'id_type',
        'id_number',
        'origin',
        'destination',
        'vehicle_reg_no',
        'vip_level',
        'is_blacklisted',
        'blacklist_reason',
        'preferences',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_resident' => 'boolean',
            'is_blacklisted' => 'boolean',
            'preferences' => 'array',
        ];
    }

    public function getFullNameAttribute(): string
    {
        return "{$this->first_name} {$this->last_name}";
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(GuestDocument::class);
    }

    public function stays(): HasMany
    {
        return $this->hasMany(Stay::class);
    }
}
