<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\Expense;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Guest;
use App\Models\InventoryItem;
use App\Models\Payment;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\SaasContract;
use App\Models\SaasInvoice;
use App\Models\SaasPayment;
use App\Models\SaasSubscription;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Models\TenantAuditEvent;
use App\Models\TenantInspectionSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantInspectionService
{
    /**
     * SENSITIVE KEYS that must always be masked in inspection views.
     */
    protected const SENSITIVE_KEY_PATTERNS = [
        'password',
        'secret',
        'token',
        'api_key',
        'apikey',
        'private_key',
        'auth_key',
        'encryption_key',
        'app_key',
        'access_token',
        'refresh_token',
        'webhook_secret',
        'client_secret',
        'consumer_secret',
    ];

    /**
     * Get searchable, filtered, and paginated Global Tenant Directory.
     */
    public function getGlobalDirectory(Request $request): LengthAwarePaginator
    {
        $search = $request->input('search');
        $status = $request->input('status'); // all, active, inactive, expired
        $plan = $request->input('plan');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        $perPage = (int) $request->input('per_page', 15);

        $query = Tenant::query();

        // Search filter
        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('subdomain', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        // Status filter
        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'expired') {
            $query->whereNotNull('license_expiry')
                ->where('license_expiry', '<', now());
        }

        // Plan filter
        if (! empty($plan) && $plan !== 'all') {
            $query->where('plan', $plan);
        }

        // Sorting
        $allowedSorts = ['name', 'created_at', 'subscription_price', 'license_expiry', 'plan'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $paginated = $query->paginate($perPage)->withQueryString();

        // Enrich items with stats
        $enrichedItems = $paginated->getCollection()->map(function (Tenant $tenant) {
            $tenantId = $tenant->id;

            $propertiesCount = Property::where('tenant_id', $tenantId)->count();
            $staffCount = User::where('tenant_id', $tenantId)->count();
            $activeStaffCount = User::where('tenant_id', $tenantId)->where('is_active', true)->count();
            $inactiveStaffCount = $staffCount - $activeStaffCount;

            // Enabled features
            $features = $tenant->features ?? [];
            $enabledModulesCount = count(array_filter($features, fn ($v) => (bool) $v));

            // Last activity timestamp
            $lastAudit = TenantAuditEvent::where('tenant_id', $tenantId)->latest('created_at')->value('created_at');
            $lastBooking = Reservation::where('tenant_id', $tenantId)->latest('created_at')->value('created_at');
            $lastOrder = PosOrder::where('tenant_id', $tenantId)->latest('created_at')->value('created_at');
            $lastActivityAt = collect([$lastAudit, $lastBooking, $lastOrder, $tenant->updated_at])
                ->filter()
                ->max();

            // Active support session
            $activeSession = TenantInspectionSession::where('tenant_id', $tenantId)
                ->whereNull('ended_at')
                ->latest('started_at')
                ->first();

            // 30d Recognized revenue (minor units)
            $posRevenue = (float) PosOrder::where('tenant_id', $tenantId)
                ->where('created_at', '>=', now()->subDays(30))
                ->whereNotIn('status', ['cancelled', 'voided'])
                ->sum('total_minor');

            $lodgingRevenue = (float) FolioLine::where('tenant_id', $tenantId)
                ->where('created_at', '>=', now()->subDays(30))
                ->whereIn('line_type', ['room', 'room_charge'])
                ->whereNull('reversed_line_id')
                ->sum('amount_minor');

            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'subdomain' => $tenant->subdomain,
                'plan' => $tenant->plan,
                'is_active' => (bool) $tenant->is_active,
                'is_expired' => $tenant->isExpired(),
                'license_expiry' => $tenant->license_expiry?->format('Y-m-d'),
                'subscription_price' => (float) $tenant->subscription_price,
                'created_at' => $tenant->created_at?->format('Y-m-d H:i:s'),
                'properties_count' => $propertiesCount,
                'staff_count' => $staffCount,
                'active_staff_count' => $activeStaffCount,
                'inactive_staff_count' => $inactiveStaffCount,
                'enabled_modules_count' => $enabledModulesCount,
                'last_activity_at' => $lastActivityAt ? Carbon::parse($lastActivityAt)->toIso8601String() : null,
                'has_active_inspection_session' => (bool) $activeSession,
                'active_session_reason' => $activeSession?->reason,
                'revenue_30d' => round(($posRevenue + $lodgingRevenue) / 100, 2),
            ];
        });

        $paginated->setCollection($enrichedItems);

        return $paginated;
    }

    /**
     * Cross-tenant platform comparative metrics.
     */
    public function getCrossTenantMetrics(): array
    {
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('is_active', true)->count();
        $inactiveTenants = Tenant::where('is_active', false)->count();
        $expiredTenants = Tenant::whereNotNull('license_expiry')
            ->where('license_expiry', '<', now())
            ->count();

        $totalBranches = Property::count();
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();

        // Plan distribution
        $planDistribution = Tenant::select('plan', DB::raw('count(*) as count'))
            ->groupBy('plan')
            ->pluck('count', 'plan')
            ->toArray();

        // 30d Platform revenue
        $posRevenue = (float) PosOrder::where('created_at', '>=', now()->subDays(30))
            ->whereNotIn('status', ['cancelled', 'voided'])
            ->sum('total_minor');

        $lodgingRevenue = (float) FolioLine::where('created_at', '>=', now()->subDays(30))
            ->whereIn('line_type', ['room', 'room_charge'])
            ->whereNull('reversed_line_id')
            ->sum('amount_minor');

        $totalRevenue30d = round(($posRevenue + $lodgingRevenue) / 100, 2);

        // Security / Failure audit events count in past 7 days
        $securityAlertsCount = TenantAuditEvent::where('created_at', '>=', now()->subDays(7))
            ->where(function ($q) {
                $q->where('status', 'failure')
                    ->orWhere('action_type', 'failed_login')
                    ->orWhere('action_type', 'permission_denied');
            })->count();

        // Active support inspection sessions
        $activeSessionsCount = TenantInspectionSession::whereNull('ended_at')->count();

        return [
            'total_tenants' => $totalTenants,
            'active_tenants' => $activeTenants,
            'inactive_tenants' => $inactiveTenants,
            'expired_tenants' => $expiredTenants,
            'total_branches' => $totalBranches,
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'plan_distribution' => $planDistribution,
            'total_revenue_30d' => $totalRevenue30d,
            'security_alerts_count_7d' => $securityAlertsCount,
            'active_inspection_sessions_count' => $activeSessionsCount,
        ];
    }

    /**
     * Get deep tenant inspection workspace data.
     */
    public function getTenantInspectionData(Tenant $tenant, string $section = 'overview', array $filters = []): array
    {
        $tenantId = $tenant->id;

        // Check active inspection session for current super admin
        $activeSession = TenantInspectionSession::where('tenant_id', $tenantId)
            ->whereNull('ended_at')
            ->with('superAdmin:id,name,email')
            ->latest('started_at')
            ->first();

        // Build data structure
        $data = [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'subdomain' => $tenant->subdomain,
                'plan' => $tenant->plan,
                'max_branches' => $tenant->max_branches,
                'subscription_price' => (float) $tenant->subscription_price,
                'subscription_status' => $tenant->subscription_status,
                'is_active' => (bool) $tenant->is_active,
                'is_expired' => $tenant->isExpired(),
                'license_expiry' => $tenant->license_expiry?->format('Y-m-d'),
                'created_at' => $tenant->created_at?->format('Y-m-d H:i:s'),
                'updated_at' => $tenant->updated_at?->format('Y-m-d H:i:s'),
            ],
            'active_session' => $activeSession ? [
                'id' => $activeSession->id,
                'super_admin_name' => $activeSession->superAdmin?->name ?? 'Super Admin',
                'reason' => $activeSession->reason,
                'started_at' => $activeSession->started_at->toIso8601String(),
                'ip_address' => $activeSession->ip_address,
                'is_write_mode' => (bool) $activeSession->is_write_mode,
            ] : null,
            'section' => $section,
        ];

        // Section A: Business Overview
        if ($section === 'all' || $section === 'overview') {
            $properties = Property::where('tenant_id', $tenantId)
                ->withCount('rooms')
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'code' => $p->code,
                    'property_type' => $p->property_type,
                    'timezone' => $p->timezone,
                    'currency' => $p->currency,
                    'phone' => $p->phone,
                    'email' => $p->email,
                    'is_main' => (bool) $p->is_main,
                    'is_active' => (bool) $p->is_active,
                    'rooms_count' => $p->rooms_count,
                    'monthly_target_revenue_minor' => $p->monthly_target_revenue_minor,
                ]);

            $features = $tenant->features ?? [];
            $allFeatures = Tenant::AVAILABLE_FEATURES;
            $moduleStatusList = [];
            foreach ($allFeatures as $key => $meta) {
                $isEnabled = ! empty($features[$key]);
                $moduleStatusList[] = [
                    'key' => $key,
                    'name' => $meta['name'],
                    'category' => $meta['category'],
                    'description' => $meta['description'],
                    'is_enabled' => $isEnabled,
                ];
            }

            // High-level operational counts
            $totalRooms = Room::where('tenant_id', $tenantId)->count();
            $totalBookings = Reservation::where('tenant_id', $tenantId)->count();
            $totalPosOrders = PosOrder::where('tenant_id', $tenantId)->count();
            $totalStaff = User::where('tenant_id', $tenantId)->count();

            // Recent Saas invoices and payments
            $saasInvoices = SaasInvoice::where('tenant_id', $tenantId)
                ->latest()
                ->take(5)
                ->get()
                ->map(fn ($inv) => [
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'total_amount' => (float) $inv->total_amount,
                    'status' => $inv->status,
                    'due_date' => $inv->due_date?->format('Y-m-d'),
                    'created_at' => $inv->created_at?->format('Y-m-d'),
                ]);

            $data['overview'] = [
                'branches' => $properties,
                'modules' => $moduleStatusList,
                'stats' => [
                    'branches_count' => $properties->count(),
                    'rooms_count' => $totalRooms,
                    'bookings_count' => $totalBookings,
                    'pos_orders_count' => $totalPosOrders,
                    'staff_count' => $totalStaff,
                ],
                'saas_invoices' => $saasInvoices,
            ];
        }

        // Section B: Users and Staff
        if ($section === 'all' || $section === 'users') {
            $users = User::where('tenant_id', $tenantId)
                ->with('property:id,name')
                ->latest()
                ->get()
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'username' => $u->username,
                    'role' => $u->role,
                    'roles' => $u->roles ?? [],
                    'active_role' => $u->active_role,
                    'is_active' => (bool) $u->is_active,
                    'property_id' => $u->property_id,
                    'branch_name' => $u->property?->name ?? 'All Branches',
                    'last_login_at' => $u->last_login_at ? Carbon::parse($u->last_login_at)->format('Y-m-d H:i:s') : null,
                    'created_at' => $u->created_at?->format('Y-m-d H:i:s'),
                ]);

            $rolesCount = $users->groupBy('role')->map(fn ($group) => count($group));

            $data['users'] = [
                'list' => $users,
                'roles_breakdown' => $rolesCount,
                'total_users' => $users->count(),
                'active_users' => $users->where('is_active', true)->count(),
            ];
        }

        // Section C: Bookings and Reservations
        if ($section === 'all' || $section === 'bookings') {
            $bookingsQuery = Reservation::where('tenant_id', $tenantId)
                ->with(['guest:id,first_name,last_name,phone,email', 'property:id,name', 'rooms.room:id,room_number'])
                ->latest();

            if (! empty($filters['status'])) {
                $bookingsQuery->where('status', $filters['status']);
            }
            if (! empty($filters['branch_id'])) {
                $bookingsQuery->where('property_id', $filters['branch_id']);
            }

            $bookings = $bookingsQuery->take(50)->get()->map(fn ($b) => [
                'id' => $b->id,
                'reservation_number' => $b->ref_no ?? $b->reservation_number ?? "RES-{$b->id}",
                'guest_name' => $b->guest ? ($b->guest->first_name . ' ' . $b->guest->last_name) : 'Guest',
                'guest_phone' => $b->guest?->phone ?? '—',
                'branch_name' => $b->property?->name ?? 'Main',
                'status' => $b->status,
                'check_in_date' => $b->check_in?->format('Y-m-d') ?? (string) $b->check_in,
                'check_out_date' => $b->check_out?->format('Y-m-d') ?? (string) $b->check_out,
                'total_amount' => round(($b->total_minor ?? $b->total_amount_minor ?? 0) / 100, 2),
                'paid_amount' => round(($b->deposit_minor ?? $b->paid_amount_minor ?? 0) / 100, 2),
                'balance_amount' => round((($b->total_minor ?? 0) - ($b->deposit_minor ?? 0)) / 100, 2),
                'rooms' => $b->rooms ? $b->rooms->map(fn ($r) => $r->room?->room_number ?? 'Room')->join(', ') : '—',
                'created_at' => $b->created_at?->format('Y-m-d H:i:s'),
            ]);

            $statusBreakdown = Reservation::where('tenant_id', $tenantId)
                ->select('status', DB::raw('count(*) as count'))
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            $data['bookings'] = [
                'list' => $bookings,
                'status_breakdown' => $statusBreakdown,
                'total_bookings' => Reservation::where('tenant_id', $tenantId)->count(),
            ];
        }

        // Section D: POS and Sales
        if ($section === 'all' || $section === 'pos') {
            $ordersQuery = PosOrder::where('tenant_id', $tenantId)
                ->with(['property:id,name', 'items:id,pos_order_id,item_name,quantity,unit_price_minor,total_price_minor'])
                ->latest();

            if (! empty($filters['branch_id'])) {
                $ordersQuery->where('property_id', $filters['branch_id']);
            }

            $orders = $ordersQuery->take(50)->get()->map(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number ?? "ORD-{$o->id}",
                'order_type' => $o->order_type,
                'status' => $o->status,
                'payment_method' => $o->payment_method ?? 'cash',
                'branch_name' => $o->property?->name ?? 'Main',
                'total_amount' => round(($o->total_minor ?? $o->total_amount_minor ?? 0) / 100, 2),
                'paid_amount' => round(($o->total_minor ?? $o->paid_amount_minor ?? 0) / 100, 2),
                'items_count' => $o->items ? $o->items->count() : 0,
                'created_at' => $o->created_at?->format('Y-m-d H:i:s'),
            ]);

            $paymentMethodBreakdown = PosOrder::where('tenant_id', $tenantId)
                ->whereNotIn('status', ['cancelled', 'voided'])
                ->select('payment_method', DB::raw('sum(total_minor) as total_minor'), DB::raw('count(*) as count'))
                ->groupBy('payment_method')
                ->get()
                ->map(fn ($pm) => [
                    'method' => $pm->payment_method ?? 'unknown',
                    'count' => $pm->count,
                    'amount' => round(($pm->total_minor ?? 0) / 100, 2),
                ]);

            // Cashier shifts
            $shifts = CashierShift::where('tenant_id', $tenantId)
                ->with(['cashier:id,name', 'property:id,name'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'cashier_name' => $s->cashier?->name ?? 'Cashier',
                    'branch_name' => $s->property?->name ?? 'Main',
                    'status' => $s->status,
                    'opened_at' => $s->opened_at?->format('Y-m-d H:i:s'),
                    'closed_at' => $s->closed_at?->format('Y-m-d H:i:s'),
                    'opening_float' => round(($s->opening_float_minor ?? 0) / 100, 2),
                    'closing_cash' => round(($s->closing_cash_minor ?? 0) / 100, 2),
                ]);

            $data['pos'] = [
                'list' => $orders,
                'payment_methods' => $paymentMethodBreakdown,
                'shifts' => $shifts,
                'total_orders' => PosOrder::where('tenant_id', $tenantId)->count(),
            ];
        }

        // Section E: Financial Management
        if ($section === 'all' || $section === 'financials') {
            // Recognized Revenue (Lodging + POS)
            $lodgingRevenueMinor = (float) FolioLine::where('tenant_id', $tenantId)
                ->whereIn('line_type', ['room', 'room_charge'])
                ->whereNull('reversed_line_id')
                ->sum('amount_minor');

            $posRevenueMinor = (float) PosOrder::where('tenant_id', $tenantId)
                ->whereNotIn('status', ['cancelled', 'voided'])
                ->sum('total_minor');

            $totalRevenue = round(($lodgingRevenueMinor + $posRevenueMinor) / 100, 2);

            // Total Collections (actual payments logged)
            $paymentsMinor = (float) Payment::where('tenant_id', $tenantId)->sum('amount_minor');
            $totalCollections = round($paymentsMinor / 100, 2);

            // Total Expenses
            $expensesMinor = (float) Expense::where('tenant_id', $tenantId)
                ->where('status', 'approved')
                ->sum('amount_minor');
            // If no approved expenses, fallback to total sum
            if ($expensesMinor === 0.0) {
                $expensesMinor = (float) Expense::where('tenant_id', $tenantId)->sum('amount_minor');
            }
            $totalExpenses = round($expensesMinor / 100, 2);

            // Outstanding Receivables
            $unpaidFoliosMinor = (float) Folio::where('tenant_id', $tenantId)
                ->where('status', 'open')
                ->sum('balance_minor');
            $totalReceivables = round($unpaidFoliosMinor / 100, 2);

            // Net Operating Profit
            $netOperatingProfit = round($totalRevenue - $totalExpenses, 2);

            // Recent expenses
            $recentExpenses = Expense::where('tenant_id', $tenantId)
                ->with('property:id,name')
                ->latest()
                ->take(15)
                ->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'title' => $e->title ?? $e->category ?? 'Expense',
                    'category' => $e->category,
                    'amount' => round(($e->amount_minor ?? 0) / 100, 2),
                    'status' => $e->status,
                    'branch_name' => $e->property?->name ?? 'Main',
                    'date' => $e->expense_date?->format('Y-m-d') ?? $e->created_at?->format('Y-m-d'),
                ]);

            // Recent payments
            $recentPayments = Payment::where('tenant_id', $tenantId)
                ->with('property:id,name')
                ->latest()
                ->take(15)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'payment_number' => $p->payment_number ?? "PAY-{$p->id}",
                    'method' => $p->method,
                    'amount' => round(($p->amount_minor ?? 0) / 100, 2),
                    'branch_name' => $p->property?->name ?? 'Main',
                    'created_at' => $p->created_at?->format('Y-m-d H:i:s'),
                ]);

            $data['financials'] = [
                'recognized_revenue' => $totalRevenue,
                'lodging_revenue' => round($lodgingRevenueMinor / 100, 2),
                'pos_revenue' => round($posRevenueMinor / 100, 2),
                'total_collections' => $totalCollections,
                'total_expenses' => $totalExpenses,
                'net_operating_profit' => $netOperatingProfit,
                'total_receivables' => $totalReceivables,
                'recent_expenses' => $recentExpenses,
                'recent_payments' => $recentPayments,
            ];
        }

        // Section F: Inventory and Procurement
        if ($section === 'all' || $section === 'inventory') {
            $posItems = PosItem::where('tenant_id', $tenantId)
                ->with('category:id,name')
                ->latest()
                ->take(50)
                ->get()
                ->map(fn ($i) => [
                    'id' => $i->id,
                    'name' => $i->name,
                    'category_name' => $i->category?->name ?? 'General',
                    'price' => round(($i->price_minor ?? 0) / 100, 2),
                    'cost_price' => round(($i->cost_price_minor ?? 0) / 100, 2),
                    'current_stock' => (float) ($i->current_stock ?? $i->stock_quantity ?? 0),
                    'reorder_point' => (float) ($i->reorder_point ?? 5),
                    'is_available' => (bool) $i->is_available,
                ]);

            $lowStockItems = $posItems->filter(fn ($i) => $i['current_stock'] <= $i['reorder_point']);

            $stockMovements = StockMovement::where('tenant_id', $tenantId)
                ->latest()
                ->take(20)
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'item_name' => $m->item_name ?? "Item #{$m->pos_item_id}",
                    'type' => $m->type,
                    'quantity' => (float) $m->quantity,
                    'reference' => $m->reference ?? 'Manual',
                    'created_at' => $m->created_at?->format('Y-m-d H:i:s'),
                ]);

            $data['inventory'] = [
                'items' => $posItems,
                'total_items_count' => PosItem::where('tenant_id', $tenantId)->count(),
                'low_stock_count' => $lowStockItems->count(),
                'recent_movements' => $stockMovements,
            ];
        }

        // Section G: Reports & Analytics
        if ($section === 'all' || $section === 'reports') {
            // Hospitality Operational Metrics
            $totalRooms = Room::where('tenant_id', $tenantId)->where('is_active', true)->count();
            $occupiedRooms = Reservation::where('tenant_id', $tenantId)
                ->where('status', 'checked_in')
                ->count();

            $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

            $lodgingRevenueMinor = (float) FolioLine::where('tenant_id', $tenantId)
                ->whereIn('line_type', ['room', 'room_charge'])
                ->whereNull('reversed_line_id')
                ->sum('amount_minor');

            $adr = $occupiedRooms > 0 ? round(($lodgingRevenueMinor / 100) / max($occupiedRooms, 1), 2) : 0;
            $revPar = $totalRooms > 0 ? round(($lodgingRevenueMinor / 100) / max($totalRooms, 1), 2) : 0;

            // 14-day daily revenue pacing
            $dailyPacing = [];
            for ($i = 13; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $start = Carbon::parse($date)->startOfDay();
                $end = Carbon::parse($date)->endOfDay();

                $dayPos = (float) PosOrder::where('tenant_id', $tenantId)
                    ->whereBetween('created_at', [$start, $end])
                    ->whereNotIn('status', ['cancelled', 'voided'])
                    ->sum('total_minor');

                $dayLodging = (float) FolioLine::where('tenant_id', $tenantId)
                    ->whereBetween('created_at', [$start, $end])
                    ->whereIn('line_type', ['room', 'room_charge'])
                    ->whereNull('reversed_line_id')
                    ->sum('amount_minor');

                $dailyPacing[] = [
                    'date' => $date,
                    'label' => Carbon::parse($date)->format('d M'),
                    'revenue' => round(($dayPos + $dayLodging) / 100, 2),
                ];
            }

            $data['reports'] = [
                'occupancy_rate' => $occupancyRate,
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedRooms,
                'adr' => $adr,
                'rev_par' => $revPar,
                'daily_pacing' => $dailyPacing,
            ];
        }

        // Section H: Configuration & Administration (with strictly masked secrets)
        if ($section === 'all' || $section === 'config') {
            $rawSettings = $tenant->settings ?? [];
            $maskedSettings = $this->maskSensitiveData($rawSettings);

            $branchConfigs = Property::where('tenant_id', $tenantId)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'timezone' => $p->timezone,
                    'currency' => $p->currency,
                    'checkin_time' => $p->checkin_time,
                    'checkout_time' => $p->checkout_time,
                    'tax_config' => $this->maskSensitiveData($p->tax_config ?? []),
                ]);

            $data['config'] = [
                'tenant_settings' => $maskedSettings,
                'features' => $tenant->features ?? [],
                'branch_configs' => $branchConfigs,
                'is_credential_masked' => true,
            ];
        }

        // Section I: Security & System Events
        if ($section === 'all' || $section === 'security') {
            $auditEvents = TenantAuditEvent::where('tenant_id', $tenantId)
                ->with(['user:id,name,email', 'branch:id,name'])
                ->latest('created_at')
                ->take(50)
                ->get()
                ->map(fn ($evt) => [
                    'id' => $evt->id,
                    'module' => $evt->module,
                    'action_type' => $evt->action_type,
                    'description' => $evt->description,
                    'record_type' => $evt->record_type,
                    'record_id' => $evt->record_id,
                    'user_name' => $evt->user_name ?? $evt->user?->name ?? 'System',
                    'branch_name' => $evt->branch?->name ?? 'Main',
                    'status' => $evt->status,
                    'ip_address' => $evt->ip_address,
                    'before_state' => $this->maskSensitiveData($evt->before_state ?? []),
                    'after_state' => $this->maskSensitiveData($evt->after_state ?? []),
                    'created_at' => $evt->created_at->format('Y-m-d H:i:s'),
                ]);

            $pastSessions = TenantInspectionSession::where('tenant_id', $tenantId)
                ->with('superAdmin:id,name,email')
                ->latest('started_at')
                ->take(15)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'super_admin_name' => $s->superAdmin?->name ?? 'Super Admin',
                    'reason' => $s->reason,
                    'started_at' => $s->started_at->format('Y-m-d H:i:s'),
                    'ended_at' => $s->ended_at?->format('Y-m-d H:i:s'),
                    'is_active' => $s->isActive(),
                    'is_write_mode' => (bool) $s->is_write_mode,
                    'ip_address' => $s->ip_address,
                ]);

            $data['security'] = [
                'events' => $auditEvents,
                'inspection_sessions' => $pastSessions,
            ];
        }

        return $data;
    }

    /**
     * Unified Global Tenant Activity Timeline across all tenants.
     */
    public function getGlobalTimeline(array $filters = [], int $perPage = 30): LengthAwarePaginator
    {
        $query = TenantAuditEvent::query()
            ->with(['tenant:id,name,slug', 'user:id,name,email', 'branch:id,name'])
            ->latest('created_at');

        if (! empty($filters['tenant_id'])) {
            $query->where('tenant_id', $filters['tenant_id']);
        }

        if (! empty($filters['module']) && $filters['module'] !== 'all') {
            $query->where('module', $filters['module']);
        }

        if (! empty($filters['action_type']) && $filters['action_type'] !== 'all') {
            $query->where('action_type', $filters['action_type']);
        }

        if (! empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['date_from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['date_from'])->startOfDay());
        }

        if (! empty($filters['date_to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['date_to'])->endOfDay());
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('user_name', 'like', "%{$search}%")
                    ->orWhere('record_type', 'like', "%{$search}%")
                    ->orWhere('record_id', 'like', "%{$search}%");
            });
        }

        $paginated = $query->paginate($perPage)->withQueryString();

        $enriched = $paginated->getCollection()->map(fn ($evt) => [
            'id' => $evt->id,
            'tenant_id' => $evt->tenant_id,
            'tenant_name' => $evt->tenant?->name ?? 'Unknown Tenant',
            'user_id' => $evt->user_id,
            'user_name' => $evt->user_name ?? $evt->user?->name ?? 'System',
            'branch_id' => $evt->branch_id,
            'branch_name' => $evt->branch?->name ?? 'Main',
            'module' => $evt->module,
            'action_type' => $evt->action_type,
            'description' => $evt->description,
            'record_type' => $evt->record_type,
            'record_id' => $evt->record_id,
            'before_state' => $this->maskSensitiveData($evt->before_state ?? []),
            'after_state' => $this->maskSensitiveData($evt->after_state ?? []),
            'status' => $evt->status,
            'ip_address' => $evt->ip_address,
            'user_agent' => $evt->user_agent,
            'created_at' => $evt->created_at->format('Y-m-d H:i:s'),
            'created_at_human' => $evt->created_at->diffForHumans(),
        ]);

        $paginated->setCollection($enriched);

        return $paginated;
    }

    /**
     * Cross-tenant financial monitoring matrix.
     */
    public function getCrossTenantFinancials(array $filters = []): array
    {
        $tenants = Tenant::orderBy('name', 'asc')->get();

        $rows = $tenants->map(function (Tenant $tenant) {
            $tenantId = $tenant->id;

            // Lodging revenue
            $lodgingMinor = (float) FolioLine::where('tenant_id', $tenantId)
                ->whereIn('line_type', ['room', 'room_charge'])
                ->whereNull('reversed_line_id')
                ->sum('amount_minor');

            // POS revenue
            $posMinor = (float) PosOrder::where('tenant_id', $tenantId)
                ->whereNotIn('status', ['cancelled', 'voided'])
                ->sum('total_minor');

            $totalRevenue = round(($lodgingMinor + $posMinor) / 100, 2);

            // Expenses
            $expensesMinor = (float) Expense::where('tenant_id', $tenantId)
                ->where('status', 'approved')
                ->sum('amount_minor');
            if ($expensesMinor === 0.0) {
                $expensesMinor = (float) Expense::where('tenant_id', $tenantId)->sum('amount_minor');
            }
            $totalExpenses = round($expensesMinor / 100, 2);

            // Collections
            $collectionsMinor = (float) Payment::where('tenant_id', $tenantId)->sum('amount_minor');
            $totalCollections = round($collectionsMinor / 100, 2);

            // Receivables
            $unpaidMinor = (float) Folio::where('tenant_id', $tenantId)
                ->where('status', 'open')
                ->sum('balance_minor');
            $totalReceivables = round($unpaidMinor / 100, 2);

            $netProfit = round($totalRevenue - $totalExpenses, 2);

            return [
                'tenant_id' => $tenant->id,
                'tenant_name' => $tenant->name,
                'plan' => $tenant->plan,
                'is_active' => (bool) $tenant->is_active,
                'branches_count' => Property::where('tenant_id', $tenantId)->count(),
                'recognized_revenue' => $totalRevenue,
                'lodging_revenue' => round($lodgingMinor / 100, 2),
                'pos_revenue' => round($posMinor / 100, 2),
                'total_expenses' => $totalExpenses,
                'total_collections' => $totalCollections,
                'total_receivables' => $totalReceivables,
                'net_operating_profit' => $netProfit,
            ];
        });

        // Totals
        $totals = [
            'total_recognized_revenue' => round($rows->sum('recognized_revenue'), 2),
            'total_expenses' => round($rows->sum('total_expenses'), 2),
            'total_collections' => round($rows->sum('total_collections'), 2),
            'total_receivables' => round($rows->sum('total_receivables'), 2),
            'total_net_operating_profit' => round($rows->sum('net_operating_profit'), 2),
        ];

        return [
            'rows' => $rows,
            'totals' => $totals,
        ];
    }

    /**
     * Start an explicit, audited support inspection session.
     */
    public function startSupportSession(
        Tenant $tenant,
        User $superAdmin,
        string $reason,
        string $ip,
        ?string $userAgent,
        bool $isWriteMode = false
    ): TenantInspectionSession {
        // End any previous open session for this superAdmin & tenant
        TenantInspectionSession::where('tenant_id', $tenant->id)
            ->where('super_admin_id', $superAdmin->id)
            ->whereNull('ended_at')
            ->update(['ended_at' => now()]);

        $session = TenantInspectionSession::create([
            'tenant_id' => $tenant->id,
            'super_admin_id' => $superAdmin->id,
            'reason' => $reason,
            'started_at' => now(),
            'is_write_mode' => $isWriteMode,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'actions_performed' => [
                [
                    'action' => 'session_started',
                    'timestamp' => now()->toIso8601String(),
                    'reason' => $reason,
                    'write_mode' => $isWriteMode,
                ],
            ],
        ]);

        // Log immutable audit event
        $this->logAuditEvent([
            'tenant_id' => $tenant->id,
            'user_id' => $superAdmin->id,
            'user_name' => $superAdmin->name,
            'module' => 'security',
            'action_type' => 'support_session_started',
            'description' => "Super Admin {$superAdmin->name} started support inspection session. Reason: {$reason}",
            'record_type' => TenantInspectionSession::class,
            'record_id' => (string) $session->id,
            'status' => 'success',
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'after_state' => [
                'session_id' => $session->id,
                'reason' => $reason,
                'is_write_mode' => $isWriteMode,
            ],
        ]);

        return $session;
    }

    /**
     * End an active support inspection session.
     */
    public function endSupportSession(TenantInspectionSession $session): void
    {
        $session->update([
            'ended_at' => now(),
        ]);

        $session->recordAction('session_ended', [
            'duration_seconds' => now()->diffInSeconds($session->started_at),
        ]);

        $superAdmin = $session->superAdmin;

        $this->logAuditEvent([
            'tenant_id' => $session->tenant_id,
            'user_id' => $session->super_admin_id,
            'user_name' => $superAdmin?->name ?? 'Super Admin',
            'module' => 'security',
            'action_type' => 'support_session_ended',
            'description' => "Support inspection session #{$session->id} concluded.",
            'record_type' => TenantInspectionSession::class,
            'record_id' => (string) $session->id,
            'status' => 'success',
            'ip_address' => $session->ip_address,
            'user_agent' => $session->user_agent,
        ]);
    }

    /**
     * Log an immutable tenant audit event.
     */
    public function logAuditEvent(array $data): TenantAuditEvent
    {
        return TenantAuditEvent::create([
            'tenant_id' => $data['tenant_id'],
            'user_id' => $data['user_id'] ?? null,
            'user_name' => $data['user_name'] ?? null,
            'branch_id' => $data['branch_id'] ?? null,
            'module' => $data['module'] ?? 'system',
            'action_type' => $data['action_type'] ?? 'inspected',
            'description' => $data['description'] ?? 'Event logged',
            'record_type' => $data['record_type'] ?? null,
            'record_id' => isset($data['record_id']) ? (string) $data['record_id'] : null,
            'before_state' => $this->maskSensitiveData($data['before_state'] ?? null),
            'after_state' => $this->maskSensitiveData($data['after_state'] ?? null),
            'status' => $data['status'] ?? 'success',
            'ip_address' => $data['ip_address'] ?? request()->ip(),
            'user_agent' => $data['user_agent'] ?? request()->userAgent(),
            'created_at' => now(),
        ]);
    }

    /**
     * Strictly mask sensitive keys (passwords, tokens, api keys, secrets) recursively.
     */
    public function maskSensitiveData(mixed $data): mixed
    {
        if (! is_array($data)) {
            return $data;
        }

        $masked = [];
        foreach ($data as $key => $value) {
            $isSensitiveKey = false;
            foreach (self::SENSITIVE_KEY_PATTERNS as $pattern) {
                if (stripos((string) $key, $pattern) !== false) {
                    $isSensitiveKey = true;
                    break;
                }
            }

            if ($isSensitiveKey) {
                if (is_string($value) && strlen($value) > 4) {
                    $masked[$key] = '••••••••' . substr($value, -4);
                } else {
                    $masked[$key] = '••••••••••••';
                }
            } elseif (is_array($value)) {
                $masked[$key] = $this->maskSensitiveData($value);
            } else {
                $masked[$key] = $value;
            }
        }

        return $masked;
    }
}
