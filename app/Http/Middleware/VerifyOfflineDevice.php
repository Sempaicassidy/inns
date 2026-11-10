<?php

namespace App\Http\Middleware;

use App\Models\OfflineDevice;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class VerifyOfflineDevice
{
    /**
     * Handle an incoming offline API request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'UNAUTHENTICATED',
                'message' => 'Authentication is required for synchronization.'
            ], 401);
        }

        if (!$user->tenant_id && !$user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'error' => 'TENANT_REQUIRED',
                'message' => 'User must belong to a registered tenant.'
            ], 403);
        }

        $deviceId = $request->header('X-Device-Id') ?? $request->input('device_id');

        if ($deviceId) {
            $device = OfflineDevice::where('tenant_id', $user->tenant_id)
                ->where('device_id', $deviceId)
                ->first();

            if ($device) {
                if ($device->isRevoked()) {
                    return response()->json([
                        'success' => false,
                        'error' => 'DEVICE_REVOKED',
                        'message' => 'This device has been revoked by tenant administrator. Offline access denied.'
                    ], 403);
                }

                $device->markSeen();
                $request->attributes->set('offline_device', $device);
            }
        }

        return $next($request);
    }
}
