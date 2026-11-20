<?php

namespace App\Services;

use App\Models\BusinessDate;
use App\Models\Expense;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\OwnerDirective;
use App\Models\OwnerDrawing;
use App\Models\OwnerRequisition;
use App\Models\Payment;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Stay;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class OwnerDashboardService
{
    /**
     * Resolve date range with prior period comparison window.
     *
     * @return array{0: Carbon, 1: Carbon, 2: Carbon, 3: Carbon, 4: string, 5: string}
     *         [$start, $end, $prevStart, $prevEnd, $period, $granularity]
     */
    public function resolveDateRange(Request $request): array
    {
        $period = (string) $request->input('period', 'month');
        $now = Carbon::now();
        $end = $now->copy()->endOfDay();

        // Support custom date range if start_date and end_date are provided
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $start = Carbon::parse($request->input('start_date'))->startOfDay();
            $end = Carbon::parse($request->input('end_date'))->endOfDay();
            $diffDays = max(1, $start->diffInDays($end));
            $prevStart = $start->copy()->subDays($diffDays);
            $prevEnd = $start->copy()->subSecond();
            $period = 'custom';
            $granularity = $diffDays > 60 ? 'month' : ($diffDays > 1 ? 'day' : 'hour');

            return [$start, $end, $prevStart, $prevEnd, $period, $granularity];
        }

        switch ($period) {
            case 'today':
                $start = $now->copy()->startOfDay();
                $prevStart = $start->copy()->subDay();
                $prevEnd = $end->copy()->subDay();
                $granularity = 'hour';
                break;
            case '7d':
                $start = $now->copy()->subDays(6)->startOfDay();
                $prevStart = $start->copy()->subDays(7);
                $prevEnd = $start->copy()->subDay()->endOfDay();
                $granularity = 'day';
                break;
            case '30d':
                $start = $now->copy()->subDays(29)->startOfDay();
                $prevStart = $start->copy()->subDays(30);
                $prevEnd = $start->copy()->subDay()->endOfDay();
                $granularity = 'day';
                break;
            case 'year':
                $start = $now->copy()->startOfYear();
                $prevStart = $start->copy()->subYear();
                $prevEnd = $end->copy()->subYear();
                $granularity = 'month';
                break;
            case 'month':
            default:
                $period = 'month';
                $start = $now->copy()->startOfMonth();
                $prevStart = $start->copy()->subMonth();
                $prevEnd = $end->copy()->subMonth();
                $granularity = 'day';
                break;
        }

        return [$start, $end, $prevStart, $prevEnd, $period, $granularity];
    }

    /**
     * Get consolidated data for the Business Owner executive dashboard.
     *
     * @return array<string, mixed>
     */
    public function getDashboardData(User $user, Request $request): array
    {
        $tenantId = $user->tenant_id;
        $tenant = Tenant::with('properties')->find($tenantId);

        [$start, $end, $prevStart, $prevEnd, $period, $granularity] = $this->resolveDateRange($request);

        // Branch filter scope - validated against tenant's owned properties
        $propertyFilter = $request->query('property_id');
        $propertiesQuery = Property::where('tenant_id', $tenantId);
        if ($propertyFilter) {
            $propertiesQuery->where('id', $propertyFilter);
        }
        $properties = $propertiesQuery->withCount(['rooms', 'reservations'])->get();
        $propertyIds = $properties->pluck('id');
        $selectedPropertyId = $propertyFilter && $propertyIds->isNotEmpty() ? (string) $propertyFilter : null;

        // 1. Live Multi-Branch Overview Scorecard
        $multiBranchData = $this->computeMultiBranchData($tenantId, $properties, $start, $end);

        // 2. Financial KPIs (Live, period-aware, tenant-isolated)
        $financialKpis = $this->computeFinancialKpis($tenantId, $propertyIds, $selectedPropertyId, $start, $end, $prevStart, $prevEnd);

        // 3. Operational KPIs (Bookings, Occupancy, ADR, RevPAR, check-ins/outs)
        $operationalKpis = $this->computeOperationalKpis($tenantId, $propertyIds, $selectedPropertyId, $start, $end);

        // 4. Revenue Trend Series (Accommodation vs POS vs Total)
        $revenueTrend = $this->computeRevenueTrend($tenantId, $propertyIds, $selectedPropertyId, $start, $end, $granularity);

        // 5. Departmental Yield Breakdown (Rooms, Restaurant, Bar, Room Service, Laundry, etc.)
        $departments = $this->computeDepartmentYield($tenantId, $propertyIds, $selectedPropertyId, $start, $end);

        // 6. Tender & Payment Methods Breakdown
        $paymentsByMethod = $this->computePaymentsByMethod($tenantId, $selectedPropertyId, $start, $end);

        // 7. Recent Transactions & Bookings Watchlist
        $recentTransactions = $this->getRecentTransactions($tenantId, $selectedPropertyId, 10);
        $recentBookings = $this->getRecentBookings($tenantId, $propertyIds, 8);
        $outstandingFolios = $this->getOutstandingFolios($tenantId, $selectedPropertyId, 10);

        // 8. Governance: Requisitions, Directives, Drawings, Managers
        $requisitions = OwnerRequisition::where('tenant_id', $tenantId)
            ->with(['property:id,name,city', 'requester:id,name,email,username', 'approver:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        $directives = OwnerDirective::where('tenant_id', $tenantId)
            ->with(['property:id,name,city', 'creator:id,name', 'acknowledgedBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        $drawings = OwnerDrawing::where('tenant_id', $tenantId)
            ->with(['property:id,name', 'creator:id,name'])
            ->orderBy('drawing_date', 'desc')
            ->get();

        $managersList = User::where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->where('role', 'general_manager')
                    ->orWhere('role', 'manager')
                    ->orWhereJsonContains('roles', 'general_manager');
            })
            ->with('property:id,name,city')
            ->select('id', 'name', 'email', 'phone', 'username', 'property_id', 'status')
            ->get();

        // 9. Loss Prevention & Audit Watchlist
        $discountsWatchlist = $this->getDiscountsWatchlist($tenantId, 15);
        $cancelledBookings = $this->getCancelledBookings($tenantId, 10);

        // 10. Operational & System Alerts
        $alerts = $this->computeAlerts($tenantId, $propertyIds, $selectedPropertyId, $requisitions, $start, $end);

        // 11. Staff overview
        $staffByRole = User::where('tenant_id', $tenantId)
            ->where('status', 'active')
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId))
            ->selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role')
            ->all();

        return [
            'tenant' => $tenant,
            'tab' => $request->query('tab', 'overview'),
            'period' => $period,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'selected_property_id' => $selectedPropertyId,
            'metrics' => [
                'total_revenue_minor' => $financialKpis['current']['total_revenue_minor'],
                'total_expenses_minor' => $financialKpis['current']['total_expenses_minor'],
                'gross_operating_profit_minor' => $financialKpis['current']['gop_minor'],
                'gop_margin_percent' => $financialKpis['current']['gop_margin_percent'],
                'total_payments_received_minor' => $financialKpis['current']['total_payments_received_minor'],
                'outstanding_balances_minor' => $financialKpis['current']['outstanding_balances_minor'],
                'refunds_minor' => $financialKpis['current']['refunds_minor'],
                'tax_collected_minor' => $financialKpis['current']['tax_collected_minor'],
                'today_revenue_minor' => $financialKpis['today']['total_revenue_minor'],
                'group_month_revenue_minor' => $financialKpis['current']['total_revenue_minor'],
                'group_today_revenue_minor' => $financialKpis['today']['total_revenue_minor'],
                'group_month_expenses_minor' => $financialKpis['current']['total_expenses_minor'],
                'group_gop_minor' => $financialKpis['current']['gop_minor'],
                'group_gop_margin_percent' => $financialKpis['current']['gop_margin_percent'],
                'group_occupancy_rate' => $operationalKpis['occupancy_rate'],
                'total_rooms_group' => $operationalKpis['total_rooms'],
                'total_occupied_group' => $operationalKpis['occupied_rooms'],
                'group_target_minor' => (int) $properties->sum('monthly_target_revenue_minor'),
                'group_target_progress_percent' => $properties->sum('monthly_target_revenue_minor') > 0
                    ? round(($financialKpis['current']['total_revenue_minor'] / $properties->sum('monthly_target_revenue_minor')) * 100, 1)
                    : 0,
                'pending_approvals_count' => $requisitions->where('status', 'pending_owner')->count(),
                'active_directives_count' => $directives->where('status', 'active')->count(),
                'total_drawings_minor' => (int) $drawings->where('drawing_type', 'dividend')->sum('amount_minor'),
                'total_capital_injected_minor' => (int) $drawings->where('drawing_type', 'capital_injection')->sum('amount_minor'),
            ],
            'financial_kpis' => $financialKpis,
            'operational_kpis' => $operationalKpis,
            'revenue_trend' => $revenueTrend,
            'departments' => $departments,
            'payments_by_method' => $paymentsByMethod,
            'recent_transactions' => $recentTransactions,
            'recent_bookings' => $recentBookings,
            'outstanding_folios' => $outstandingFolios,
            'multiBranchData' => $multiBranchData,
            'requisitions' => $requisitions,
            'directives' => $directives,
            'discountsWatchlist' => $discountsWatchlist,
            'cancelledBookings' => $cancelledBookings,
            'drawings' => $drawings,
            'managersList' => $managersList,
            'staff' => [
                'total_active' => array_sum($staffByRole),
                'by_role' => $staffByRole,
            ],
            'alerts' => $alerts,
            'inspectingPropertyId' => session('owner_inspecting_property_id'),
            'analytics' => [
                'period' => $period,
                'selected_property_id' => $selectedPropertyId,
                'range' => [
                    'start' => $start->toDateString(),
                    'end' => $end->toDateString(),
                    'previous_start' => $prevStart->toDateString(),
                    'previous_end' => $prevEnd->toDateString(),
                ],
                'comparison' => [
                    'revenue_minor' => $financialKpis['current']['total_revenue_minor'],
                    'previous_revenue_minor' => $financialKpis['previous']['total_revenue_minor'],
                    'revenue_change_percent' => $financialKpis['comparison']['revenue_change_percent'],
                    'expenses_minor' => $financialKpis['current']['total_expenses_minor'],
                    'previous_expenses_minor' => $financialKpis['previous']['total_expenses_minor'],
                    'expenses_change_percent' => $financialKpis['comparison']['expenses_change_percent'],
                    'gop_minor' => $financialKpis['current']['gop_minor'],
                    'previous_gop_minor' => $financialKpis['previous']['gop_minor'],
                    'gop_change_percent' => $financialKpis['comparison']['gop_change_percent'],
                    'pos_revenue_minor' => $financialKpis['current']['pos_revenue_minor'],
                    'previous_pos_revenue_minor' => $financialKpis['previous']['pos_revenue_minor'],
                ],
                'revenue_trend' => $revenueTrend,
                'occupancy' => [
                    'total_rooms' => $operationalKpis['total_rooms'],
                    'occupied_rooms' => $operationalKpis['occupied_rooms'],
                    'available_rooms' => $operationalKpis['available_rooms'],
                    'reserved_rooms' => $operationalKpis['confirmed_bookings'],
                    'out_of_order_rooms' => $operationalKpis['out_of_order_rooms'],
                    'occupancy_rate' => $operationalKpis['occupancy_rate'],
                ],
                'departments' => $departments,
                'payments_by_method' => $paymentsByMethod,
                'staff' => [
                    'total_active' => array_sum($staffByRole),
                    'by_role' => $staffByRole,
                ],
                'alerts' => $alerts,
            ],
        ];
    }

    /**
     * Compute multi-branch performance scorecards.
     */
    protected function computeMultiBranchData(string $tenantId, $properties, Carbon $start, Carbon $end)
    {
        $today = Carbon::today()->startOfDay();
        $now = Carbon::now();
        $daysCount = max(1, $start->diffInDays($end) + 1);

        return $properties->map(function ($property) use ($tenantId, $start, $end, $today, $daysCount) {
            $totalRooms = Room::where('tenant_id', $tenantId)->where('property_id', $property->id)->count();
            $occupiedRooms = Room::where('tenant_id', $tenantId)->where('property_id', $property->id)->where('status_occupancy', 'occupied')->count();
            $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

            // Recognized Revenue in period: Folio line accommodation & charges + direct POS
            $folioRev = (int) FolioLine::whereHas('folio', fn ($q) => $q->where('tenant_id', $tenantId)->where('property_id', $property->id))
                ->whereBetween('created_at', [$start, $end])
                ->sum('amount_minor');

            $posDirectRev = (int) PosOrder::where('tenant_id', $tenantId)
                ->where('property_id', $property->id)
                ->where('payment_status', 'paid')
                ->where('payment_method', '!=', 'room_folio')
                ->whereBetween('created_at', [$start, $end])
                ->sum('total_minor');

            $totalRevMinor = $folioRev + $posDirectRev;

            // Today Revenue
            $todayFolioRev = (int) FolioLine::whereHas('folio', fn ($q) => $q->where('tenant_id', $tenantId)->where('property_id', $property->id))
                ->where('created_at', '>=', $today)
                ->sum('amount_minor');

            $todayPosRev = (int) PosOrder::where('tenant_id', $tenantId)
                ->where('property_id', $property->id)
                ->where('payment_status', 'paid')
                ->where('payment_method', '!=', 'room_folio')
                ->where('created_at', '>=', $today)
                ->sum('total_minor');

            $todayRevMinor = $todayFolioRev + $todayPosRev;

            // Expenses in period
            $expensesMinor = (int) Expense::where('tenant_id', $tenantId)
                ->where('property_id', $property->id)
                ->where('status', '!=', 'cancelled')
                ->where(function ($q) use ($start, $end) {
                    $q->whereDate('expense_date', '>=', $start->toDateString())
                        ->whereDate('expense_date', '<=', $end->toDateString())
                        ->orWhereBetween('created_at', [$start, $end]);
                })
                ->sum('amount_minor');

            $gopMinor = $totalRevMinor - $expensesMinor;
            $gopMargin = $totalRevMinor > 0 ? round(($gopMinor / $totalRevMinor) * 100, 1) : 0;

            $targetMinor = $property->monthly_target_revenue_minor ?? 0;
            $targetProgress = $targetMinor > 0 ? round(($totalRevMinor / $targetMinor) * 100, 1) : 0;

            // ADR and RevPAR
            $occupiedRoomNights = max(1, $occupiedRooms * $daysCount);
            $roomRevenue = (int) FolioLine::whereHas('folio', fn ($q) => $q->where('tenant_id', $tenantId)->where('property_id', $property->id))
                ->where('line_type', 'room')
                ->whereBetween('created_at', [$start, $end])
                ->sum('amount_minor');

            $adrMinor = (int) round($roomRevenue / $occupiedRoomNights);
            $totalAvailableNights = max(1, $totalRooms * $daysCount);
            $revparMinor = (int) round($roomRevenue / $totalAvailableNights);

            $manager = User::where('tenant_id', $tenantId)
                ->where('property_id', $property->id)
                ->where(function ($q) {
                    $q->where('role', 'general_manager')
                        ->orWhere('role', 'manager')
                        ->orWhereJsonContains('roles', 'general_manager');
                })
                ->select('id', 'name', 'email', 'phone', 'username')
                ->first();

            return [
                'id' => $property->id,
                'name' => $property->name,
                'code' => $property->code,
                'city' => $property->city ?? 'Tanzania',
                'phone' => $property->phone,
                'email' => $property->email,
                'is_active' => (bool) $property->is_active,
                'monthly_target_revenue_minor' => $targetMinor,
                'target_progress_percent' => $targetProgress,
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedRooms,
                'occupancy_rate' => $occupancyRate,
                'month_revenue_minor' => $totalRevMinor,
                'today_revenue_minor' => $todayRevMinor,
                'month_expenses_minor' => $expensesMinor,
                'gop_minor' => $gopMinor,
                'gop_margin_percent' => $gopMargin,
                'adr_minor' => $adrMinor,
                'revpar_minor' => $revparMinor,
                'general_manager' => $manager ? [
                    'id' => $manager->id,
                    'name' => $manager->name,
                    'email' => $manager->email,
                    'phone' => $manager->phone,
                    'username' => $manager->username,
                ] : null,
            ];
        });
    }

    /**
     * Compute comprehensive financial KPIs with period comparison.
     */
    protected function computeFinancialKpis(string $tenantId, $propertyIds, ?string $selectedPropertyId, Carbon $start, Carbon $end, Carbon $prevStart, Carbon $prevEnd): array
    {
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::now()->endOfDay();

        $calcPeriod = function (Carbon $from, Carbon $to) use ($tenantId, $propertyIds, $selectedPropertyId) {
            // Accommodation & Folio recognized charges
            $folioLinesQuery = FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyIds, $selectedPropertyId) {
                $q->where('tenant_id', $tenantId);
                if ($selectedPropertyId) {
                    $q->where('property_id', $selectedPropertyId);
                } else {
                    $q->whereIn('property_id', $propertyIds);
                }
            })->whereBetween('created_at', [$from, $to]);

            $roomRevenueMinor = (int) (clone $folioLinesQuery)->where('line_type', 'room')->sum('amount_minor');
            $ancillaryFolioRevenueMinor = (int) (clone $folioLinesQuery)->whereNotIn('line_type', ['room', 'discount', 'refund'])->sum('amount_minor');
            $folioTaxMinor = (int) (clone $folioLinesQuery)->sum('tax_minor');

            // Direct POS Sales (Paid tenders that were NOT billed to room folio)
            $posQuery = PosOrder::where('tenant_id', $tenantId)
                ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
                ->where('payment_status', 'paid')
                ->where('payment_method', '!=', 'room_folio')
                ->whereBetween('created_at', [$from, $to]);

            $posRevenueMinor = (int) (clone $posQuery)->sum('total_minor');
            $posTaxMinor = (int) (clone $posQuery)->sum('tax_minor');

            // Total recognized revenue (without double counting room-charged POS items)
            $totalRevenueMinor = $roomRevenueMinor + $ancillaryFolioRevenueMinor + $posRevenueMinor;

            // Total payments received (cash flow collections)
            $paymentsQuery = Payment::whereHas('folio', function ($q) use ($tenantId, $propertyIds, $selectedPropertyId) {
                $q->where('tenant_id', $tenantId);
                if ($selectedPropertyId) {
                    $q->where('property_id', $selectedPropertyId);
                } else {
                    $q->whereIn('property_id', $propertyIds);
                }
            })
                ->where('status', 'confirmed')
                ->whereBetween('created_at', [$from, $to]);

            $folioPaymentsMinor = (int) $paymentsQuery->sum('amount_minor');
            $totalPaymentsReceivedMinor = $folioPaymentsMinor + $posRevenueMinor;

            $folioCashMinor = (int) (clone $paymentsQuery)->where('payment_method', 'cash')->sum('amount_minor');
            $folioDigitalMinor = (int) (clone $paymentsQuery)->where('payment_method', '!=', 'cash')->sum('amount_minor');
            $posCashMinor = (int) (clone $posQuery)->where('payment_method', 'cash')->sum('total_minor');
            $posDigitalMinor = (int) (clone $posQuery)->where('payment_method', '!=', 'cash')->sum('total_minor');

            $cashPaymentsMinor = $folioCashMinor + $posCashMinor;
            $digitalPaymentsMinor = $folioDigitalMinor + $posDigitalMinor;

            // Expenses in period
            $expensesQuery = Expense::where('tenant_id', $tenantId)
                ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
                ->where('status', '!=', 'cancelled')
                ->where(function ($q) use ($from, $to) {
                    $q->whereDate('expense_date', '>=', $from->toDateString())
                        ->whereDate('expense_date', '<=', $to->toDateString())
                        ->orWhereBetween('created_at', [$from, $to]);
                });

            $totalExpensesMinor = (int) $expensesQuery->sum('amount_minor');

            // Refunds
            $refundsMinor = (int) Payment::whereHas('folio', function ($q) use ($tenantId, $propertyIds, $selectedPropertyId) {
                $q->where('tenant_id', $tenantId);
                if ($selectedPropertyId) {
                    $q->where('property_id', $selectedPropertyId);
                } else {
                    $q->whereIn('property_id', $propertyIds);
                }
            })
                ->where(function ($q) {
                    $q->where('status', 'refunded')
                        ->orWhere('amount_minor', '<', 0);
                })
                ->whereBetween('created_at', [$from, $to])
                ->sum('amount_minor');
            $refundsMinor = abs($refundsMinor);

            // Gross Operating Profit
            $gopMinor = $totalRevenueMinor - $totalExpensesMinor;
            $gopMargin = $totalRevenueMinor > 0 ? round(($gopMinor / $totalRevenueMinor) * 100, 1) : 0;

            return [
                'total_revenue_minor' => $totalRevenueMinor,
                'room_revenue_minor' => $roomRevenueMinor,
                'pos_revenue_minor' => $posRevenueMinor,
                'total_expenses_minor' => $totalExpensesMinor,
                'gop_minor' => $gopMinor,
                'gop_margin_percent' => $gopMargin,
                'total_payments_received_minor' => $totalPaymentsReceivedMinor,
                'total_payments_minor' => $totalPaymentsReceivedMinor,
                'cash_payments_minor' => $cashPaymentsMinor,
                'digital_payments_minor' => $digitalPaymentsMinor,
                'tax_collected_minor' => $folioTaxMinor + $posTaxMinor,
                'refunds_minor' => $refundsMinor,
            ];
        };

        $current = $calcPeriod($start, $end);
        $previous = $calcPeriod($prevStart, $prevEnd);
        $today = $calcPeriod($todayStart, $todayEnd);

        // Outstanding Customer Balances (Folio balances > 0)
        $outstandingBalancesMinor = (int) Folio::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->where('status', 'open')
            ->where('balance_minor', '>', 0)
            ->sum('balance_minor');

        $pctChange = function (int|float $cur, int|float $prev): ?float {
            if ($prev == 0) {
                return $cur == 0 ? 0.0 : null;
            }

            return round((($cur - $prev) / abs($prev)) * 100, 1);
        };

        $current['outstanding_balances_minor'] = $outstandingBalancesMinor;

        return [
            'current' => $current,
            'previous' => $previous,
            'today' => $today,
            'comparison' => [
                'revenue_change_percent' => $pctChange($current['total_revenue_minor'], $previous['total_revenue_minor']),
                'expenses_change_percent' => $pctChange($current['total_expenses_minor'], $previous['total_expenses_minor']),
                'gop_change_percent' => $pctChange($current['gop_minor'], $previous['gop_minor']),
            ],
        ];
    }

    /**
     * Compute operational KPIs: bookings, occupancy, ADR, RevPAR.
     */
    protected function computeOperationalKpis(string $tenantId, $propertyIds, ?string $selectedPropertyId, Carbon $start, Carbon $end): array
    {
        $todayDate = Carbon::today()->toDateString();
        $daysCount = max(1, $start->diffInDays($end) + 1);

        $roomsQuery = Room::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->where('is_active', true);

        $totalRooms = (clone $roomsQuery)->count();
        $occupiedRooms = (clone $roomsQuery)->where('status_occupancy', 'occupied')->count();
        $outOfOrderRooms = (clone $roomsQuery)->whereIn('status_hk', ['out_of_order', 'out_of_service'])->count();
        $availableRooms = max(0, $totalRooms - $occupiedRooms - $outOfOrderRooms);
        $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

        // Bookings in period
        $resQuery = Reservation::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds));

        $totalBookings = (clone $resQuery)->whereBetween('created_at', [$start, $end])->count();
        $confirmedBookings = (clone $resQuery)->whereBetween('created_at', [$start, $end])->where('status', 'confirmed')->count();
        $pendingBookings = (clone $resQuery)->whereBetween('created_at', [$start, $end])->whereIn('status', ['tentative', 'pending'])->count();
        $cancelledBookings = (clone $resQuery)->whereBetween('created_at', [$start, $end])->where('status', 'cancelled')->count();

        // Check-ins & check-outs
        $currentCheckIns = Stay::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->whereHas('room', fn ($r) => $r->where('property_id', $selectedPropertyId)), fn ($q) => $q->whereHas('room', fn ($r) => $r->whereIn('property_id', $propertyIds)))
            ->whereNull('checked_out_at')
            ->count();

        $expectedCheckInsToday = (clone $resQuery)
            ->whereDate('check_in', $todayDate)
            ->whereIn('status', ['confirmed', 'tentative'])
            ->count();

        $expectedCheckOutsToday = (clone $resQuery)
            ->whereDate('check_out', $todayDate)
            ->whereIn('status', ['checked_in', 'confirmed'])
            ->count();

        // ADR and RevPAR
        $roomRevenue = (int) FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyIds, $selectedPropertyId) {
            $q->where('tenant_id', $tenantId);
            if ($selectedPropertyId) {
                $q->where('property_id', $selectedPropertyId);
            } else {
                $q->whereIn('property_id', $propertyIds);
            }
        })
            ->where('line_type', 'room')
            ->whereBetween('created_at', [$start, $end])
            ->sum('amount_minor');

        $occupiedRoomNights = max(1, $occupiedRooms * $daysCount);
        $adrMinor = (int) round($roomRevenue / $occupiedRoomNights);

        $totalAvailableNights = max(1, $totalRooms * $daysCount);
        $revparMinor = (int) round($roomRevenue / $totalAvailableNights);

        return [
            'total_rooms' => $totalRooms,
            'occupied_rooms' => $occupiedRooms,
            'available_rooms' => $availableRooms,
            'out_of_order_rooms' => $outOfOrderRooms,
            'occupancy_rate' => $occupancyRate,
            'total_bookings' => $totalBookings,
            'confirmed_bookings' => $confirmedBookings,
            'pending_bookings' => $pendingBookings,
            'cancelled_bookings' => $cancelledBookings,
            'current_check_ins' => $currentCheckIns,
            'expected_check_ins' => $expectedCheckInsToday,
            'expected_check_outs' => $expectedCheckOutsToday,
            'adr_minor' => $adrMinor,
            'revpar_minor' => $revparMinor,
        ];
    }

    /**
     * Compute revenue trend points.
     */
    protected function computeRevenueTrend(string $tenantId, $propertyIds, ?string $selectedPropertyId, Carbon $start, Carbon $end, string $granularity): array
    {
        $trend = [];
        $cursor = $start->copy();
        $step = $granularity === 'month' ? 'month' : ($granularity === 'hour' ? 'hour' : 'day');
        $maxPoints = $granularity === 'month' ? 12 : ($granularity === 'hour' ? 24 : 31);
        $points = 0;

        while ($cursor->lte($end) && $points < $maxPoints) {
            $bucketStart = $cursor->copy();
            $bucketEnd = match ($step) {
                'month' => $cursor->copy()->endOfMonth(),
                'hour' => $cursor->copy()->endOfHour(),
                default => $cursor->copy()->endOfDay(),
            };
            if ($bucketEnd->gt($end)) {
                $bucketEnd = $end->copy();
            }

            $accomRev = (int) FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyIds, $selectedPropertyId) {
                $q->where('tenant_id', $tenantId);
                if ($selectedPropertyId) {
                    $q->where('property_id', $selectedPropertyId);
                } else {
                    $q->whereIn('property_id', $propertyIds);
                }
            })
                ->where('line_type', 'room')
                ->whereBetween('created_at', [$bucketStart, $bucketEnd])
                ->sum('amount_minor');

            $posRev = (int) PosOrder::where('tenant_id', $tenantId)
                ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
                ->where('payment_status', 'paid')
                ->where('payment_method', '!=', 'room_folio')
                ->whereBetween('created_at', [$bucketStart, $bucketEnd])
                ->sum('total_minor');

            $trend[] = [
                'label' => $step === 'month' ? $cursor->format('M') : ($step === 'hour' ? $cursor->format('H:00') : $cursor->format('d M')),
                'accommodation_minor' => $accomRev,
                'pos_minor' => $posRev,
                'total_minor' => $accomRev + $posRev,
            ];

            $cursor = match ($step) {
                'month' => $cursor->copy()->addMonth()->startOfMonth(),
                'hour' => $cursor->copy()->addHour(),
                default => $cursor->copy()->addDay()->startOfDay(),
            };
            $points++;
        }

        return $trend;
    }

    /**
     * Compute departmental yield from actual FolioLine charges and POS outlets.
     */
    protected function computeDepartmentYield(string $tenantId, $propertyIds, ?string $selectedPropertyId, Carbon $start, Carbon $end): array
    {
        $departmentsMap = [];

        // 1. Folio charges grouped by line_type (Rooms, Laundry, Conference, Tour, Spa, etc.)
        $folioLines = FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyIds, $selectedPropertyId) {
            $q->where('tenant_id', $tenantId);
            if ($selectedPropertyId) {
                $q->where('property_id', $selectedPropertyId);
            } else {
                $q->whereIn('property_id', $propertyIds);
            }
        })
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('line_type', ['discount', 'refund'])
            ->selectRaw('line_type, COUNT(*) as orders_count, SUM(amount_minor) as revenue_minor')
            ->groupBy('line_type')
            ->get();

        foreach ($folioLines as $line) {
            $name = match ($line->line_type) {
                'room' => 'Hotel & Lodging',
                'restaurant' => 'Restaurant Dining',
                'bar' => 'Bar & Beverage',
                'laundry' => 'Laundry Services',
                'conference' => 'Conference & Banquets',
                'tour' => 'Tours & Safari',
                'spa' => 'Spa & Wellness',
                'grocery' => 'Mini Market & Retail',
                default => ucfirst(str_replace('_', ' ', $line->line_type)),
            };

            $departmentsMap[$name] = [
                'name' => $name,
                'orders' => (int) $line->orders_count,
                'revenue_minor' => (int) $line->revenue_minor,
            ];
        }

        // 2. Direct POS orders grouped by outlet_type
        $posOutlets = PosOrder::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->where('payment_status', 'paid')
            ->where('payment_method', '!=', 'room_folio')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('outlet_type, COUNT(*) as orders_count, SUM(total_minor) as revenue_minor')
            ->groupBy('outlet_type')
            ->get();

        foreach ($posOutlets as $pos) {
            $name = match ($pos->outlet_type) {
                'restaurant' => 'Restaurant Dining',
                'bar' => 'Bar & Beverage',
                'grocery' => 'Mini Market & Retail',
                default => ucfirst((string) $pos->outlet_type),
            };

            if (isset($departmentsMap[$name])) {
                $departmentsMap[$name]['orders'] += (int) $pos->orders_count;
                $departmentsMap[$name]['revenue_minor'] += (int) $pos->revenue_minor;
            } else {
                $departmentsMap[$name] = [
                    'name' => $name,
                    'orders' => (int) $pos->orders_count,
                    'revenue_minor' => (int) $pos->revenue_minor,
                ];
            }
        }

        uasort($departmentsMap, fn ($a, $b) => $b['revenue_minor'] <=> $a['revenue_minor']);

        return array_values($departmentsMap);
    }

    /**
     * Compute collections by payment method.
     */
    protected function computePaymentsByMethod(string $tenantId, ?string $selectedPropertyId, Carbon $start, Carbon $end): array
    {
        $paymentsByMethod = [];

        // Folio payments
        Payment::whereHas('folio', function ($q) use ($tenantId, $selectedPropertyId) {
            $q->where('tenant_id', $tenantId);
            if ($selectedPropertyId) {
                $q->where('property_id', $selectedPropertyId);
            }
        })
            ->where('status', 'confirmed')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('payment_method, sum(amount_minor) as total_amount, count(*) as tx_count')
            ->groupBy('payment_method')
            ->get()
            ->each(function ($row) use (&$paymentsByMethod) {
                $method = $row->payment_method ?: 'cash';
                $paymentsByMethod[$method] = [
                    'method' => $method,
                    'total_minor' => (int) $row->total_amount,
                    'count' => (int) $row->tx_count,
                ];
            });

        // Direct POS orders
        PosOrder::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId))
            ->where('payment_status', 'paid')
            ->where('payment_method', '!=', 'room_folio')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('payment_method, sum(total_minor) as total_amount, count(*) as tx_count')
            ->groupBy('payment_method')
            ->get()
            ->each(function ($row) use (&$paymentsByMethod) {
                $method = $row->payment_method ?: 'cash';
                $paymentsByMethod[$method] ??= ['method' => $method, 'total_minor' => 0, 'count' => 0];
                $paymentsByMethod[$method]['total_minor'] += (int) $row->total_amount;
                $paymentsByMethod[$method]['count'] += (int) $row->tx_count;
            });

        uasort($paymentsByMethod, fn ($a, $b) => $b['total_minor'] <=> $a['total_minor']);

        return array_values($paymentsByMethod);
    }

    /**
     * Get recent transactions for the audit trail.
     */
    protected function getRecentTransactions(string $tenantId, ?string $selectedPropertyId, int $limit = 10): array
    {
        $payments = Payment::with(['folio.property', 'folio.reservation.guest'])
            ->whereHas('folio', function ($q) use ($tenantId, $selectedPropertyId) {
                $q->where('tenant_id', $tenantId);
                if ($selectedPropertyId) {
                    $q->where('property_id', $selectedPropertyId);
                }
            })
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'type' => 'payment',
                'reference' => 'PAY-'.substr($p->id, 0, 8),
                'description' => 'Guest Settlement ('.$p->payment_method.')',
                'property_name' => $p->folio?->property?->name ?? 'Main Lodge',
                'guest_name' => $p->folio?->reservation?->guest?->full_name ?? 'Guest',
                'amount_minor' => (int) $p->amount_minor,
                'payment_method' => $p->payment_method,
                'status' => $p->status,
                'date' => $p->created_at->format('Y-m-d H:i'),
            ]);

        return $payments->toArray();
    }

    /**
     * Get recent bookings for the operational overview.
     */
    protected function getRecentBookings(string $tenantId, $propertyIds, int $limit = 8): array
    {
        return Reservation::where('tenant_id', $tenantId)
            ->whereIn('property_id', $propertyIds)
            ->with(['guest', 'property'])
            ->latest()
            ->take($limit)
            ->get()
            ->map(fn ($res) => [
                'id' => $res->id,
                'ref_no' => $res->ref_no,
                'guest_name' => $res->guest?->full_name ?? 'Guest',
                'property_name' => $res->property?->name ?? 'Lodge',
                'check_in' => $res->check_in,
                'check_out' => $res->check_out,
                'status' => $res->status,
                'total_amount_minor' => (int) $res->total_amount_minor,
                'created_at' => $res->created_at->format('Y-m-d H:i'),
            ])
            ->toArray();
    }

    /**
     * Get outstanding folios for the receivables watchlist.
     */
    protected function getOutstandingFolios(string $tenantId, ?string $selectedPropertyId, int $limit = 10): array
    {
        return Folio::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId))
            ->where('status', 'open')
            ->where('balance_minor', '>', 0)
            ->with(['property:id,name', 'reservation.guest'])
            ->orderBy('balance_minor', 'desc')
            ->take($limit)
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'folio_number' => $f->folio_number ?? 'FOL-'.substr($f->id, 0, 8),
                'property_name' => $f->property?->name ?? 'Lodge',
                'guest_name' => $f->reservation?->guest?->full_name ?? 'Guest',
                'charges_minor' => (int) $f->total_charges_minor,
                'payments_minor' => (int) $f->total_payments_minor,
                'balance_minor' => (int) $f->balance_minor,
                'created_at' => $f->created_at->format('Y-m-d'),
            ])
            ->toArray();
    }

    /**
     * Loss prevention discount watchlist.
     */
    protected function getDiscountsWatchlist(string $tenantId, int $limit = 15): array
    {
        return FolioLine::whereHas('folio', fn ($q) => $q->where('tenant_id', $tenantId))
            ->where(function ($q) {
                $q->where('line_type', 'discount')
                    ->orWhere('amount_minor', '<', 0)
                    ->orWhere('description', 'like', '%discount%')
                    ->orWhere('description', 'like', '%punguzo%');
            })
            ->with(['folio.reservation.guest', 'folio.property'])
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->map(fn ($line) => [
                'id' => $line->id,
                'date' => $line->created_at->format('Y-m-d H:i'),
                'property_name' => $line->folio?->property?->name ?? 'Main Lodge',
                'description' => $line->description,
                'amount_minor' => abs((int) $line->amount_minor),
                'guest_name' => $line->folio?->reservation?->guest?->full_name ?? 'Guest',
                'folio_id' => $line->folio_id,
            ])
            ->toArray();
    }

    /**
     * Cancelled bookings watchlist.
     */
    protected function getCancelledBookings(string $tenantId, int $limit = 10): array
    {
        return Reservation::where('tenant_id', $tenantId)
            ->where('status', 'cancelled')
            ->with(['guest', 'property'])
            ->orderBy('updated_at', 'desc')
            ->take($limit)
            ->get()
            ->map(fn ($res) => [
                'id' => $res->id,
                'ref_no' => $res->ref_no,
                'date' => $res->updated_at->format('Y-m-d H:i'),
                'guest_name' => $res->guest?->full_name ?? 'Guest',
                'property_name' => $res->property?->name ?? 'Lodge',
                'total_amount_minor' => (int) $res->total_amount_minor,
                'notes' => $res->cancellation_reason ?: ($res->special_requests ?: 'No reason stated'),
            ])
            ->toArray();
    }

    /**
     * Compute operational alerts.
     */
    protected function computeAlerts(string $tenantId, $propertyIds, ?string $selectedPropertyId, $requisitions, Carbon $start, Carbon $end): array
    {
        $alerts = [];

        $pendingReq = $requisitions->where('status', 'pending_owner')->count();
        if ($pendingReq > 0) {
            $alerts[] = [
                'type' => 'approval',
                'severity' => 'warning',
                'message' => "{$pendingReq} expenditure requisition(s) awaiting your executive authorization.",
                'route' => 'owner.index?tab=approvals',
            ];
        }

        $oooRooms = Room::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->whereIn('status_hk', ['out_of_order', 'out_of_service'])
            ->count();
        if ($oooRooms > 0) {
            $alerts[] = [
                'type' => 'rooms',
                'severity' => 'warning',
                'message' => "{$oooRooms} room(s) are currently out of order or undergoing maintenance.",
                'route' => 'housekeeping.index',
            ];
        }

        $lowStock = PosItem::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId))
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->count();
        if ($lowStock > 0) {
            $alerts[] = [
                'type' => 'inventory',
                'severity' => 'info',
                'message' => "{$lowStock} inventory item(s) are at or below reorder threshold.",
                'route' => 'inventory.index',
            ];
        }

        $cancelledCount = Reservation::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->where('status', 'cancelled')
            ->whereBetween('updated_at', [$start, $end])
            ->count();
        $totalRes = Reservation::where('tenant_id', $tenantId)
            ->when($selectedPropertyId, fn ($q) => $q->where('property_id', $selectedPropertyId), fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->whereBetween('created_at', [$start, $end])
            ->count();
        if ($totalRes > 0 && ($cancelledCount / $totalRes) > 0.2) {
            $rate = round(($cancelledCount / $totalRes) * 100);
            $alerts[] = [
                'type' => 'cancellations',
                'severity' => 'warning',
                'message' => "Cancellation rate is high ({$rate}% of reservations cancelled in selected period).",
                'route' => 'reports.index',
            ];
        }

        return $alerts;
    }
}
