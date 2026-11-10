<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OfflineDevice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DeviceController extends Controller
{
    /**
     * Register a new offline device for the authenticated user and tenant.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'device_id' => 'required|string|max:100',
            'device_name' => 'nullable|string|max:150',
        ]);

        $device = OfflineDevice::withoutGlobalScopes()
            ->where('tenant_id', $user->tenant_id)
            ->where('device_id', $validated['device_id'])
            ->first();

        if ($device) {
            if ($device->isRevoked()) {
                return response()->json([
                    'success' => false,
                    'error' => 'DEVICE_REVOKED',
                    'message' => 'This device was previously revoked. Please contact your tenant administrator.'
                ], 403);
            }

            $device->update([
                'user_id' => $user->id,
                'device_name' => $validated['device_name'] ?? $device->device_name,
                'last_seen_at' => now(),
            ]);
        } else {
            $device = OfflineDevice::create([
                'tenant_id' => $user->tenant_id,
                'user_id' => $user->id,
                'device_id' => $validated['device_id'],
                'device_name' => $validated['device_name'] ?? $request->userAgent() ?? 'Offline PWA Client',
                'last_seen_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Device registered successfully for offline operations.',
            'device' => [
                'id' => $device->id,
                'device_id' => $device->device_id,
                'device_name' => $device->device_name,
                'tenant_id' => $device->tenant_id,
                'last_seen_at' => $device->last_seen_at,
            ],
        ]);
    }

    /**
     * List all registered devices for the current tenant.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $devices = OfflineDevice::where('tenant_id', $user->tenant_id)
            ->with('user:id,name,email')
            ->orderByDesc('last_seen_at')
            ->get();

        return response()->json([
            'success' => true,
            'devices' => $devices,
        ]);
    }

    /**
     * Revoke an offline device.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = Auth::user();

        $device = OfflineDevice::where('tenant_id', $user->tenant_id)
            ->where(function ($query) use ($id) {
                $query->where('id', $id)->orWhere('device_id', $id);
            })
            ->firstOrFail();

        $device->update(['revoked_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => "Device {$device->device_name} has been revoked.",
        ]);
    }
}

