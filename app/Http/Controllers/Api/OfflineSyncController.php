<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Offline\OfflineSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OfflineSyncController extends Controller
{
    public function __construct(
        protected OfflineSyncService $syncService
    ) {}

    /**
     * Lightweight ping endpoint for real server connectivity check.
     */
    public function ping(): JsonResponse
    {
        return response()->json([
            'status' => 'ONLINE',
            'server_time' => now()->toISOString(),
            'authenticated' => Auth::check(),
        ]);
    }

    /**
     * Process batch of offline operations.
     */
    public function sync(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'device_id' => 'required|string|max:100',
            'operations' => 'required|array',
            'operations.*.operation_id' => 'required|string|max:100',
            'operations.*.type' => 'required|string',
            'operations.*.action' => 'required|string',
            'operations.*.payload' => 'required|array',
        ]);

        $result = $this->syncService->syncBatch(
            $user,
            $validated['device_id'],
            $validated['operations']
        );

        return response()->json($result);
    }

    /**
     * Download baseline data for local IndexedDB bootstrap.
     */
    public function bootstrap(): JsonResponse
    {
        $user = Auth::user();
        $data = $this->syncService->getBootstrapData($user);

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Download incremental delta changes since cursor.
     */
    public function changes(Request $request): JsonResponse
    {
        $user = Auth::user();
        $cursor = $request->query('cursor');

        $changes = $this->syncService->getChanges($user, $cursor);

        return response()->json([
            'success' => true,
            'data' => $changes,
        ]);
    }
}

