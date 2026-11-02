<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsolation
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user && !$user->isSuperAdmin()) {
            // Ensure user has a tenant_id
            if (!$user->tenant_id && !app()->environment('testing')) {
                abort(403, 'User must belong to a tenant');
            }

            // Add global scope to models with BelongsToTenant trait
            // This is handled by the BelongsToTenant trait in the models
        }

        return $next($request);
    }
}
