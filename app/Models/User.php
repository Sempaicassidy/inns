<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
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
        'roles',
        'can_manage_branches',
        'status',
        'pin_code',
        'locale',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'active_role',
        'roles_list',
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

    public function getTenantIdAttribute($value)
    {
        if (app()->environment('testing')) {
            return $value;
        }

        return $value ?: Tenant::first()?->id;
    }

    public function getPropertyIdAttribute($value)
    {
        if (app()->environment('testing')) {
            return $value;
        }

        return $value ?: Property::first()?->id;
    }

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
            'roles' => 'array',
            'can_manage_branches' => 'boolean',
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
     * Get the full list of assigned roles.
     *
     * @return list<string>
     */
    public function getRolesListAttribute(): array
    {
        if (! empty($this->roles) && is_array($this->roles)) {
            return array_values(array_unique(array_filter($this->roles)));
        }

        if (! empty($this->role)) {
            return [$this->role];
        }

        return ['general_manager'];
    }

    /**
     * Determine if the user has multiple roles assigned.
     */
    public function hasMultipleRoles(): bool
    {
        return count($this->roles_list) > 1;
    }

    /**
     * Get the currently active role in session or fallback to default.
     */
    public function getActiveRoleAttribute(): string
    {
        $sessionRole = session('active_role');
        if ($sessionRole && (in_array($sessionRole, $this->roles_list) || $this->role === 'super_admin')) {
            return $sessionRole;
        }

        return $this->roles_list[0] ?? $this->role ?? 'general_manager';
    }

    /**
     * Determine the dashboard route for a given role.
     */
    public static function getRoleDashboardRoute(string $role): string
    {
        return match ($role) {
            'super_admin' => 'saas-admin.index',
            'housekeeper', 'housekeeping_supervisor' => 'housekeeping.index',
            'pos_cashier', 'cashier', 'waiter', 'bartender' => 'pos.index',
            'accountant' => 'accounting.index',
            'night_auditor' => 'night-audit.index',
            'hr_manager' => 'hr.index',
            'receptionist', 'front_desk', 'front_office_manager' => 'dashboard',
            default => 'dashboard',
        };
    }

    /**
     * Metadata for role selector UI.
     */
    public static function getRoleMetadata(string $role): array
    {
        return match ($role) {
            'general_manager', 'manager' => [
                'role' => $role,
                'title' => 'General Manager',
                'title_sw' => 'Meneja Mkuu',
                'description' => 'Executive overview, occupancy rates, daily revenue, ADR & RevPAR.',
                'description_sw' => 'Usimamizi mkuu wa hoteli, mapato, viwango vya vyumba na takwimu.',
                'badge' => 'Executive',
                'color' => 'blue',
                'route' => 'dashboard',
                'icon' => 'Briefcase',
            ],
            'receptionist', 'front_desk', 'front_office_manager' => [
                'role' => $role,
                'title' => 'Front Desk / Reception',
                'title_sw' => 'Mapokezi & Front Desk',
                'description' => 'Guest check-in & check-out, bookings, arrivals list, and guest folios.',
                'description_sw' => 'Mapokezi ya wageni, check-in, check-out na usajili wa vyumba.',
                'badge' => 'Front Desk',
                'color' => 'emerald',
                'route' => 'dashboard',
                'icon' => 'KeyRound',
            ],
            'housekeeper', 'housekeeping_supervisor' => [
                'role' => $role,
                'title' => 'Housekeeping & Usafi',
                'title_sw' => 'Housekeeping & Usafi',
                'description' => 'Room clean/dirty status, housekeeping tasks, inspections and supplies.',
                'description_sw' => 'Ufuatiliaji wa vyumba vilivyo safi/vichafu na kazi za usafi.',
                'badge' => 'Operations',
                'color' => 'amber',
                'route' => 'housekeeping.index',
                'icon' => 'Sparkles',
            ],
            'pos_cashier', 'cashier' => [
                'role' => $role,
                'title' => 'Restaurant & POS Cashier',
                'title_sw' => 'Mauzo ya Mgahawa & POS',
                'description' => 'Food & beverage orders, table service, billing, and receipt printing.',
                'description_sw' => 'Mauzo ya vyakula na vinywaji, stakabadhi na malipo ya wateja.',
                'badge' => 'Sales',
                'color' => 'purple',
                'route' => 'pos.index',
                'icon' => 'Utensils',
            ],
            'accountant' => [
                'role' => $role,
                'title' => 'Accountant & Finance',
                'title_sw' => 'Uhasibu & Fedha',
                'description' => 'Ledgers, guest folios, payment reconciliations, and expense records.',
                'description_sw' => 'Usimamizi wa bili, matumizi ya hoteli na usuluhishi wa fedha.',
                'badge' => 'Finance',
                'color' => 'indigo',
                'route' => 'accounting.index',
                'icon' => 'DollarSign',
            ],
            'night_auditor' => [
                'role' => $role,
                'title' => 'Night Auditor',
                'title_sw' => 'Ukaguzi wa Usiku',
                'description' => 'End-of-day rollover, posting daily room charges, and closing business date.',
                'description_sw' => 'Kufunga siku ya biashara na kuchakata bili za usiku za vyumba.',
                'badge' => 'Audit',
                'color' => 'slate',
                'route' => 'night-audit.index',
                'icon' => 'Moon',
            ],
            'hr_manager' => [
                'role' => $role,
                'title' => 'HR & Staff Management',
                'title_sw' => 'Utumishi & Wafanyakazi',
                'description' => 'Staff shifts, duty rosters, attendance logs, and staff directory.',
                'description_sw' => 'Usimamizi wa zamu za wafanyakazi na kumbukumbu za mahudhurio.',
                'badge' => 'HR',
                'color' => 'teal',
                'route' => 'hr.index',
                'icon' => 'UserCheck',
            ],
            'owner', 'super_admin' => [
                'role' => $role,
                'title' => 'Property Owner / Director',
                'title_sw' => 'Mkurugenzi / Mmiliki',
                'description' => 'Multi-branch oversight, financial health, and strategic growth.',
                'description_sw' => 'Usimamizi mkuu wa matawi yote na mwelekeo wa biashara.',
                'badge' => 'Director',
                'color' => 'rose',
                'route' => 'dashboard',
                'icon' => 'Shield',
            ],
            default => [
                'role' => $role,
                'title' => ucwords(str_replace('_', ' ', $role)),
                'title_sw' => ucwords(str_replace('_', ' ', $role)),
                'description' => 'Hotel operations workspace.',
                'description_sw' => 'Kazi za mfumo wa hoteli.',
                'badge' => 'Staff',
                'color' => 'blue',
                'route' => 'dashboard',
                'icon' => 'Home',
            ],
        };
    }

    /**
     * Role checking helpers (evaluates against active role and assigned roles).
     */
    public function isSuperAdmin(): bool
    {
        // When in an active support impersonation session, act as tenant manager and do not trigger superadmin redirects
        if (session()->has('impersonating_original_superadmin_id')) {
            return false;
        }

        return $this->role === 'super_admin'
            || $this->active_role === 'super_admin'
            || (is_array($this->roles) && in_array('super_admin', $this->roles))
            || in_array('super_admin', $this->roles_list);
    }

    public function isOwner(): bool
    {
        return in_array($this->active_role, ['owner', 'super_admin']) || in_array('owner', $this->roles_list);
    }

    public function isManager(): bool
    {
        return in_array($this->active_role, ['manager', 'general_manager', 'front_office_manager', 'owner', 'super_admin'])
            || count(array_intersect(['manager', 'general_manager', 'owner', 'super_admin'], $this->roles_list)) > 0;
    }

    public function isReceptionist(): bool
    {
        return in_array($this->active_role, ['receptionist', 'front_office_manager', 'manager', 'owner', 'super_admin'])
            || count(array_intersect(['receptionist', 'front_office_manager', 'manager'], $this->roles_list)) > 0;
    }

    public function isHousekeeper(): bool
    {
        return in_array($this->active_role, ['housekeeper', 'housekeeping_supervisor'])
            || count(array_intersect(['housekeeper', 'housekeeping_supervisor'], $this->roles_list)) > 0;
    }

    public function hasRole(string|array $roles): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $roles = is_array($roles) ? $roles : [$roles];

        return in_array($this->active_role, $roles) || count(array_intersect($roles, $this->roles_list)) > 0;
    }

    public function canManageBranches(): bool
    {
        if ($this->isSuperAdmin() || $this->isOwner()) {
            return true;
        }

        if ($this->isManager() && $this->can_manage_branches) {
            return true;
        }

        return (bool) $this->can_manage_branches;
    }
}
