<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSaasAdmin
{
    /**
     * Restrict SaaS platform administration endpoints to platform
     * super administrators, including authorized support impersonation.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        $isPlatformAdmin = $user && (
            $user->isSuperAdmin()
            || session()->has('impersonating_original_superadmin_id')
        );

        if (! $isPlatformAdmin) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'Forbidden',
                    'message' => 'SaaS Platform Administrator access required.',
                ], 403);
            }

            abort(403, 'Unauthorized. Super Administrator access required.');
        }

        return $next($request);
    }
}
