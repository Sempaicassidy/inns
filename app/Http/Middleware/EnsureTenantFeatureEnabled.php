<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantFeatureEnabled
{
    /**
     * Handle an incoming request and ensure the tenant is entitled to this module.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        $user = Auth::user();

        // Super admins or users in temporary support impersonation mode bypass module gating
        if ($user && ($user->isSuperAdmin() || session()->has('impersonating_original_superadmin_id'))) {
            return $next($request);
        }

        $tenant = $user?->tenant;

        if (!$tenant) {
            return $next($request);
        }

        if (!$tenant->hasFeature($featureKey)) {
            $featureMeta = Tenant::AVAILABLE_FEATURES[$featureKey] ?? null;
            $featureTitle = $featureMeta['name'] ?? ucwords(str_replace('_', ' ', $featureKey));

            $message = "The '{$featureTitle}' module is not included in your hotel's current subscription. Please contact your system provider to upgrade your plan.";

            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'Feature Not Available',
                    'message' => $message,
                    'feature' => $featureKey,
                ], 403);
            }

            return redirect()->route('dashboard')->with('error', $message);
        }

        return $next($request);
    }
}
