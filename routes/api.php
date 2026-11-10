<?php

use App\Http\Controllers\Api\DeviceController;
use App\Http\Controllers\Api\OfflineSyncController;
use App\Http\Middleware\VerifyOfflineDevice;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Offline-First PWA API Routes
|--------------------------------------------------------------------------
*/

Route::prefix('offline')->group(function () {
    // 1. Unauthenticated ping check
    Route::get('/ping', [OfflineSyncController::class, 'ping']);

    // 2. Authenticated & Tenant-isolated offline endpoints
    Route::middleware(['web', 'auth', 'tenant.isolation', VerifyOfflineDevice::class])->group(function () {
        // Device Management
        Route::post('/devices', [DeviceController::class, 'store']);
        Route::get('/devices', [DeviceController::class, 'index']);
        Route::delete('/devices/{device}', [DeviceController::class, 'destroy']);

        // Synchronization Engine
        Route::post('/sync', [OfflineSyncController::class, 'sync']);
        Route::get('/bootstrap', [OfflineSyncController::class, 'bootstrap']);
        Route::get('/changes', [OfflineSyncController::class, 'changes']);
    });
});
