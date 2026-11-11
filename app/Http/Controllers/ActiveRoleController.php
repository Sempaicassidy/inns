<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ActiveRoleController extends Controller
{
    /**
     * Switch the authenticated user's active workspace role.
     *
     * The selected role is validated server-side against the roles
     * actually assigned to the user (users.roles / users.role). The
     * active role is stored in the session only — it never grants
     * permissions beyond what the assigned role already allows.
     */
    public function switch(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'max:60'],
        ]);

        $user = $request->user();

        if (! $user) {
            abort(401);
        }

        $selectedRole = $validated['role'];
        $assignedRoles = $user->roles_list;

        $isAllowed = in_array($selectedRole, $assignedRoles, true)
            || ($user->isSuperAdmin() && $selectedRole === 'super_admin');

        if (! $isAllowed) {
            throw ValidationException::withMessages([
                'role' => 'Huna ruhusa ya kutumia jukumu hili (role is not assigned to your account).',
            ]);
        }

        $previousRole = $user->active_role;
        session(['active_role' => $selectedRole]);

        Log::info('active_role.switched', [
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'from_role' => $previousRole,
            'to_role' => $selectedRole,
            'ip' => $request->ip(),
        ]);

        $dashboardRoute = User::getRoleDashboardRoute($selectedRole);
        $dashboardUrl = route($dashboardRoute);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'role' => $selectedRole,
                'dashboard' => $dashboardUrl,
                'dashboard_route' => $dashboardRoute,
            ]);
        }

        return redirect()->to($dashboardUrl);
    }
}
