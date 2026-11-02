<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleSelectionController extends Controller
{
    /**
     * Show the role selection screen.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $rolesList = $user->roles_list;

        // If user has 0 or 1 role, auto-select and proceed directly
        if (count($rolesList) <= 1) {
            $singleRole = $rolesList[0] ?? $user->role ?? 'general_manager';
            session(['active_role' => $singleRole]);
            $targetRoute = User::getRoleDashboardRoute($singleRole);

            return redirect()->route($targetRoute);
        }

        $rolesMetadata = array_map(function ($roleKey) {
            return User::getRoleMetadata($roleKey);
        }, $rolesList);

        return Inertia::render('Auth/SelectRole', [
            'roles' => $rolesMetadata,
            'activeRole' => session('active_role', $user->active_role),
            'property' => $user->property,
        ]);
    }

    /**
     * Set the selected active role into session and redirect to role's dashboard.
     */
    public function select(Request $request): RedirectResponse
    {
        $request->validate([
            'role' => 'required|string',
        ]);

        $user = $request->user();
        $selectedRole = $request->input('role');
        $validRoles = $user->roles_list;

        if (! in_array($selectedRole, $validRoles) && ! $user->isSuperAdmin()) {
            return back()->with('error', 'Huna ruhusa ya kutumia jukumu hili.');
        }

        session(['active_role' => $selectedRole]);

        $targetRoute = User::getRoleDashboardRoute($selectedRole);
        $roleMeta = User::getRoleMetadata($selectedRole);

        return redirect()->route($targetRoute)->with('success', "Umeingia kama {$roleMeta['title_sw']}");
    }
}
