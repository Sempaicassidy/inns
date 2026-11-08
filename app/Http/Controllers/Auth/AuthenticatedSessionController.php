<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Property;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        $branches = Property::where('is_active', true)->get(['id', 'name', 'code', 'city']);

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'branches' => $branches,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Clear any stale impersonation flags upon fresh login
        $request->session()->forget(['impersonating_original_superadmin_id', 'impersonated_tenant_name']);

        if ($request->filled('branch_id')) {
            session(['current_property_id' => $request->branch_id]);
            $request->user()->update(['property_id' => $request->branch_id]);
        }

        $user = $request->user() ?: Auth::user();

        if ($user && $user->isSuperAdmin()) {
            session(['active_role' => 'super_admin']);

            return redirect()->route('saas-admin.index');
        }

        // If user has multiple roles, take them to role selection screen first
        if ($user && $user->hasMultipleRoles()) {
            session()->forget('active_role');

            return redirect()->route('role.select');
        }

        $singleRole = $user?->roles_list[0] ?? $user?->role ?? 'general_manager';
        session(['active_role' => $singleRole]);
        $targetRoute = User::getRoleDashboardRoute($singleRole);

        // Clear any stored intended URL to ensure clean landing based on assigned role
        session()->forget('url.intended');

        return redirect()->route($targetRoute);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
