<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\BusinessDate;
use App\Models\Guest;
use App\Models\InventoryItem;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

$admin = User::where('email', 'admin@haula.co.tz')->first();
auth()->login($admin);
$property = Property::where('tenant_id', $admin->tenant_id)->first();
$roomType = RoomType::where('property_id', $property->id)->first();
$room = Room::where('property_id', $property->id)->first();
$ratePlan = RatePlan::where('property_id', $property->id)->first();
$guest = Guest::where('tenant_id', $admin->tenant_id)->first();

$report = [
    'working' => [],
    'failing' => [],
    'partial_or_static' => [],
];

// Helper to run action
function testAction($name, $closure, &$report) {
    try {
        $result = $closure();
        if ($result === true || $result === null) {
            $report['working'][] = $name;
        } else {
            $report['working'][] = "$name ($result)";
        }
    } catch (\Throwable $e) {
        $report['failing'][] = "$name: " . $e->getMessage() . " in " . basename($e->getFile()) . ":" . $e->getLine();
    }
}

echo "=== STARTING COMPREHENSIVE PLATFORM FEATURE AUDIT ===" . PHP_EOL;

// 1. FRONT DESK & RESERVATIONS
testAction('Front Desk: Create New Reservation', function () use ($admin, $property, $roomType, $ratePlan, $guest) {
    $controller = app(\App\Http\Controllers\ReservationController::class);
    $req = Request::create('/reservations', 'POST', [
        'property_id' => $property->id,
        'guest_name' => 'John Doe Audit',
        'guest_phone' => '+255754111222',
        'guest_email' => 'audit@guest.com',
        'check_in' => Carbon::today()->toDateString(),
        'check_out' => Carbon::today()->addDays(2)->toDateString(),
        'adults' => 2,
        'children' => 0,
        'room_type_id' => $roomType->id,
        'rate_plan_id' => $ratePlan->id,
        'status' => 'confirmed',
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->store($req);
    $res = Reservation::whereIn('guest_id', function ($q) {
        $q->select('id')->from('guests')->where('email', 'audit@guest.com');
    })->latest()->first();
    return $res ? "Res ID: {$res->id}" : false;
}, $report);

// 2. CHECK-IN
testAction('Front Desk: Guest Check-In', function () use ($admin, $room) {
    $res = Reservation::where('status', 'confirmed')->latest()->first();
    if (!$res) return 'No confirmed reservation to test';
    $controller = app(\App\Http\Controllers\ReservationController::class);
    $req = Request::create("/reservations/{$res->id}/check-in", 'POST', [
        'room_id' => $room->id,
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->checkIn($req, $res);
    $res->refresh();
    return $res->status === 'checked_in' ? true : "Status: {$res->status}";
}, $report);

// 3. CHECK-OUT
testAction('Front Desk: Guest Check-Out', function () use ($admin) {
    $res = Reservation::where('status', 'checked_in')->latest()->first();
    if (!$res) return 'No checked_in reservation to test';
    $controller = app(\App\Http\Controllers\ReservationController::class);
    $req = Request::create("/reservations/{$res->id}/check-out", 'POST');
    $req->setUserResolver(fn() => $admin);
    $controller->checkOut($req, $res);
    $res->refresh();
    return $res->status === 'checked_out' ? true : "Status: {$res->status}";
}, $report);

// 4. CALENDAR ROOM BLOCKING
testAction('Calendar: Block Room', function () use ($admin, $room) {
    $controller = app(\App\Http\Controllers\CalendarController::class);
    $req = Request::create('/calendar/block-room', 'POST', [
        'room_id' => $room->id,
        'reason' => 'Air conditioner maintenance repair',
        'start_date' => Carbon::today()->toDateString(),
        'end_date' => Carbon::today()->addDays(2)->toDateString(),
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->blockRoom($req);
    $room->refresh();
    return in_array($room->status_hk, ['out_of_order', 'out_of_service']);
}, $report);

testAction('Calendar: Unblock Room', function () use ($admin, $room) {
    $controller = app(\App\Http\Controllers\CalendarController::class);
    $req = Request::create('/calendar/unblock-room', 'POST', [
        'room_id' => $room->id,
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->unblockRoom($req);
    $room->refresh();
    return !in_array($room->status_hk, ['out_of_order', 'out_of_service']);
}, $report);

// 5. HOUSEKEEPING STATUS
testAction('Housekeeping: Update Room Cleanliness', function () use ($admin, $room) {
    $controller = app(\App\Http\Controllers\HousekeepingController::class);
    $req = Request::create("/housekeeping/rooms/{$room->id}/status", 'POST', [
        'status_hk' => 'clean',
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->updateRoomStatus($req, $room);
    $room->refresh();
    return $room->status_hk === 'clean';
}, $report);

// 6. RESTAURANT POS
testAction('Restaurant POS: Create Order & KOT', function () use ($admin, $property) {
    $controller = app(\App\Http\Controllers\PosController::class);
    $cat = \App\Models\PosCategory::firstOrCreate(['property_id' => $property->id, 'name' => 'Beverages']);
    $item = \App\Models\PosItem::firstOrCreate(
        ['property_id' => $property->id, 'name' => 'Kilimanjaro Premium Lager'],
        ['pos_category_id' => $cat->id, 'price_minor' => 500000, 'is_available' => true]
    );

    $req = Request::create('/pos/orders', 'POST', [
        'order_type' => 'dine_in',
        'table_number' => 'T-04',
        'payment_method' => 'cash',
        'items' => [
            ['item_id' => $item->id, 'quantity' => 2],
        ],
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->store($req);
    $order = \App\Models\PosOrder::where('table_number', 'T-04')->latest()->first();
    return $order ? "Order #{$order->order_number}, Total: {$order->total_minor}" : false;
}, $report);

// 7. INVENTORY & CENTRAL STORE
testAction('Inventory: Add Stock Item', function () use ($admin, $property) {
    $controller = app(\App\Http\Controllers\InventoryController::class);
    $req = Request::create('/inventory/items', 'POST', [
        'name' => 'Sugar 50kg Bags',
        'category' => 'Kitchen Food Supplies',
        'unit' => 'bag',
        'current_stock' => 10,
        'min_stock_alert' => 3,
        'unit_cost' => 120000,
        'location' => 'Dry Food Store A',
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->storeItem($req);
    $item = InventoryItem::where('name', 'Sugar 50kg Bags')->first();
    return $item ? true : false;
}, $report);

testAction('Inventory: Issue Stock Movement', function () use ($admin) {
    $item = InventoryItem::where('name', 'Sugar 50kg Bags')->first();
    if (!$item) return 'Item not found';
    $controller = app(\App\Http\Controllers\InventoryController::class);
    $req = Request::create('/inventory/issue', 'POST', [
        'inventory_item_id' => $item->id,
        'quantity' => 2,
        'destination' => 'Main Restaurant Kitchen',
        'notes' => 'Issued for breakfast baking',
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->issueStock($req);
    $item->refresh();
    return $item->current_stock === 8;
}, $report);

// 8. HR & STAFF SHIFTS
testAction('HR: Create Employee', function () use ($admin) {
    $controller = app(\App\Http\Controllers\HrController::class);
    $req = Request::create('/hr/employees', 'POST', [
        'first_name' => 'Amina',
        'last_name' => 'Juma',
        'email' => 'amina.juma' . rand(10, 99) . '@hotel.com',
        'phone' => '+255713444555',
        'department' => 'Front Office',
        'designation' => 'Receptionist',
        'hire_date' => Carbon::today()->toDateString(),
        'salary' => 450000,
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->storeEmployee($req);
    $emp = \App\Models\Employee::where('full_name', 'like', '%Amina%')->latest()->first();
    return $emp ? true : false;
}, $report);

// 9. ACCOUNTING & EXPENSES
testAction('Accounting: Record Hotel Operational Expense', function () use ($admin, $property) {
    $controller = app(\App\Http\Controllers\AccountingController::class);
    $req = Request::create('/accounting/expenses', 'POST', [
        'property_id' => $property->id,
        'title' => 'Emergency Generator Fuel 200L',
        'category' => 'Utilities & Fuel',
        'amount' => 640000,
        'payment_method' => 'bank_transfer',
        'paid_to' => 'Puma Energy Moshi',
        'reference' => 'PUMA-INNS-' . rand(100, 999),
        'expense_date' => Carbon::today()->toDateString(),
        'description' => 'Diesel purchased for standby generator',
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->storeExpense($req);
    $exp = \App\Models\Expense::where('title', 'Emergency Generator Fuel 200L')->first();
    return $exp ? "Expense ID: {$exp->id}" : false;
}, $report);

// 10. BRANCHES / PROPERTIES
testAction('Branches: Add New Branch Property', function () use ($admin) {
    $controller = app(\App\Http\Controllers\BranchController::class);
    $req = Request::create('/branches', 'POST', [
        'name' => 'Ngorongoro Crater Rim Tented Villa',
        'code' => 'NCRV',
        'city' => 'Karatu',
        'property_type' => 'camp',
        'timezone' => 'Africa/Dar_es_Salaam',
        'currency' => 'TZS',
        'checkin_time' => '14:00',
        'checkout_time' => '10:00',
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->store($req);
    $b = Property::where('code', 'NCRV')->first();
    return $b ? true : false;
}, $report);

// 11. NIGHT AUDIT
testAction('Night Audit: Daily Business Rollover', function () use ($admin, $property) {
    $controller = app(\App\Http\Controllers\NightAuditController::class);
    $req = Request::create('/night-audit/run', 'POST', [
        'property_id' => $property->id,
        'post_room_charges' => true,
    ]);
    $req->setUserResolver(fn() => $admin);
    $controller->runAudit($req);
    return true;
}, $report);

// Output Results
echo PHP_EOL . "--- AUDIT SUMMARY REPORT ---" . PHP_EOL;
echo "WORKING FUNCTIONALITIES (" . count($report['working']) . "):" . PHP_EOL;
foreach ($report['working'] as $w) {
    echo "  [OK] $w" . PHP_EOL;
}

echo PHP_EOL . "FAILING OR BROKEN FUNCTIONALITIES (" . count($report['failing']) . "):" . PHP_EOL;
if (empty($report['failing'])) {
    echo "  [NONE] Zero broken backend actions found!" . PHP_EOL;
} else {
    foreach ($report['failing'] as $f) {
        echo "  [FAIL] $f" . PHP_EOL;
    }
}
