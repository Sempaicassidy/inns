<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TenantDataPurgeService
{
    /**
     * Definition of all clearable modules for a specific tenant.
     */
    public const MODULES = [
        'reservations' => [
            'key' => 'reservations',
            'name' => 'Front Desk & Reservations',
            'swahili_name' => 'Mapokezi & Uhifadhi wa Vyumba',
            'category' => 'Front Office',
            'icon' => 'Calendar',
            'description' => 'Uhifadhi wote (reservations), wageni waliopo vyumbani (stays), orodha ya vyumba vilivyopangwa (reservation rooms), ripoti za kila siku za mapokezi, mashift ya cashier, na night audits.',
            'target_records_label' => 'Reservations, Stays, Shift Logs, Night Audits',
        ],
        'folios' => [
            'key' => 'folios',
            'name' => 'Billing, Folios & Payments',
            'swahili_name' => 'Malipo, Folios & Ankara za Wageni',
            'category' => 'Billing',
            'icon' => 'Receipt',
            'description' => 'Miamala ya ankara za wageni (guest folios), bili za vyumba na huduma (folio lines), stakabadhi za malipo (payments), na fiscal invoices zote.',
            'target_records_label' => 'Folios, Invoices, Payments, Fiscal Records',
        ],
        'restaurant_pos' => [
            'key' => 'restaurant_pos',
            'name' => 'Restaurant & Bar POS Orders',
            'swahili_name' => 'Mauzo ya Mgahawa & Baa (POS)',
            'category' => 'Food & Beverage',
            'icon' => 'UtensilsCrossed',
            'description' => 'Maagizo yote ya vyakula na vinywaji (restaurant pos orders), tiketi za jikoni (KOT), na vipengele vyote vilivyouzwa mgahawani.',
            'target_records_label' => 'Restaurant Orders & Order Items',
        ],
        'grocery_pos' => [
            'key' => 'grocery_pos',
            'name' => 'Grocery & Minimart POS Orders',
            'swahili_name' => 'Mauzo ya Grocery & Duka (POS)',
            'category' => 'Retail',
            'icon' => 'ShoppingCart',
            'description' => 'Maagizo na bili zote za kaunta ya supermarket/grocery (grocery pos orders) na orodha ya bidhaa zilizouzwa kaunta.',
            'target_records_label' => 'Grocery Orders & Counter Items',
        ],
        'inventory' => [
            'key' => 'inventory',
            'name' => 'Central Store & Stock Movements',
            'swahili_name' => 'Stoo Kuu & Miamala ya Bidhaa',
            'category' => 'Inventory',
            'icon' => 'Boxes',
            'description' => 'Historia yote ya uingizaji na utoaji wa stoo (stock movements/requisitions). Idadi ya bidhaa zilizopo stoo inarudishwa kuwa 0.',
            'target_records_label' => 'Stock Movements & Reset Item Stock to 0',
        ],
        'accounting' => [
            'key' => 'accounting',
            'name' => 'Accounting, Expenses & Owner Drawings',
            'swahili_name' => 'Uhasibu, Matumizi & Madeni',
            'category' => 'Finance',
            'icon' => 'CircleDollarSign',
            'description' => 'Leja ya uhasibu (financial transactions), kumbukumbu za matumizi (expenses), fedha za mkurugenzi (owner drawings), requisitions na maagizo ya mwekezaji.',
            'target_records_label' => 'Expenses, Journal Entries, Owner Drawings',
        ],
        'hr_payroll' => [
            'key' => 'hr_payroll',
            'name' => 'HR, Payroll & Staff Attendance',
            'swahili_name' => 'Mishahara, Mahudhurio & Likizo',
            'category' => 'Human Resources',
            'icon' => 'Users',
            'description' => 'Malipo ya mishahara (payrolls), taarifa za mahudhurio (attendances), maombi ya likizo (leaves), kumbukumbu za kinidhamu na ratiba za wafanyakazi.',
            'target_records_label' => 'Payroll Slips, Leaves, Attendances, Schedules',
        ],
        'housekeeping' => [
            'key' => 'housekeeping',
            'name' => 'Housekeeping Tasks & Cleaning Logs',
            'swahili_name' => 'Usafi wa Vyumba (Housekeeping)',
            'category' => 'Housekeeping',
            'icon' => 'Sparkles',
            'description' => 'Majukumu yote ya usafi wa vyumba (housekeeping tasks). Hali ya usafi wa vyumba vyote inarudishwa kuwa safi (Clean).',
            'target_records_label' => 'Housekeeping Tasks & Reset Rooms to Clean',
        ],
        'guests' => [
            'key' => 'guests',
            'name' => 'Guests & Corporate Companies CRM',
            'swahili_name' => 'Wateja (Wageni) & Makampuni',
            'category' => 'CRM',
            'icon' => 'UserCheck',
            'description' => 'Wasifu wote wa wageni (guests), vitambulisho na nyaraka (guest documents), na orodha ya makampuni yaliyosajiliwa.',
            'target_records_label' => 'Guests, Guest Documents, Companies',
        ],
        'occurrence_book' => [
            'key' => 'occurrence_book',
            'name' => 'Security & Occurrence Book (OB)',
            'swahili_name' => 'Daftari la Matukio & Usalama (OB)',
            'category' => 'Security',
            'icon' => 'ShieldAlert',
            'description' => 'Matukio yote ya kiusalama na doria yaliyoandikwa kwenye daftari la matukio (occurrence book entries & amendments).',
            'target_records_label' => 'Occurrence Book Entries & Amendments',
        ],
        'communications' => [
            'key' => 'communications',
            'name' => 'SMS, WhatsApp & Notification Logs',
            'swahili_name' => 'Kumbukumbu za SMS, WhatsApp & Taarifa',
            'category' => 'Communications',
            'icon' => 'MessageSquare',
            'description' => 'Historia ya SMS zilizotumwa, ripoti za uwasilishaji (delivery reports), logs za WhatsApp, taarifa za ndani (system notifications), na offline sync queue.',
            'target_records_label' => 'SMS Logs, WhatsApp Logs, System Notifications',
        ],
        'rooms_catalog' => [
            'key' => 'rooms_catalog',
            'name' => 'Rooms & Rate Plans Setup',
            'swahili_name' => 'Vyumba & Bei za Vyumba (Setup)',
            'category' => 'Setup',
            'icon' => 'BedDouble',
            'description' => 'Orodha ya vyumba vyote, aina za vyumba (room types), mipango ya bei (rate plans) na bei zenyewe. (Tumia pale tu unapotaka kuseti upya vyumba toka mwanzo).',
            'target_records_label' => 'Rooms, Room Types, Rate Plans, Rates',
        ],
    ];

    /**
     * Get module definitions with their metadata.
     */
    public function getModules(): array
    {
        return array_values(self::MODULES);
    }

    /**
     * Get live record counts for each module for a specific tenant.
     */
    public function getModuleCounts(Tenant $tenant): array
    {
        $tenantId = $tenant->id;

        // 1. Reservations & Front Office
        $reservationsCount = DB::table('reservations')->where('tenant_id', $tenantId)->count();
        $staysCount = DB::table('stays')->where('tenant_id', $tenantId)->count();
        $shiftsCount = DB::table('cashier_shifts')->where('tenant_id', $tenantId)->count();
        $foReportsCount = DB::table('front_office_reports')->where('tenant_id', $tenantId)->count();
        $nightAuditCount = DB::table('night_audits')->where('tenant_id', $tenantId)->count();
        $reservationsTotal = $reservationsCount + $staysCount + $shiftsCount + $foReportsCount + $nightAuditCount;

        // 2. Folios, Invoices & Payments
        $foliosCount = DB::table('folios')->where('tenant_id', $tenantId)->count();
        $paymentsCount = DB::table('payments')->where('tenant_id', $tenantId)->count();
        $fiscalInvoicesCount = DB::table('fiscal_invoices')->where('tenant_id', $tenantId)->count();
        $foliosTotal = $foliosCount + $paymentsCount + $fiscalInvoicesCount;

        // 3. Restaurant POS
        $restOrdersCount = DB::table('pos_orders')
            ->where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->where('outlet_type', 'restaurant')->orWhereNull('outlet_type');
            })->count();

        // 4. Grocery POS
        $grocOrdersCount = DB::table('pos_orders')
            ->where('tenant_id', $tenantId)
            ->where('outlet_type', 'grocery')
            ->count();

        // 5. Store & Inventory
        $stockMovementsCount = DB::table('stock_movements')->where('tenant_id', $tenantId)->count();

        // 6. Accounting & Expenses
        $expensesCount = DB::table('expenses')->where('tenant_id', $tenantId)->count();
        $transactionsCount = DB::table('financial_transactions')->where('tenant_id', $tenantId)->count();
        $ownerDrawingsCount = DB::table('owner_drawings')->where('tenant_id', $tenantId)->count();
        $ownerReqCount = DB::table('owner_requisitions')->where('tenant_id', $tenantId)->count();
        $ownerDirCount = DB::table('owner_directives')->where('tenant_id', $tenantId)->count();
        $accountingTotal = $expensesCount + $transactionsCount + $ownerDrawingsCount + $ownerReqCount + $ownerDirCount;

        // 7. HR & Payroll
        $payrollCount = DB::table('staff_payrolls')->where('tenant_id', $tenantId)->count();
        $leavesCount = DB::table('staff_leaves')->where('tenant_id', $tenantId)->count();
        $attendanceCount = DB::table('staff_attendances')->where('tenant_id', $tenantId)->count();
        $disciplinaryCount = DB::table('staff_disciplinary_records')->where('tenant_id', $tenantId)->count();
        $schedulesCount = DB::table('staff_schedules')->where('tenant_id', $tenantId)->count();
        $hrTotal = $payrollCount + $leavesCount + $attendanceCount + $disciplinaryCount + $schedulesCount;

        // 8. Housekeeping
        $housekeepingCount = DB::table('hk_tasks')->where('tenant_id', $tenantId)->count();

        // 9. Guests & CRM
        $guestsCount = DB::table('guests')->where('tenant_id', $tenantId)->count();
        $companiesCount = DB::table('companies')->where('tenant_id', $tenantId)->count();
        $crmTotal = $guestsCount + $companiesCount;

        // 10. Occurrence Book
        $obEntriesCount = DB::table('occurrence_book_entries')->where('tenant_id', $tenantId)->count();
        $obAmendmentsCount = DB::table('occurrence_book_amendments')->where('tenant_id', $tenantId)->count();
        $obTotal = $obEntriesCount + $obAmendmentsCount;

        // 11. Communications & Logs
        $notificationsCount = DB::table('system_notifications')->where('tenant_id', $tenantId)->count();
        $smsCount = DB::table('sms_messages')->where('tenant_id', $tenantId)->count();
        $whatsAppCount = DB::table('whatsapp_logs')->where('tenant_id', $tenantId)->count();
        $offlineCount = DB::table('offline_operations')->where('tenant_id', $tenantId)->count();
        $commsTotal = $notificationsCount + $smsCount + $whatsAppCount + $offlineCount;

        // 12. Rooms & Rates
        $roomsCount = DB::table('rooms')->where('tenant_id', $tenantId)->count();
        $roomTypesCount = DB::table('room_types')->where('tenant_id', $tenantId)->count();
        $ratePlansCount = DB::table('rate_plans')->where('tenant_id', $tenantId)->count();
        $ratesTotal = $roomsCount + $roomTypesCount + $ratePlansCount;

        $counts = [
            'reservations' => [
                'count' => $reservationsTotal,
                'details' => "{$reservationsCount} bookings, {$staysCount} stays, {$shiftsCount} shifts",
            ],
            'folios' => [
                'count' => $foliosTotal,
                'details' => "{$foliosCount} folios, {$paymentsCount} payments, {$fiscalInvoicesCount} fiscal invoices",
            ],
            'restaurant_pos' => [
                'count' => $restOrdersCount,
                'details' => "{$restOrdersCount} restaurant & bar orders",
            ],
            'grocery_pos' => [
                'count' => $grocOrdersCount,
                'details' => "{$grocOrdersCount} grocery counter orders",
            ],
            'inventory' => [
                'count' => $stockMovementsCount,
                'details' => "{$stockMovementsCount} stock ledger transactions",
            ],
            'accounting' => [
                'count' => $accountingTotal,
                'details' => "{$expensesCount} expenses, {$transactionsCount} journal entries",
            ],
            'hr_payroll' => [
                'count' => $hrTotal,
                'details' => "{$payrollCount} payrolls, {$attendanceCount} attendances, {$leavesCount} leaves",
            ],
            'housekeeping' => [
                'count' => $housekeepingCount,
                'details' => "{$housekeepingCount} cleaning & inspection tasks",
            ],
            'guests' => [
                'count' => $crmTotal,
                'details' => "{$guestsCount} guests, {$companiesCount} corporate companies",
            ],
            'occurrence_book' => [
                'count' => $obTotal,
                'details' => "{$obEntriesCount} incident entries, {$obAmendmentsCount} amendments",
            ],
            'communications' => [
                'count' => $commsTotal,
                'details' => "{$smsCount} SMS logs, {$whatsAppCount} WhatsApp logs, {$notificationsCount} alerts",
            ],
            'rooms_catalog' => [
                'count' => $ratesTotal,
                'details' => "{$roomsCount} rooms, {$roomTypesCount} room categories, {$ratePlansCount} rate plans",
            ],
        ];

        $totalOperationalRecords = 0;
        foreach ($counts as $k => $v) {
            if ($k !== 'rooms_catalog') {
                $totalOperationalRecords += $v['count'];
            }
        }

        return [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'subdomain' => $tenant->subdomain,
                'plan' => $tenant->plan,
            ],
            'modules' => $counts,
            'total_operational_records' => $totalOperationalRecords,
        ];
    }

    /**
     * Purge selected modules for a specific tenant safely inside a transaction.
     */
    public function purgeModules(Tenant $tenant, array $moduleKeys, ?User $actor = null): array
    {
        $tenantId = $tenant->id;
        $purgedSummary = [];
        $totalRecordsDeleted = 0;

        // If 'all' or 'all_data' is requested, select all standard operational modules
        if (in_array('all', $moduleKeys) || in_array('all_data', $moduleKeys)) {
            $moduleKeys = array_keys(self::MODULES);
        }

        DB::beginTransaction();

        try {
            // Temporarily disable foreign key constraints to prevent ordering issues during cascade
            if (DB::getDriverName() === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } elseif (DB::getDriverName() === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = OFF');
            }

            // 1. Reservations & Front Office
            if (in_array('reservations', $moduleKeys)) {
                $count = 0;
                $count += DB::table('stays')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('reservation_rooms')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('reservations')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('front_office_reports')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('cashier_shifts')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('night_audits')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('business_dates')->where('tenant_id', $tenantId)->delete();

                // Reset room occupancy and reservation links
                DB::table('rooms')->where('tenant_id', $tenantId)->update([
                    'status_occupancy' => 'vacant',
                ]);

                $purgedSummary['reservations'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 2. Billing, Folios & Payments
            if (in_array('folios', $moduleKeys)) {
                $count = 0;
                $count += DB::table('payments')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('folio_lines')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('fiscal_invoices')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('folios')->where('tenant_id', $tenantId)->delete();

                $purgedSummary['folios'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 3. Restaurant POS
            if (in_array('restaurant_pos', $moduleKeys)) {
                $orderIds = DB::table('pos_orders')
                    ->where('tenant_id', $tenantId)
                    ->where(function ($q) {
                        $q->where('outlet_type', 'restaurant')->orWhereNull('outlet_type');
                    })
                    ->pluck('id');

                $itemsCount = 0;
                if ($orderIds->isNotEmpty()) {
                    $itemsCount = DB::table('pos_order_items')->whereIn('pos_order_id', $orderIds)->delete();
                }

                $ordersCount = DB::table('pos_orders')
                    ->where('tenant_id', $tenantId)
                    ->where(function ($q) {
                        $q->where('outlet_type', 'restaurant')->orWhereNull('outlet_type');
                    })
                    ->delete();

                $purgedSummary['restaurant_pos'] = $ordersCount + $itemsCount;
                $totalRecordsDeleted += ($ordersCount + $itemsCount);
            }

            // 4. Grocery POS
            if (in_array('grocery_pos', $moduleKeys)) {
                $orderIds = DB::table('pos_orders')
                    ->where('tenant_id', $tenantId)
                    ->where('outlet_type', 'grocery')
                    ->pluck('id');

                $itemsCount = 0;
                if ($orderIds->isNotEmpty()) {
                    $itemsCount = DB::table('pos_order_items')->whereIn('pos_order_id', $orderIds)->delete();
                }

                $ordersCount = DB::table('pos_orders')
                    ->where('tenant_id', $tenantId)
                    ->where('outlet_type', 'grocery')
                    ->delete();

                $purgedSummary['grocery_pos'] = $ordersCount + $itemsCount;
                $totalRecordsDeleted += ($ordersCount + $itemsCount);
            }

            // 5. Store & Inventory
            if (in_array('inventory', $moduleKeys)) {
                $count = DB::table('stock_movements')->where('tenant_id', $tenantId)->delete();

                // Reset stock quantities on inventory items and pos items to 0
                DB::table('inventory_items')->where('tenant_id', $tenantId)->update([
                    'current_quantity' => 0,
                ]);

                DB::table('pos_items')->where('tenant_id', $tenantId)->update([
                    'stock_quantity' => 0,
                ]);

                $purgedSummary['inventory'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 6. Accounting & Expenses
            if (in_array('accounting', $moduleKeys)) {
                $count = 0;
                $count += DB::table('financial_transactions')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('expenses')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('owner_drawings')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('owner_requisitions')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('owner_directives')->where('tenant_id', $tenantId)->delete();

                $purgedSummary['accounting'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 7. HR & Payroll
            if (in_array('hr_payroll', $moduleKeys)) {
                $count = 0;
                $count += DB::table('staff_payrolls')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('staff_leaves')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('staff_attendances')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('staff_disciplinary_records')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('staff_schedules')->where('tenant_id', $tenantId)->delete();

                $purgedSummary['hr_payroll'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 8. Housekeeping
            if (in_array('housekeeping', $moduleKeys)) {
                $count = DB::table('hk_tasks')->where('tenant_id', $tenantId)->delete();

                // Reset room housekeeping status to clean
                DB::table('rooms')->where('tenant_id', $tenantId)->update([
                    'status_hk' => 'clean',
                ]);

                $purgedSummary['housekeeping'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 9. Guests & CRM
            if (in_array('guests', $moduleKeys)) {
                $count = 0;
                $count += DB::table('guest_documents')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('guests')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('companies')->where('tenant_id', $tenantId)->delete();

                $purgedSummary['guests'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 10. Occurrence Book
            if (in_array('occurrence_book', $moduleKeys)) {
                $count = 0;
                $count += DB::table('occurrence_book_amendments')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('occurrence_book_entries')->where('tenant_id', $tenantId)->delete();

                $purgedSummary['occurrence_book'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 11. Communications & Logs
            if (in_array('communications', $moduleKeys)) {
                $count = 0;
                $count += DB::table('system_notifications')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('sms_messages')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('sms_delivery_reports')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('whatsapp_logs')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('offline_operations')->where('tenant_id', $tenantId)->delete();

                $purgedSummary['communications'] = $count;
                $totalRecordsDeleted += $count;
            }

            // 12. Rooms & Rate Plans
            if (in_array('rooms_catalog', $moduleKeys)) {
                $count = 0;
                $count += DB::table('rates')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('rate_plans')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('rooms')->where('tenant_id', $tenantId)->delete();
                $count += DB::table('room_types')->where('tenant_id', $tenantId)->delete();

                $purgedSummary['rooms_catalog'] = $count;
                $totalRecordsDeleted += $count;
            }

            // Re-enable foreign key constraints
            if (DB::getDriverName() === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif (DB::getDriverName() === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON');
            }

            DB::commit();

            Log::info("Tenant data purged successfully for tenant [{$tenant->name}] ({$tenant->id})", [
                'actor_id' => $actor?->id,
                'actor_email' => $actor?->email,
                'modules' => $moduleKeys,
                'summary' => $purgedSummary,
                'total_deleted' => $totalRecordsDeleted,
            ]);

            return [
                'success' => true,
                'tenant_name' => $tenant->name,
                'total_deleted' => $totalRecordsDeleted,
                'summary' => $purgedSummary,
            ];
        } catch (\Throwable $e) {
            if (DB::getDriverName() === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif (DB::getDriverName() === 'sqlite') {
                DB::statement('PRAGMA foreign_keys = ON');
            }
            DB::rollBack();

            Log::error("Failed to purge tenant data for [{$tenant->name}]: ".$e->getMessage(), [
                'tenant_id' => $tenant->id,
                'error' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }
}
