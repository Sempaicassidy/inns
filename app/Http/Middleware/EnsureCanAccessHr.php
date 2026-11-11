<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureCanAccessHr
{
    /**
     * Handle an incoming request.
     * Enforce strict role-based access for Staff & HR management hub.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->canAccessHr()) {
            if ($request->wantsJson() || $request->ajax() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Staff and POS station operators cannot access Staff & HR Management.',
                ], 403);
            }

            // Redirect POS cashiers to POS terminal; otherwise to dashboard
            $fallbackRoute = ($user && $user->isPosStaff()) ? 'pos.index' : 'dashboard';

            return redirect()->route($fallbackRoute)->with('error', 'Unauthorized. Staff and POS station operators cannot access Staff & HR Management.');
        }

        return $next($request);
    }
}
