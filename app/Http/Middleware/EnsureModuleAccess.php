<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureModuleAccess
{
    /**
     * Module key => roles permitted to access it (matched against the
     * server-confirmed active role, never a frontend-supplied value).
     *
     * @var array<string, array<int, string>>
     */
    private const MODULE_ROLES = [
        'accounting' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'accountant', 'senior_accountant', 'finance_officer', 'auditor',
        ],
        'restaurant_pos' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'pos_cashier', 'cashier', 'waiter', 'bartender', 'chef',
        ],
        'grocery_pos' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'grocery_cashier', 'supermarket_cashier', 'cashier', 'storekeeper',
            'procurement_manager',
        ],
        'housekeeping' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'housekeeper', 'housekeeping_supervisor', 'staff',
        ],
        'maintenance' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'housekeeper', 'housekeeping_supervisor', 'staff',
        ],
        'front_office' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'receptionist', 'front_desk', 'front_office', 'front_office_manager',
            'staff', 'accountant', 'senior_accountant', 'finance_officer', 'auditor',
        ],
        'hr_payroll' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'hr_manager',
        ],
        'inventory' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'storekeeper', 'procurement_manager',
            'accountant', 'senior_accountant', 'finance_officer', 'auditor',
        ],
        'executive_reports' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'accountant', 'senior_accountant', 'finance_officer', 'auditor',
            'night_auditor',
        ],
        'manager_alerts' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'accountant', 'senior_accountant', 'finance_officer',
        ],
        'whatsapp_sms' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'receptionist', 'front_desk', 'front_office', 'front_office_manager',
        ],
        'data_entry' => [
            'owner', 'super_admin', 'general_manager', 'manager', 'admin',
            'storekeeper', 'procurement_manager',
            'accountant', 'senior_accountant', 'finance_officer',
        ],
    ];

    /**
     * Check whether a role is permitted to access a module, using the same
     * allow-list as the middleware. Used to avoid redirect loops when
     * role-based dashboard routing is resolved.
     */
    public static function roleCanAccessModule(string $module, ?string $role): bool
    {
        if (! $role) {
            return true;
        }

        $allowed = self::MODULE_ROLES[$module] ?? null;

        return $allowed === null || in_array($role, $allowed, true);
    }

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $user = Auth::user();

        if (! $user) {
            return $next($request);
        }

        // Platform super admins and support impersonation bypass module gating
        if ($user->isSuperAdmin() || session()->has('impersonating_original_superadmin_id')) {
            return $next($request);
        }

        $allowed = self::MODULE_ROLES[$module] ?? null;

        // Unknown module keys fall through to tenant.feature gating only
        if ($allowed === null) {
            return $next($request);
        }

        $activeRole = $user->active_role;

        if (! in_array($activeRole, $allowed, true)) {
            Log::warning('module.access.denied', [
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'module' => $module,
                'active_role' => $activeRole,
                'path' => $request->path(),
                'ip' => $request->ip(),
            ]);

            $message = 'You do not have access to this module with your current role. Switch to an authorized role or contact your administrator.';

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'Module Access Denied',
                    'message' => $message,
                    'module' => $module,
                    'active_role' => $activeRole,
                ], 403);
            }

            return redirect()->route('dashboard')->with('error', $message);
        }

        return $next($request);
    }
}
