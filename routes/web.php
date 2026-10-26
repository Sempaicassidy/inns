<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FolioController;
use App\Http\Controllers\HousekeepingController;
use App\Http\Controllers\NightAuditController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReservationController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check() ? redirect()->route('dashboard') : redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // 1. Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Room Availability Gantt Calendar
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');

    // 3. Reservations & Front Desk
    Route::get('/reservations', [ReservationController::class, 'index'])->name('reservations.index');
    Route::post('/reservations', [ReservationController::class, 'store'])->name('reservations.store');
    Route::post('/reservations/{reservation}/check-in', [ReservationController::class, 'checkIn'])->name('reservations.check-in');
    Route::post('/reservations/{reservation}/check-out', [ReservationController::class, 'checkOut'])->name('reservations.check-out');
    Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel'])->name('reservations.cancel');

    // 4. Folios & Billing
    Route::get('/folios', [FolioController::class, 'index'])->name('folios.index');
    Route::get('/folios/{folio}', [FolioController::class, 'show'])->name('folios.show');
    Route::post('/folios/{folio}/charges', [FolioController::class, 'addCharge'])->name('folios.charges.store');
    Route::post('/folios/{folio}/payments', [FolioController::class, 'addPayment'])->name('folios.payments.store');

    // 5. Housekeeping
    Route::get('/housekeeping', [HousekeepingController::class, 'index'])->name('housekeeping.index');
    Route::post('/housekeeping/rooms/{room}/status', [HousekeepingController::class, 'updateRoomStatus'])->name('housekeeping.rooms.status');
    Route::post('/housekeeping/tasks', [HousekeepingController::class, 'createTask'])->name('housekeeping.tasks.store');
    Route::post('/housekeeping/tasks/{task}/status', [HousekeepingController::class, 'updateTaskStatus'])->name('housekeeping.tasks.status');

    // 6. Night Audit
    Route::get('/night-audit', [NightAuditController::class, 'index'])->name('night-audit.index');
    Route::post('/night-audit/run', [NightAuditController::class, 'runAudit'])->name('night-audit.run');

    // Profile Settings
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
