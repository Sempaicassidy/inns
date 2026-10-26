<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'tenant_id',
        'property_id',
        'name',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'pin_code',
        'locale',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'pin_code',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the tenant that this user belongs to.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the property currently assigned to this user.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Role checking helpers.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    public function isOwner(): bool
    {
        return in_array($this->role, ['owner', 'super_admin']);
    }

    public function isManager(): bool
    {
        return in_array($this->role, ['manager', 'general_manager', 'front_office_manager', 'owner', 'super_admin']);
    }

    public function isReceptionist(): bool
    {
        return in_array($this->role, ['receptionist', 'front_office_manager', 'manager', 'owner', 'super_admin']);
    }

    public function isHousekeeper(): bool
    {
        return in_array($this->role, ['housekeeper', 'housekeeping_supervisor']);
    }

    public function hasRole(string|array $roles): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $roles = is_array($roles) ? $roles : [$roles];

        return in_array($this->role, $roles);
    }
}
