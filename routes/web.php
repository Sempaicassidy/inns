<?php

use App\Http\Controllers\AccountingController;
use App\Http\Controllers\Auth\RoleSelectionController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FolioController;
use App\Http\Controllers\GroceryController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\HousekeepingController;
use App\Http\Controllers\HrController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ManagerNotificationController;
use App\Http\Controllers\NightAuditController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RatePlanController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ReservationController;
use App\Http\Controllers\RestaurantController;
use App\Http\Controllers\RoomTypeController;
use App\Http\Controllers\SaasAdminController;
use App\Http\Controllers\SpreadsheetDataEntryController;
use App\Http\Controllers\TenantSettingsController;
use App\Http\Controllers\WhatsAppController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    $cachedCms = cache('cms_landing_settings', []);
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'user' => auth()->user(),
        'cms_content' => $cachedCms,
    ]);
})->name('home');

// PWA Assets (Web Manifest & Service Worker)
Route::get('/manifest.webmanifest', function () {
    return response()->file(public_path('manifest.webmanifest'), [
        'Content-Type' => 'application/manifest+json',
        'Cache-Control' => 'public, max-age=3600',
    ]);
});

Route::get('/sw.js', function () {
    return response()->file(public_path('sw.js'), [
        'Content-Type' => 'application/javascript',
        'Service-Worker-Allowed' => '/',
        'Cache-Control' => 'no-cache',
    ]);
});

Route::middleware(['auth', 'verified', 'tenant.isolation'])->group(function () {
    // 1. Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Room Availability Gantt Calendar
    Route::get('/calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::post('/calendar/block-room', [CalendarController::class, 'blockRoom'])->name('calendar.block-room');
    Route::post('/calendar/unblock-room', [CalendarController::class, 'unblockRoom'])->name('calendar.unblock-room');

    // 3. Reservations & Front Desk
    Route::get('/reservations', [ReservationController::class, 'index'])->name('reservations.index');
    Route::get('/reservations/create', [ReservationController::class, 'index'])->name('reservations.create');
    Route::get('/reservations/check-in', [ReservationController::class, 'index'])->name('reservations.checkin');
    Route::get('/reservations/check-out', [ReservationController::class, 'index'])->name('reservations.checkout');
    Route::post('/reservations', [ReservationController::class, 'store'])->name('reservations.store');
    Route::post('/reservations/{reservation}/check-in', [ReservationController::class, 'checkIn'])->name('reservations.check-in');
    Route::post('/reservations/{reservation}/check-out', [ReservationController::class, 'checkOut'])->name('reservations.check-out');
    Route::post('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel'])->name('reservations.cancel');
    Route::match(['put', 'patch'], '/reservations/{reservation}', [ReservationController::class, 'update'])->name('reservations.update');

    // 3.01 Rate Plans & Meal Basis Management
    Route::get('/rate-plans', [RatePlanController::class, 'index'])->name('rate-plans.index');
    Route::post('/rate-plans', [RatePlanController::class, 'store'])->name('rate-plans.store');
    Route::match(['put', 'patch'], '/rate-plans/{ratePlan}', [RatePlanController::class, 'update'])->name('rate-plans.update');
    Route::delete('/rate-plans/{ratePlan}', [RatePlanController::class, 'destroy'])->name('rate-plans.destroy');

    // 3.02 Room Types Management
    Route::get('/room-types', [RoomTypeController::class, 'index'])->name('room-types.index');
    Route::post('/room-types', [RoomTypeController::class, 'store'])->name('room-types.store');
    Route::match(['put', 'patch'], '/room-types/{roomType}', [RoomTypeController::class, 'update'])->name('room-types.update');
    Route::delete('/room-types/{roomType}', [RoomTypeController::class, 'destroy'])->name('room-types.destroy');

    // 3.1 Guest Portal & CRM
    Route::get('/guests', [GuestController::class, 'index'])->name('guests.index');
    Route::get('/guest-portal', [GuestController::class, 'index'])->name('guest-portal.index');
    Route::get('/guest-requests', [GuestController::class, 'index'])->name('guest.requests.index');
    Route::post('/guests', [GuestController::class, 'store'])->name('guests.store');
    Route::match(['put', 'patch'], '/guests/{guest}', [GuestController::class, 'update'])->name('guests.update');

    // 4. Folios & Billing
    Route::get('/folios', [FolioController::class, 'index'])->name('folios.index');
    Route::get('/folios/{folio}', [FolioController::class, 'show'])->name('folios.show');
    Route::post('/folios/{folio}/charges', [FolioController::class, 'addCharge'])->name('folios.charges.store');
    Route::post('/folios/{folio}/payments', [FolioController::class, 'addPayment'])->name('folios.payments.store');

    // 5. Housekeeping & Rooms
    Route::get('/housekeeping', [HousekeepingController::class, 'index'])->name('housekeeping.index');
    Route::get('/housekeeping/status', [HousekeepingController::class, 'index'])->name('housekeeping.status');
    Route::get('/maintenance', [HousekeepingController::class, 'index'])->name('maintenance.index');
    Route::post('/housekeeping/rooms', [HousekeepingController::class, 'storeRoom'])->name('housekeeping.rooms.store');
    Route::post('/housekeeping/rooms/{room}/status', [HousekeepingController::class, 'updateRoomStatus'])->name('housekeeping.rooms.status');
    Route::post('/housekeeping/tasks', [HousekeepingController::class, 'createTask'])->name('housekeeping.tasks.store');
    Route::post('/housekeeping/tasks/{task}/status', [HousekeepingController::class, 'updateTaskStatus'])->name('housekeeping.tasks.status');

    // 6. POS Restaurant Manager Portal & Report (Dedicated Independent Module)
    Route::get('/restaurant', [RestaurantController::class, 'index'])->name('restaurant.index');
    Route::post('/restaurant/items', [RestaurantController::class, 'storeItem'])->name('restaurant.items.store');
    Route::match(['put', 'patch'], '/restaurant/items/{item}', [RestaurantController::class, 'updateItem'])->name('restaurant.items.update');
    Route::post('/restaurant/items/{item}/toggle-availability', [RestaurantController::class, 'toggleAvailability'])->name('restaurant.items.toggle');
    Route::post('/restaurant/categories', [RestaurantController::class, 'storeCategory'])->name('restaurant.categories.store');
    Route::post('/restaurant/orders/{order}/status', [RestaurantController::class, 'updateOrderStatus'])->name('restaurant.orders.status');

    // 6b. Waitstaff & Cashier POS Terminal
    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::post('/pos/orders', [PosController::class, 'store'])->name('pos.store');
    Route::post('/pos/order-store', [PosController::class, 'store'])->name('pos.orders.store');

    // 6c. POS Grocery & Retail Minimart Management (Manager Portal & Counter Sales)
    Route::get('/grocery', [GroceryController::class, 'index'])->name('grocery.index');
    Route::post('/grocery/items', [GroceryController::class, 'storeItem'])->name('grocery.items.store');
    Route::match(['put', 'patch'], '/grocery/items/{item}', [GroceryController::class, 'updateItem'])->name('grocery.items.update');
    Route::post('/grocery/items/{item}/restock', [GroceryController::class, 'restock'])->name('grocery.items.restock');
    Route::post('/grocery/items/{item}/toggle-availability', [GroceryController::class, 'toggleAvailability'])->name('grocery.items.toggle');
    Route::post('/grocery/orders', [GroceryController::class, 'storeOrder'])->name('grocery.orders.store');

    // 7. Hotel Accounting & Financial Engine
    Route::get('/accounting', [AccountingController::class, 'index'])->name('accounting.index');
    Route::post('/accounting/expenses', [AccountingController::class, 'storeExpense'])->name('accounting.expenses.store');
    Route::post('/accounting/expenses/{expense}/approve', [AccountingController::class, 'approveExpense'])->name('accounting.expenses.approve');
    Route::get('/accounting/transactions', [AccountingController::class, 'transactions'])->name('accounting.transactions');
    Route::get('/accounting/refunds', [AccountingController::class, 'refunds'])->name('accounting.refunds');
    Route::get('/accounting/cashbook', [AccountingController::class, 'cashbook'])->name('accounting.cashbook');
    Route::get('/accounting/invoices/customer', [AccountingController::class, 'customerInvoices'])->name('accounting.invoices.customer');
    Route::get('/accounting/invoices/supplier', [AccountingController::class, 'supplierInvoices'])->name('accounting.invoices.supplier');
    Route::get('/accounting/credit-notes', [AccountingController::class, 'creditNotes'])->name('accounting.credit-notes');
    Route::get('/accounting/ar', [AccountingController::class, 'receivables'])->name('accounting.ar');
    Route::get('/accounting/ap', [AccountingController::class, 'payables'])->name('accounting.ap');
    Route::get('/accounting/customer-balances', [AccountingController::class, 'customerBalances'])->name('accounting.customer-balances');
    Route::get('/accounting/supplier-balances', [AccountingController::class, 'supplierBalances'])->name('accounting.supplier-balances');
    Route::get('/accounting/chart-of-accounts', [AccountingController::class, 'chartOfAccounts'])->name('accounting.chart-of-accounts');
    Route::get('/accounting/journals', [AccountingController::class, 'journals'])->name('accounting.journals');
    Route::get('/accounting/trial-balance', [AccountingController::class, 'trialBalance'])->name('accounting.trial-balance');
    Route::get('/accounting/statements', [AccountingController::class, 'statements'])->name('accounting.statements');
    Route::get('/accounting/bank-accounts', [AccountingController::class, 'bankAccounts'])->name('accounting.bank-accounts');
    Route::get('/accounting/bank-transactions', [AccountingController::class, 'bankTransactions'])->name('accounting.bank-transactions');
    Route::get('/accounting/bank-reconciliation', [AccountingController::class, 'bankReconciliation'])->name('accounting.bank-reconciliation');
    Route::get('/accounting/cash-reconciliation', [AccountingController::class, 'cashReconciliation'])->name('accounting.cash-reconciliation');
    Route::get('/accounting/reports/pnl', [AccountingController::class, 'reportPnl'])->name('accounting.reports.pnl');
    Route::get('/accounting/reports/balance-sheet', [AccountingController::class, 'reportBalanceSheet'])->name('accounting.reports.balance-sheet');
    Route::get('/accounting/reports/cash-flow', [AccountingController::class, 'reportCashFlow'])->name('accounting.reports.cash-flow');
    Route::get('/accounting/reports/revenue', [AccountingController::class, 'reportRevenue'])->name('accounting.reports.revenue');
    Route::get('/accounting/reports/expenses', [AccountingController::class, 'reportExpenses'])->name('accounting.reports.expenses');
    Route::get('/accounting/reports/tax', [AccountingController::class, 'reportTax'])->name('accounting.reports.tax');
    Route::get('/accounting/approvals/expenses', [AccountingController::class, 'approvalsExpenses'])->name('accounting.approvals.expenses');
    Route::get('/accounting/approvals/payments', [AccountingController::class, 'approvalsPayments'])->name('accounting.approvals.payments');
    Route::get('/accounting/approvals/journals', [AccountingController::class, 'approvalsJournals'])->name('accounting.approvals.journals');

    // 8. HR & Staff Management
    Route::get('/hr', [HrController::class, 'index'])->name('hr.index');
    Route::post('/hr/employees', [HrController::class, 'storeEmployee'])->name('hr.employees.store');
    Route::put('/hr/employees/{id}', [HrController::class, 'updateEmployee'])->name('hr.employees.update');
    Route::delete('/hr/employees/{id}', [HrController::class, 'destroyEmployee'])->name('hr.employees.destroy');
    Route::post('/hr/shifts', [HrController::class, 'assignShift'])->name('hr.shifts.store');
    Route::post('/hr/schedules', [HrController::class, 'assignShift'])->name('hr.schedules.store');
    Route::delete('/hr/shifts/{id}', [HrController::class, 'destroyShift'])->name('hr.shifts.destroy');
    Route::post('/hr/attendance', [HrController::class, 'recordAttendance'])->name('hr.attendance.store');
    Route::post('/hr/leaves', [HrController::class, 'storeLeave'])->name('hr.leaves.store');
    Route::put('/hr/leaves/{id}/status', [HrController::class, 'updateLeaveStatus'])->name('hr.leaves.update_status');
    Route::post('/hr/payrolls/generate', [HrController::class, 'generatePayroll'])->name('hr.payrolls.generate');
    Route::put('/hr/payrolls/{id}/status', [HrController::class, 'updatePayrollStatus'])->name('hr.payrolls.update_status');
    Route::post('/hr/disciplinary', [HrController::class, 'storeDisciplinary'])->name('hr.disciplinary.store');

    // 9. Central Store & Warehouse Inventory Management (Manager Portal & Requisition)
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory/items', [InventoryController::class, 'storeItem'])->name('inventory.items.store');
    Route::post('/inventory/receive', [InventoryController::class, 'receiveStock'])->name('inventory.receive');
    Route::post('/inventory/issue', [InventoryController::class, 'issueStock'])->name('inventory.issue');
    Route::post('/inventory/adjust', [InventoryController::class, 'adjustStock'])->name('inventory.adjust');

    // 10. Manager Executive Reports & Analytics
    Route::get('/reports', [ReportsController::class, 'index'])->name('reports.index');

    // 10a. Manager Automated Notifications (SMS, WhatsApp, Email & Scheduled Morning Reports)
    Route::get('/manager-notifications', [ManagerNotificationController::class, 'index'])->name('manager.notifications.index');
    Route::post('/manager-notifications/settings', [ManagerNotificationController::class, 'updateSettings'])->name('manager.notifications.settings.update');
    Route::post('/manager-notifications/send-test-report', [ManagerNotificationController::class, 'sendTestReport'])->name('manager.notifications.test-report');
    Route::post('/manager-notifications/send-test-reservation', [ManagerNotificationController::class, 'sendTestReservationAlert'])->name('manager.notifications.test-reservation');

    // 10. WhatsApp Guest Messaging & API Settings
    Route::get('/whatsapp', [WhatsAppController::class, 'index'])->name('whatsapp.index');
    Route::post('/whatsapp/settings', [WhatsAppController::class, 'updateSettings'])->name('whatsapp.settings.update');
    Route::post('/whatsapp/send', [WhatsAppController::class, 'sendManualMessage'])->name('whatsapp.send');

    // 10b. In-App System Notifications Hub & PWA Push API
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/notifications/unread-latest', [NotificationController::class, 'unreadLatest'])->name('notifications.unread-latest');
    Route::get('/notifications/{notification}/go', [NotificationController::class, 'go'])->name('notifications.go');
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
    Route::post('/notifications/clear-all', [NotificationController::class, 'clearAll'])->name('notifications.clear-all');
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    // 11. SaaS Admin & Centralized Ecosystem
    Route::get('/saas-admin', [SaasAdminController::class, 'index'])->name('saas-admin.index');
    Route::post('/saas-admin/tenants', [SaasAdminController::class, 'storeTenant'])->name('saas-admin.tenants.store');
    Route::put('/saas-admin/tenants/{tenant}', [SaasAdminController::class, 'updateTenantDetails'])->name('saas-admin.tenants.update');
    Route::post('/saas-admin/tenants/{tenant}/toggle', [SaasAdminController::class, 'toggleTenantStatus'])->name('saas-admin.tenants.toggle');
    Route::post('/saas-admin/tenants/{tenant}/impersonate', [SaasAdminController::class, 'impersonateTenant'])->name('saas-admin.tenants.impersonate');
    Route::post('/saas-admin/impersonate/leave', [SaasAdminController::class, 'leaveImpersonation'])->name('saas-admin.impersonate.leave');
    
    // SaaS Billing, Quotations, Invoices, Payments, Receipts
    Route::post('/saas-admin/quotations', [SaasAdminController::class, 'storeQuotation'])->name('saas-admin.quotations.store');
    Route::post('/saas-admin/quotations/{quotation}/convert', [SaasAdminController::class, 'convertQuotationToInvoice'])->name('saas-admin.quotations.convert');
    Route::post('/saas-admin/invoices', [SaasAdminController::class, 'storeInvoice'])->name('saas-admin.invoices.store');
    Route::post('/saas-admin/payments', [SaasAdminController::class, 'recordPayment'])->name('saas-admin.payments.store');
    Route::post('/saas-admin/payments/{payment}/verify', [SaasAdminController::class, 'verifyPayment'])->name('saas-admin.payments.verify');

    // SaaS Contracts
    Route::post('/saas-admin/contracts', [SaasAdminController::class, 'storeContract'])->name('saas-admin.contracts.store');
    Route::post('/saas-admin/contracts/{contract}/sign', [SaasAdminController::class, 'signContract'])->name('saas-admin.contracts.sign');

    // Financial SMS & Messaging
    Route::post('/saas-admin/sms/issue', [SaasAdminController::class, 'issueSms'])->name('saas-admin.sms.issue');
    Route::post('/saas-admin/sms/provider', [SaasAdminController::class, 'updateSmsProvider'])->name('saas-admin.sms.provider.update');
    Route::post('/saas-admin/sms/test', [SaasAdminController::class, 'testSmsProvider'])->name('saas-admin.sms.test');

    // WhatsApp
    Route::post('/saas-admin/whatsapp/settings', [SaasAdminController::class, 'updateWhatsAppSettings'])->name('saas-admin.whatsapp.settings.update');
    Route::post('/saas-admin/whatsapp/test', [SaasAdminController::class, 'testWhatsAppMessage'])->name('saas-admin.whatsapp.test');

    // Notices & System Health
    Route::post('/saas-admin/notices/broadcast', [SaasAdminController::class, 'sendNotice'])->name('saas-admin.notices.broadcast');
    Route::post('/saas-admin/system/clear-cache', [SaasAdminController::class, 'clearSystemCache'])->name('saas-admin.system.clear-cache');

    // Users & Roles Management
    Route::post('/saas-admin/users', [SaasAdminController::class, 'storeGlobalUser'])->name('saas-admin.users.store');
    Route::post('/saas-admin/users/{user}/toggle', [SaasAdminController::class, 'toggleUserStatus'])->name('saas-admin.users.toggle');

    // Website CMS & Marketing & Support
    Route::post('/saas-admin/cms/update', [SaasAdminController::class, 'updateCmsSettings'])->name('saas-admin.cms.update');
    Route::post('/saas-admin/marketing/promos', [SaasAdminController::class, 'storePromoCode'])->name('saas-admin.marketing.promos.store');
    Route::post('/saas-admin/support/resolve', [SaasAdminController::class, 'resolveSupportTicket'])->name('saas-admin.support.resolve');

    // 12. Night Audit
    Route::get('/night-audit', [NightAuditController::class, 'index'])->name('night-audit.index');
    Route::post('/night-audit/run', [NightAuditController::class, 'runAudit'])->name('night-audit.run');

    // 13. SaaS Branch / Property Management & Switcher
    Route::get('/branches', [BranchController::class, 'index'])->name('branches.index');
    Route::post('/branches', [BranchController::class, 'store'])->name('branches.store');
    Route::put('/branches/{branch}', [BranchController::class, 'update'])->name('branches.update');
    Route::patch('/branches/{branch}/toggle', [BranchController::class, 'toggle'])->name('branches.toggle');
    Route::post('/branches/{branch}/switch', [BranchController::class, 'switchBranch'])->name('branches.switch');

    // 14. Manager Hotel Identity, Receipt & System Branding Settings
    Route::get('/settings/tenant', [TenantSettingsController::class, 'edit'])->name('tenant.settings');
    Route::post('/settings/tenant', [TenantSettingsController::class, 'update'])->name('tenant.settings.update');

    // 15. Universal Spreadsheet CSV Data Entry (Importer & Exporter)
    Route::get('/data-entry', [SpreadsheetDataEntryController::class, 'index'])->name('data-entry.index');
    Route::get('/data-entry/template/{type}', [SpreadsheetDataEntryController::class, 'downloadTemplate'])->name('data-entry.template');
    Route::get('/data-entry/export/{type}', [SpreadsheetDataEntryController::class, 'exportCsv'])->name('data-entry.export');
    Route::post('/data-entry/import/{type}', [SpreadsheetDataEntryController::class, 'importCsv'])->name('data-entry.import');

    // Profile Settings
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Role Selection (for multi-role users)
    Route::get('/select-role', [RoleSelectionController::class, 'show'])->name('role.select');
    Route::post('/select-role', [RoleSelectionController::class, 'select'])->name('role.select.post');
});

require __DIR__.'/auth.php';
