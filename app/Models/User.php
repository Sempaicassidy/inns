<?php

namespace App\Models;

use App\Notifications\TenantResetPasswordNotification;
use App\Notifications\TenantVerifyEmailNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

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
        'username',
        'email',
        'phone',
        'password',
        'role',
        'roles',
        'can_manage_branches',
        'status',
        'pin_code',
        'locale',
        'email_verified_at',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'active_role',
        'roles_list',
        'hotel_name',
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
     * Tenant and property must come from the stored assignment only.
     * Never silently fall back to the first tenant/property in the system —
     * that would leak data across tenant boundaries.
     */

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

        return $this->roles_list[0] ?? $this->role ?? 'staff';
    }

    /**
     * Generate a guaranteed unique, human-friendly username from name and/or email.
     */
    public static function generateUniqueUsername(string $name, ?string $email = null): string
    {
        $firstPart = explode(' ', trim($name))[0] ?? '';
        $base = Str::lower(preg_replace('/[^a-zA-Z0-9_]/', '', $firstPart));
        if (empty($base) && $email) {
            $emailPrefix = explode('@', $email)[0] ?? '';
            $base = Str::lower(preg_replace('/[^a-zA-Z0-9_]/', '', $emailPrefix));
        }
        if (empty($base)) {
            $base = 'user';
        }

        $candidate = $base;
        $counter = 1;
        while (static::where('username', $candidate)->exists()) {
            $candidate = $base.'_'.$counter;
            $counter++;
        }

        return $candidate;
    }

    /**
     * Determine the dashboard route for a given role.
     */
    public static function getRoleDashboardRoute(string $role): string
    {
        return match ($role) {
            'super_admin' => 'saas-admin.index',
            'owner' => 'owner.index',
            'housekeeper', 'housekeeping_supervisor' => 'housekeeping.index',
            'pos_cashier', 'cashier', 'waiter', 'bartender', 'chef',
            'restaurant_cashier', 'restaurant_staff' => 'pos.index',
            'grocery_cashier', 'supermarket_cashier' => 'grocery.pos',
            'storekeeper', 'procurement_manager' => 'inventory.index',
            'accountant' => 'accounting.index',
            'night_auditor' => 'night-audit.index',
            'hr_manager' => 'hr.index',
            'general_manager', 'manager' => 'dashboard',
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
            'owner' => [
                'role' => 'owner',
                'title' => 'Property Owner / Director',
                'title_sw' => 'Property Owner / Director',
                'description' => 'Multi-branch executive oversight, chain of command, financial governance & approvals.',
                'description_sw' => 'Multi-branch executive oversight, chain of command, financial governance & approvals.',
                'badge' => 'Owner',
                'color' => 'amber',
                'route' => 'owner.index',
                'icon' => 'Crown',
            ],
            'super_admin' => [
                'role' => 'super_admin',
                'title' => 'SaaS Platform Admin',
                'title_sw' => 'SaaS Platform Admin',
                'description' => 'Global tenant ecosystem, subscription billing, SMS gateways and system health.',
                'description_sw' => 'Global tenant ecosystem, subscription billing, SMS gateways and system health.',
                'badge' => 'SuperAdmin',
                'color' => 'rose',
                'route' => 'saas-admin.index',
                'icon' => 'Shield',
            ],
            'general_manager', 'manager' => [
                'role' => $role,
                'title' => 'General Manager',
                'title_sw' => 'General Manager',
                'description' => 'Executive overview, occupancy rates, daily revenue, ADR & RevPAR.',
                'description_sw' => 'Executive overview, occupancy rates, daily revenue, ADR & RevPAR.',
                'badge' => 'Executive',
                'color' => 'blue',
                'route' => 'dashboard',
                'icon' => 'Briefcase',
            ],
            'receptionist', 'front_desk', 'front_office_manager' => [
                'role' => $role,
                'title' => 'Front Desk / Reception',
                'title_sw' => 'Front Desk / Reception',
                'description' => 'Guest check-in & check-out, bookings, arrivals list, and guest folios.',
                'description_sw' => 'Guest check-in & check-out, bookings, arrivals list, and guest folios.',
                'badge' => 'Front Desk',
                'color' => 'emerald',
                'route' => 'dashboard',
                'icon' => 'KeyRound',
            ],
            'housekeeper', 'housekeeping_supervisor' => [
                'role' => $role,
                'title' => 'Housekeeping & Sanitation',
                'title_sw' => 'Housekeeping & Sanitation',
                'description' => 'Room clean/dirty status, housekeeping tasks, inspections and supplies.',
                'description_sw' => 'Room clean/dirty status, housekeeping tasks, inspections and supplies.',
                'badge' => 'Operations',
                'color' => 'amber',
                'route' => 'housekeeping.index',
                'icon' => 'CheckCircle',
            ],
            'pos_cashier', 'cashier' => [
                'role' => $role,
                'title' => 'Restaurant & POS Cashier',
                'title_sw' => 'Restaurant & POS Cashier',
                'description' => 'Food & beverage orders, table service, billing, and receipt printing.',
                'description_sw' => 'Food & beverage orders, table service, billing, and receipt printing.',
                'badge' => 'Sales',
                'color' => 'purple',
                'route' => 'pos.index',
                'icon' => 'Utensils',
            ],
            'accountant' => [
                'role' => $role,
                'title' => 'Accountant & Finance',
                'title_sw' => 'Accountant & Finance',
                'description' => 'Ledgers, guest folios, payment reconciliations, and expense records.',
                'description_sw' => 'Ledgers, guest folios, payment reconciliations, and expense records.',
                'badge' => 'Finance',
                'color' => 'indigo',
                'route' => 'accounting.index',
                'icon' => 'DollarSign',
            ],
            'night_auditor' => [
                'role' => $role,
                'title' => 'Night Auditor',
                'title_sw' => 'Night Auditor',
                'description' => 'End-of-day rollover, posting daily room charges, and closing business date.',
                'description_sw' => 'End-of-day rollover, posting daily room charges, and closing business date.',
                'badge' => 'Audit',
                'color' => 'slate',
                'route' => 'night-audit.index',
                'icon' => 'Moon',
            ],
            'hr_manager' => [
                'role' => $role,
                'title' => 'HR & Staff Management',
                'title_sw' => 'HR & Staff Management',
                'description' => 'Staff shifts, duty rosters, attendance logs, and staff directory.',
                'description_sw' => 'Staff shifts, duty rosters, attendance logs, and staff directory.',
                'badge' => 'HR',
                'color' => 'teal',
                'route' => 'hr.index',
                'icon' => 'UserCheck',
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
     * Determine if the user has verified their email address.
     * Super admins are always considered verified to avoid being locked out.
     */
    public function hasVerifiedEmail(): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return ! is_null($this->email_verified_at);
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
        return $this->role === 'owner'
            || $this->active_role === 'owner'
            || (is_array($this->roles) && in_array('owner', $this->roles))
            || in_array('owner', $this->roles_list);
    }

    public function isManager(): bool
    {
        // When active role is explicitly owner, do not treat as manager
        if ($this->active_role === 'owner') {
            return false;
        }

        return in_array($this->active_role, ['manager', 'general_manager', 'front_office_manager', 'super_admin'])
            || count(array_intersect(['manager', 'general_manager', 'super_admin'], $this->roles_list)) > 0;
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

    public function isPosStaff(): bool
    {
        $posRoles = [
            'pos_cashier', 'cashier', 'waiter', 'bartender', 'chef',
            'restaurant_cashier', 'restaurant_staff',
            'grocery_cashier', 'supermarket_cashier', 'storekeeper',
        ];

        return in_array($this->active_role, $posRoles)
            || in_array($this->role, $posRoles)
            || count(array_intersect($posRoles, $this->roles_list)) > 0;
    }

    public function canAccessHr(): bool
    {
        if ($this->isSuperAdmin() || $this->isOwner()) {
            return true;
        }

        // Pos cashiers, grocery, restaurant, reception, housekeeping & general staff are strictly denied
        $restrictedRoles = [
            'receptionist', 'front_desk', 'front_office', 'staff',
            'cashier', 'pos_cashier', 'waiter', 'bartender', 'chef',
            'restaurant_cashier', 'restaurant_staff',
            'grocery_cashier', 'supermarket_cashier', 'storekeeper',
            'housekeeper', 'housekeeping_supervisor',
        ];

        $currentRole = $this->active_role ?: $this->role;
        if (in_array($currentRole, $restrictedRoles)) {
            return false;
        }

        $allowedRoles = ['general_manager', 'manager', 'admin', 'hr_manager'];

        return in_array($currentRole, $allowedRoles)
            || in_array($this->role, $allowedRoles)
            || count(array_intersect($allowedRoles, $this->roles_list)) > 0;
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

    /**
     * Get the hotel / tenant name associated with this user.
     */
    public function getHotelNameAttribute(): string
    {
        $rawPropertyId = $this->getRawOriginal('property_id');
        $rawTenantId = $this->getRawOriginal('tenant_id');

        if ($rawPropertyId) {
            $property = Property::find($rawPropertyId);
            if ($property?->name) {
                return $property->name;
            }
        }

        if ($rawTenantId) {
            $tenant = Tenant::find($rawTenantId);
            if ($tenant?->name) {
                return $tenant->name;
            }
        }

        return config('app.name', 'THE INNS');
    }

    /**
     * Send the password reset notification with tenant/hotel branding.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new TenantResetPasswordNotification($token));
    }

    /**
     * Send the email verification notification with tenant/hotel branding.
     */
    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new TenantVerifyEmailNotification);
    }
}
