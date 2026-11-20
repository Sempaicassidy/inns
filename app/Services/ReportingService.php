<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Guest;
use App\Models\OwnerDrawing;
use App\Models\Payment;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Stay;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportingService
{
    /**
     * Resolve reporting date filter.
     *
     * @return array{0: Carbon, 1: Carbon, 2: string}
     */
    public function resolveDateFilter(Request $request): array
    {
        $range = $request->input('range', '30days');
        $now = Carbon::now();
        $end = $now->copy()->endOfDay();

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $start = Carbon::parse($request->input('start_date'))->startOfDay();
            $end = Carbon::parse($request->input('end_date'))->endOfDay();

            return [$start, $end, 'custom'];
        }

        $start = match ($range) {
            'today' => $now->copy()->startOfDay(),
            '7days', '7d' => $now->copy()->subDays(6)->startOfDay(),
            '30days', '30d' => $now->copy()->subDays(29)->startOfDay(),
            'this_month', 'month' => $now->copy()->startOfMonth(),
            'this_year', 'year' => $now->copy()->startOfYear(),
            'all' => Carbon::create(2020, 1, 1)->startOfDay(),
            default => $now->copy()->subDays(29)->startOfDay(),
        };

        return [$start, $end, $range];
    }

    /**
     * Generate report data based on report type and filters.
     *
     * @return array<string, mixed>
     */
    public function generateReport(string $tenantId, string $reportType, Request $request): array
    {
        [$start, $end, $range] = $this->resolveDateFilter($request);
        $propertyId = $request->input('property_id');
        $search = $request->input('search');
        $department = $request->input('department');
        $paymentMethod = $request->input('payment_method');
        $status = $request->input('status');
        $page = max(1, (int) $request->input('page', 1));
        $perPage = min(100, max(10, (int) $request->input('per_page', 25)));

        $methodName = 'report'.str_replace(' ', '', ucwords(str_replace(['_', '-'], ' ', $reportType)));

        if (! method_exists($this, $methodName)) {
            $methodName = 'reportSales';
            $reportType = 'sales';
        }

        $data = $this->$methodName($tenantId, $start, $end, $propertyId, [
            'search' => $search,
            'department' => $department,
            'payment_method' => $paymentMethod,
            'status' => $status,
            'page' => $page,
            'per_page' => $perPage,
        ]);

        return array_merge([
            'report_type' => $reportType,
            'range' => $range,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'property_id' => $propertyId,
            'search' => $search,
            'department' => $department,
            'payment_method' => $paymentMethod,
            'status' => $status,
            'page' => $page,
            'per_page' => $perPage,
        ], $data);
    }

    /**
     * 1. Sales Report: Combined transactions from Folio Charges and POS Orders.
     */
    public function reportSales(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $search = $filters['search'] ?? null;
        $status = $filters['status'] ?? null;
        $dept = $filters['department'] ?? null;
        $method = $filters['payment_method'] ?? null;

        // POS Orders
        $posQuery = PosOrder::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->whereBetween('created_at', [$start, $end])
            ->with(['room', 'items']);

        if ($search) {
            $posQuery->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('guest_name', 'like', "%{$search}%");
            });
        }
        if ($dept) {
            $posQuery->where('outlet_type', $dept);
        }
        if ($method) {
            $posQuery->where('payment_method', $method);
        }
        if ($status) {
            $posQuery->where('payment_status', $status);
        }

        $posOrders = $posQuery->latest()->get()->map(fn ($o) => [
            'id' => $o->id,
            'date' => $o->created_at->format('Y-m-d H:i'),
            'reference' => $o->order_number,
            'type' => 'POS '.ucfirst((string) $o->outlet_type),
            'department' => ucfirst((string) $o->outlet_type),
            'customer' => $o->guest_name ?: 'Walk-in',
            'room' => $o->room?->room_number ?? '—',
            'subtotal_minor' => (int) $o->subtotal_minor,
            'tax_minor' => (int) $o->tax_minor,
            'total_minor' => (int) $o->total_minor,
            'payment_status' => $o->payment_status,
            'payment_method' => $o->payment_method ?? 'cash',
        ]);

        // Folio Lines
        $folioLinesQuery = FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
            $q->where('tenant_id', $tenantId);
            if ($propertyId) {
                $q->where('property_id', $propertyId);
            }
        })
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('line_type', ['discount', 'refund'])
            ->with(['folio.reservation.guest', 'folio.property']);

        if ($search) {
            $folioLinesQuery->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhereHas('folio.reservation.guest', fn ($g) => $g->where('full_name', 'like', "%{$search}%"));
            });
        }
        if ($dept) {
            $folioLinesQuery->where('line_type', $dept);
        }

        $folioLines = $folioLinesQuery->latest()->get()->map(fn ($fl) => [
            'id' => $fl->id,
            'date' => $fl->created_at->format('Y-m-d H:i'),
            'reference' => $fl->folio?->folio_number ?? 'FOL-'.substr($fl->folio_id, 0, 6),
            'type' => 'Folio Charge',
            'department' => ucfirst(str_replace('_', ' ', $fl->line_type)),
            'customer' => $fl->folio?->reservation?->guest?->full_name ?? 'Guest',
            'room' => '—',
            'subtotal_minor' => (int) ($fl->amount_minor - $fl->tax_minor),
            'tax_minor' => (int) $fl->tax_minor,
            'total_minor' => (int) $fl->amount_minor,
            'payment_status' => $fl->folio?->status === 'settled' ? 'paid' : 'folio_accrued',
            'payment_method' => 'room_folio',
        ]);

        $allSales = $posOrders->concat($folioLines)->sortByDesc('date')->values();
        $totalSalesMinor = (int) $allSales->sum('total_minor');
        $totalTaxMinor = (int) $allSales->sum('tax_minor');

        $paginated = $this->paginateCollection($allSales, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_transactions' => $allSales->count(),
                'total_sales_minor' => $totalSalesMinor,
                'total_tax_minor' => $totalTaxMinor,
                'net_sales_minor' => $totalSalesMinor - $totalTaxMinor,
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * 2. Revenue Report: Recognized revenue by date, branch, and stream.
     */
    public function reportRevenue(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $folioLines = FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
            $q->where('tenant_id', $tenantId);
            if ($propertyId) {
                $q->where('property_id', $propertyId);
            }
        })
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('line_type', ['discount', 'refund'])
            ->with('folio.property:id,name')
            ->get();

        $posOrders = PosOrder::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('payment_status', 'paid')
            ->where('payment_method', '!=', 'room_folio')
            ->whereBetween('created_at', [$start, $end])
            ->with('property:id,name')
            ->get();

        $byDate = [];

        foreach ($folioLines as $fl) {
            $date = $fl->created_at->format('Y-m-d');
            $byDate[$date] ??= ['date' => $date, 'room_minor' => 0, 'fb_minor' => 0, 'other_minor' => 0, 'total_minor' => 0];
            if ($fl->line_type === 'room') {
                $byDate[$date]['room_minor'] += (int) $fl->amount_minor;
            } elseif (in_array($fl->line_type, ['restaurant', 'bar'])) {
                $byDate[$date]['fb_minor'] += (int) $fl->amount_minor;
            } else {
                $byDate[$date]['other_minor'] += (int) $fl->amount_minor;
            }
            $byDate[$date]['total_minor'] += (int) $fl->amount_minor;
        }

        foreach ($posOrders as $po) {
            $date = $po->created_at->format('Y-m-d');
            $byDate[$date] ??= ['date' => $date, 'room_minor' => 0, 'fb_minor' => 0, 'other_minor' => 0, 'total_minor' => 0];
            $byDate[$date]['fb_minor'] += (int) $po->total_minor;
            $byDate[$date]['total_minor'] += (int) $po->total_minor;
        }

        krsort($byDate);
        $rows = collect(array_values($byDate));

        $totalRoom = $rows->sum('room_minor');
        $totalFb = $rows->sum('fb_minor');
        $totalOther = $rows->sum('other_minor');
        $totalRevenue = $rows->sum('total_minor');

        $paginated = $this->paginateCollection($rows, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_revenue_minor' => $totalRevenue,
                'room_revenue_minor' => $totalRoom,
                'fb_revenue_minor' => $totalFb,
                'other_revenue_minor' => $totalOther,
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * 3. Expense Report: Operational expenditures with category & vendor breakdowns.
     */
    public function reportExpense(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $search = $filters['search'] ?? null;
        $category = $filters['department'] ?? null;
        $status = $filters['status'] ?? null;

        $query = Expense::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where(function ($q) use ($start, $end) {
                $q->whereDate('expense_date', '>=', $start->toDateString())
                    ->whereDate('expense_date', '<=', $end->toDateString())
                    ->orWhereBetween('created_at', [$start, $end]);
            })
            ->with(['property:id,name', 'creator:id,name']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('expense_number', 'like', "%{$search}%")
                    ->orWhere('vendor_name', 'like', "%{$search}%");
            });
        }
        if ($category) {
            $query->where('category', $category);
        }
        if ($status) {
            $query->where('status', $status);
        } else {
            $query->where('status', '!=', 'cancelled');
        }

        $allExpenses = $query->orderBy('expense_date', 'desc')->get()->map(fn ($e) => [
            'id' => $e->id,
            'date' => $e->expense_date,
            'expense_number' => $e->expense_number ?? 'EXP-'.substr($e->id, 0, 6),
            'title' => $e->title,
            'category' => ucfirst((string) $e->category),
            'vendor' => $e->vendor_name ?: 'Internal / Petty Cash',
            'property_name' => $e->property?->name ?? 'All Properties',
            'payment_method' => $e->payment_method ?: 'cash',
            'amount_minor' => (int) $e->amount_minor,
            'status' => $e->status,
        ]);

        $totalExpensesMinor = (int) $allExpenses->sum('amount_minor');

        $byCategory = $allExpenses->groupBy('category')->map(fn ($list, $cat) => [
            'category' => $cat,
            'total_minor' => (int) $list->sum('amount_minor'),
            'count' => $list->count(),
        ])->values()->sortByDesc('total_minor')->values();

        $paginated = $this->paginateCollection($allExpenses, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_expenses_minor' => $totalExpensesMinor,
                'count' => $allExpenses->count(),
                'by_category' => $byCategory,
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * 4. Profit & Loss Report: Full Income Statement.
     */
    public function reportProfitLoss(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        // 1. Revenue breakdown
        $folioLines = FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
            $q->where('tenant_id', $tenantId);
            if ($propertyId) {
                $q->where('property_id', $propertyId);
            }
        })
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('line_type', ['discount', 'refund'])
            ->selectRaw('line_type, SUM(amount_minor) as total_amount, COUNT(*) as count')
            ->groupBy('line_type')
            ->get();

        $roomRev = 0;
        $restaurantRev = 0;
        $ancillaryRev = 0;

        foreach ($folioLines as $fl) {
            if ($fl->line_type === 'room') {
                $roomRev += (int) $fl->total_amount;
            } elseif (in_array($fl->line_type, ['restaurant', 'bar'])) {
                $restaurantRev += (int) $fl->total_amount;
            } else {
                $ancillaryRev += (int) $fl->total_amount;
            }
        }

        $posDirect = (int) PosOrder::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('payment_status', 'paid')
            ->where('payment_method', '!=', 'room_folio')
            ->whereBetween('created_at', [$start, $end])
            ->sum('total_minor');

        $restaurantRev += $posDirect;
        $totalRevenueMinor = $roomRev + $restaurantRev + $ancillaryRev;

        // 2. Expenses breakdown
        $expenses = Expense::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('status', '!=', 'cancelled')
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('category, SUM(amount_minor) as total_amount, COUNT(*) as count')
            ->groupBy('category')
            ->get()
            ->map(fn ($e) => [
                'category' => ucfirst((string) $e->category),
                'amount_minor' => (int) $e->total_amount,
                'count' => (int) $e->count,
            ]);

        $totalExpensesMinor = (int) $expenses->sum('amount_minor');
        $gopMinor = $totalRevenueMinor - $totalExpensesMinor;
        $gopMargin = $totalRevenueMinor > 0 ? round(($gopMinor / $totalRevenueMinor) * 100, 1) : 0;

        $revenueLines = [
            ['stream' => 'Accommodation & Rooms', 'amount_minor' => $roomRev, 'share' => $totalRevenueMinor > 0 ? round(($roomRev / $totalRevenueMinor) * 100, 1) : 0],
            ['stream' => 'Food, Beverage & Bar (F&B)', 'amount_minor' => $restaurantRev, 'share' => $totalRevenueMinor > 0 ? round(($restaurantRev / $totalRevenueMinor) * 100, 1) : 0],
            ['stream' => 'Ancillary Services (Laundry, Events, Tours)', 'amount_minor' => $ancillaryRev, 'share' => $totalRevenueMinor > 0 ? round(($ancillaryRev / $totalRevenueMinor) * 100, 1) : 0],
        ];

        return [
            'summary' => [
                'total_revenue_minor' => $totalRevenueMinor,
                'total_expenses_minor' => $totalExpensesMinor,
                'gross_operating_profit_minor' => $gopMinor,
                'gop_margin_percent' => $gopMargin,
            ],
            'revenue_breakdown' => $revenueLines,
            'expense_breakdown' => $expenses->values()->toArray(),
            'items' => array_merge(
                array_map(fn ($r) => ['type' => 'Revenue', 'item' => $r['stream'], 'amount_minor' => $r['amount_minor']], $revenueLines),
                $expenses->map(fn ($e) => ['type' => 'Expense', 'item' => $e['category'], 'amount_minor' => -$e['amount_minor']])->toArray()
            ),
            'pagination' => ['total' => count($revenueLines) + $expenses->count(), 'page' => 1, 'per_page' => 50, 'last_page' => 1],
        ];
    }

    /**
     * 5. Booking Report: Reservations with statuses, nights, guest names.
     */
    public function reportBooking(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $search = $filters['search'] ?? null;
        $status = $filters['status'] ?? null;

        $query = Reservation::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->whereBetween('created_at', [$start, $end])
            ->with(['guest', 'property:id,name', 'rooms.roomType']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('ref_no', 'like', "%{$search}%")
                    ->orWhereHas('guest', fn ($g) => $g->where('full_name', 'like', "%{$search}%"));
            });
        }
        if ($status) {
            $query->where('status', $status);
        }

        $bookings = $query->latest()->get()->map(function ($res) {
            $roomNames = $res->rooms->pluck('room_number')->filter()->join(', ');
            $nights = max(1, Carbon::parse($res->check_in)->diffInDays(Carbon::parse($res->check_out)));

            return [
                'id' => $res->id,
                'ref_no' => $res->ref_no,
                'guest_name' => $res->guest?->full_name ?? 'Guest',
                'property_name' => $res->property?->name ?? 'Lodge',
                'rooms' => $roomNames ?: 'Assigned on arrival',
                'check_in' => $res->check_in,
                'check_out' => $res->check_out,
                'nights' => $nights,
                'adults' => $res->adults ?? 1,
                'status' => $res->status,
                'total_amount_minor' => (int) $res->total_amount_minor,
                'source' => $res->source ?? 'direct',
                'created_at' => $res->created_at->format('Y-m-d H:i'),
            ];
        });

        $paginated = $this->paginateCollection($bookings, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_bookings' => $bookings->count(),
                'confirmed' => $bookings->where('status', 'confirmed')->count(),
                'pending' => $bookings->whereIn('status', ['tentative', 'pending'])->count(),
                'cancelled' => $bookings->where('status', 'cancelled')->count(),
                'total_value_minor' => (int) $bookings->sum('total_amount_minor'),
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * 6. Room Occupancy Report: Daily occupancy, ADR, RevPAR.
     */
    public function reportRoomOccupancy(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $allRooms = Room::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('is_active', true)
            ->get();

        $totalRooms = $allRooms->count();
        $days = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $dateStr = $cursor->toDateString();

            // Active stays on this date
            $staysCount = Stay::where('tenant_id', $tenantId)
                ->when($propertyId, fn ($q) => $q->whereHas('room', fn ($r) => $r->where('property_id', $propertyId)))
                ->whereDate('checked_in_at', '<=', $dateStr)
                ->where(function ($q) use ($dateStr) {
                    $q->whereNull('checked_out_at')
                        ->orWhereDate('checked_out_at', '>', $dateStr);
                })
                ->count();

            // Room revenue accrued on this date
            $roomRevenue = (int) FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
                $q->where('tenant_id', $tenantId);
                if ($propertyId) {
                    $q->where('property_id', $propertyId);
                }
            })
                ->where('line_type', 'room')
                ->whereDate('created_at', $dateStr)
                ->sum('amount_minor');

            $occupiedUnits = min($totalRooms, $staysCount);
            $vacantUnits = max(0, $totalRooms - $occupiedUnits);
            $occupancyRate = $totalRooms > 0 ? round(($occupiedUnits / $totalRooms) * 100, 1) : 0;
            $adr = $occupiedUnits > 0 ? (int) round($roomRevenue / $occupiedUnits) : 0;
            $revpar = $totalRooms > 0 ? (int) round($roomRevenue / $totalRooms) : 0;

            $days[] = [
                'date' => $dateStr,
                'day_name' => $cursor->format('D'),
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedUnits,
                'vacant_rooms' => $vacantUnits,
                'occupancy_rate' => $occupancyRate,
                'room_revenue_minor' => $roomRevenue,
                'adr_minor' => $adr,
                'revpar_minor' => $revpar,
            ];

            $cursor->addDay();
        }

        $rows = collect(array_reverse($days));
        $avgOccupancy = $rows->avg('occupancy_rate') ?? 0;
        $totalRoomRevenue = $rows->sum('room_revenue_minor');
        $totalOccupiedNights = $rows->sum('occupied_rooms');
        $overallAdr = $totalOccupiedNights > 0 ? (int) round($totalRoomRevenue / $totalOccupiedNights) : 0;
        $totalPossibleNights = max(1, $totalRooms * count($days));
        $overallRevpar = (int) round($totalRoomRevenue / $totalPossibleNights);

        $paginated = $this->paginateCollection($rows, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_active_rooms' => $totalRooms,
                'average_occupancy_percent' => round($avgOccupancy, 1),
                'overall_adr_minor' => $overallAdr,
                'overall_revpar_minor' => $overallRevpar,
                'total_room_revenue_minor' => $totalRoomRevenue,
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * 7. Customer Report: Guest lifetime spend, stays, balances.
     */
    public function reportCustomer(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $search = $filters['search'] ?? null;

        $query = Guest::where('tenant_id', $tenantId)
            ->with(['stays', 'reservations.folios']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->latest()->get()->map(function ($g) {
            $totalStays = $g->stays->count();
            $totalSpend = 0;
            $balance = 0;

            foreach ($g->reservations as $res) {
                foreach ($res->folios as $f) {
                    $totalSpend += (int) $f->total_charges_minor;
                    $balance += (int) $f->balance_minor;
                }
            }

            return [
                'id' => $g->id,
                'name' => $g->full_name ?: ($g->first_name.' '.$g->last_name),
                'email' => $g->email ?: '—',
                'phone' => $g->phone ?: '—',
                'vip_level' => $g->vip_level ?: 'standard',
                'is_resident' => (bool) $g->is_resident,
                'total_stays' => $totalStays,
                'total_spend_minor' => $totalSpend,
                'outstanding_balance_minor' => max(0, $balance),
                'created_at' => $g->created_at->format('Y-m-d'),
            ];
        });

        $paginated = $this->paginateCollection($customers, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_customers' => $customers->count(),
                'total_spend_minor' => (int) $customers->sum('total_spend_minor'),
                'total_outstanding_minor' => (int) $customers->sum('outstanding_balance_minor'),
                'vip_count' => $customers->where('vip_level', '!=', 'standard')->count(),
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * 8. Payment Report: Tender collections & settlements.
     */
    public function reportPayment(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $search = $filters['search'] ?? null;
        $method = $filters['payment_method'] ?? null;
        $status = $filters['status'] ?? null;

        $paymentsQuery = Payment::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
            $q->where('tenant_id', $tenantId);
            if ($propertyId) {
                $q->where('property_id', $propertyId);
            }
        })
            ->whereBetween('created_at', [$start, $end])
            ->with(['folio.reservation.guest', 'folio.property', 'receiver:id,name']);

        if ($method) {
            $paymentsQuery->where('payment_method', $method);
        }
        if ($status) {
            $paymentsQuery->where('status', $status);
        }

        $payments = $paymentsQuery->latest()->get()->map(fn ($p) => [
            'id' => $p->id,
            'date' => $p->created_at->format('Y-m-d H:i'),
            'reference' => 'PAY-'.substr($p->id, 0, 8),
            'source' => 'Folio Settlement ('.$p->folio?->folio_number.')',
            'customer' => $p->folio?->reservation?->guest?->full_name ?? 'Guest',
            'property_name' => $p->folio?->property?->name ?? 'Lodge',
            'payment_method' => $p->payment_method ?: 'cash',
            'amount_minor' => (int) $p->amount_minor,
            'cashier' => $p->receiver?->name ?? 'Front Desk',
            'status' => $p->status,
        ]);

        // Direct POS receipts
        $posQuery = PosOrder::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('payment_status', 'paid')
            ->where('payment_method', '!=', 'room_folio')
            ->whereBetween('created_at', [$start, $end])
            ->with(['property:id,name', 'user:id,name']);

        if ($method) {
            $posQuery->where('payment_method', $method);
        }

        $posReceipts = $posQuery->latest()->get()->map(fn ($po) => [
            'id' => $po->id,
            'date' => $po->created_at->format('Y-m-d H:i'),
            'reference' => $po->order_number,
            'source' => 'Direct POS Sale ('.ucfirst((string) $po->outlet_type).')',
            'customer' => $po->guest_name ?: 'Walk-in Guest',
            'property_name' => $po->property?->name ?? 'Main Lodge',
            'payment_method' => $po->payment_method ?: 'cash',
            'amount_minor' => (int) $po->total_minor,
            'cashier' => $po->user?->name ?? 'Cashier',
            'status' => 'confirmed',
        ]);

        $allPayments = $payments->concat($posReceipts)->sortByDesc('date')->values();
        $totalCollected = (int) $allPayments->sum('amount_minor');

        $byMethod = $allPayments->groupBy('payment_method')->map(fn ($list, $m) => [
            'method' => $m,
            'total_minor' => (int) $list->sum('amount_minor'),
            'count' => $list->count(),
        ])->values()->sortByDesc('total_minor')->values();

        $paginated = $this->paginateCollection($allPayments, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_collected_minor' => $totalCollected,
                'count' => $allPayments->count(),
                'by_method' => $byMethod,
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * 9. Department Performance Report: Scorecard for each hospitality center.
     */
    public function reportDepartmentPerformance(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $departments = [
            'room' => ['name' => 'Rooms & Accommodation', 'revenue_minor' => 0, 'orders' => 0, 'expenses_minor' => 0],
            'restaurant' => ['name' => 'Restaurant & Dining', 'revenue_minor' => 0, 'orders' => 0, 'expenses_minor' => 0],
            'bar' => ['name' => 'Bar & Beverage', 'revenue_minor' => 0, 'orders' => 0, 'expenses_minor' => 0],
            'laundry' => ['name' => 'Laundry Services', 'revenue_minor' => 0, 'orders' => 0, 'expenses_minor' => 0],
            'conference' => ['name' => 'Conference & Banquets', 'revenue_minor' => 0, 'orders' => 0, 'expenses_minor' => 0],
            'tour' => ['name' => 'Tours & Safari', 'revenue_minor' => 0, 'orders' => 0, 'expenses_minor' => 0],
            'grocery' => ['name' => 'Mini Market & Retail', 'revenue_minor' => 0, 'orders' => 0, 'expenses_minor' => 0],
            'other' => ['name' => 'Other Ancillary', 'revenue_minor' => 0, 'orders' => 0, 'expenses_minor' => 0],
        ];

        // Folio Lines
        $folioLines = FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
            $q->where('tenant_id', $tenantId);
            if ($propertyId) {
                $q->where('property_id', $propertyId);
            }
        })
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('line_type', ['discount', 'refund'])
            ->selectRaw('line_type, count(*) as count, sum(amount_minor) as total')
            ->groupBy('line_type')
            ->get();

        foreach ($folioLines as $fl) {
            $key = array_key_exists($fl->line_type, $departments) ? $fl->line_type : 'other';
            $departments[$key]['revenue_minor'] += (int) $fl->total;
            $departments[$key]['orders'] += (int) $fl->count;
        }

        // POS Orders
        $pos = PosOrder::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('payment_status', 'paid')
            ->where('payment_method', '!=', 'room_folio')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('outlet_type, count(*) as count, sum(total_minor) as total')
            ->groupBy('outlet_type')
            ->get();

        foreach ($pos as $p) {
            $key = array_key_exists($p->outlet_type, $departments) ? $p->outlet_type : 'restaurant';
            $departments[$key]['revenue_minor'] += (int) $p->total;
            $departments[$key]['orders'] += (int) $p->count;
        }

        // Allocate expenses where category matches
        $expenses = Expense::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('status', '!=', 'cancelled')
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->get();

        foreach ($expenses as $e) {
            $cat = strtolower((string) $e->category);
            if (str_contains($cat, 'kitchen') || str_contains($cat, 'food') || str_contains($cat, 'restaurant')) {
                $departments['restaurant']['expenses_minor'] += (int) $e->amount_minor;
            } elseif (str_contains($cat, 'beverage') || str_contains($cat, 'bar')) {
                $departments['bar']['expenses_minor'] += (int) $e->amount_minor;
            } elseif (str_contains($cat, 'housekeeping') || str_contains($cat, 'linen') || str_contains($cat, 'room')) {
                $departments['room']['expenses_minor'] += (int) $e->amount_minor;
            } else {
                $departments['other']['expenses_minor'] += (int) $e->amount_minor;
            }
        }

        $items = collect($departments)->filter(fn ($d) => $d['revenue_minor'] > 0 || $d['orders'] > 0 || $d['expenses_minor'] > 0)->map(function ($d) {
            $gop = $d['revenue_minor'] - $d['expenses_minor'];
            $margin = $d['revenue_minor'] > 0 ? round(($gop / $d['revenue_minor']) * 100, 1) : 0;

            return array_merge($d, [
                'net_yield_minor' => $gop,
                'margin_percent' => $margin,
            ]);
        })->values()->sortByDesc('revenue_minor')->values();

        return [
            'summary' => [
                'departments_count' => $items->count(),
                'total_revenue_minor' => (int) $items->sum('revenue_minor'),
                'total_expenses_minor' => (int) $items->sum('expenses_minor'),
                'net_profit_minor' => (int) $items->sum('net_yield_minor'),
            ],
            'items' => $items->toArray(),
            'pagination' => ['total' => $items->count(), 'page' => 1, 'per_page' => 50, 'last_page' => 1],
        ];
    }

    /**
     * 10. Staff Performance Report: Activity, collections, reservations.
     */
    public function reportStaffPerformance(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $users = User::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('status', 'active')
            ->with('property:id,name')
            ->get();

        $rows = $users->map(function ($u) use ($start, $end) {
            $paymentsHandled = (int) Payment::where('received_by', $u->id)
                ->whereBetween('created_at', [$start, $end])
                ->sum('amount_minor');

            $posHandled = (int) PosOrder::where('user_id', $u->id)
                ->where('payment_status', 'paid')
                ->whereBetween('created_at', [$start, $end])
                ->sum('total_minor');

            $posCount = PosOrder::where('user_id', $u->id)
                ->whereBetween('created_at', [$start, $end])
                ->count();

            $expensesSubmitted = (int) Expense::where('created_by', $u->id)
                ->whereBetween('created_at', [$start, $end])
                ->sum('amount_minor');

            return [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'role' => ucfirst(str_replace('_', ' ', $u->role)),
                'property_name' => $u->property?->name ?? 'All Properties',
                'orders_count' => $posCount,
                'payments_collected_minor' => $paymentsHandled + $posHandled,
                'expenses_submitted_minor' => $expensesSubmitted,
            ];
        })->sortByDesc('payments_collected_minor')->values();

        $paginated = $this->paginateCollection($rows, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_staff' => $users->count(),
                'total_collected_minor' => (int) $rows->sum('payments_collected_minor'),
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * 11. Cash Flow Report: Inflows vs Outflows.
     */
    public function reportCashFlow(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        // Inflows: Folio payments + direct POS payments + capital injections
        $folioPayments = (int) Payment::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
            $q->where('tenant_id', $tenantId);
            if ($propertyId) {
                $q->where('property_id', $propertyId);
            }
        })
            ->where('status', 'confirmed')
            ->whereBetween('created_at', [$start, $end])
            ->sum('amount_minor');

        $posDirect = (int) PosOrder::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('payment_status', 'paid')
            ->where('payment_method', '!=', 'room_folio')
            ->whereBetween('created_at', [$start, $end])
            ->sum('total_minor');

        $capitalInjections = (int) OwnerDrawing::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('drawing_type', 'capital_injection')
            ->whereBetween('drawing_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount_minor');

        $totalInflows = $folioPayments + $posDirect + $capitalInjections;

        // Outflows: Expenses paid + Dividends/Drawings + Refunds
        $expenses = (int) Expense::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('status', '!=', 'cancelled')
            ->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount_minor');

        $drawings = (int) OwnerDrawing::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('drawing_type', 'dividend')
            ->whereBetween('drawing_date', [$start->toDateString(), $end->toDateString()])
            ->sum('amount_minor');

        $refunds = (int) Payment::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
            $q->where('tenant_id', $tenantId);
            if ($propertyId) {
                $q->where('property_id', $propertyId);
            }
        })
            ->where(function ($q) {
                $q->where('status', 'refunded')
                    ->orWhere('amount_minor', '<', 0);
            })
            ->whereBetween('created_at', [$start, $end])
            ->sum('amount_minor');
        $refunds = abs($refunds);

        $totalOutflows = $expenses + $drawings + $refunds;
        $netCashFlow = $totalInflows - $totalOutflows;

        $inflowLines = [
            ['item' => 'Accommodation & Guest Folio Receipts', 'category' => 'Operating', 'amount_minor' => $folioPayments],
            ['item' => 'Point of Sale (Restaurant, Bar & Retail)', 'category' => 'Operating', 'amount_minor' => $posDirect],
            ['item' => 'Owner Capital Injections', 'category' => 'Financing', 'amount_minor' => $capitalInjections],
        ];

        $outflowLines = [
            ['item' => 'Operating Expenses & Procurement', 'category' => 'Operating', 'amount_minor' => $expenses],
            ['item' => 'Guest Refunds & Adjustments', 'category' => 'Operating', 'amount_minor' => $refunds],
            ['item' => 'Owner Profit Distributions / Dividends', 'category' => 'Financing', 'amount_minor' => $drawings],
        ];

        $items = array_merge(
            array_map(fn ($i) => ['type' => 'Inflow', 'item' => $i['item'], 'category' => $i['category'], 'amount_minor' => $i['amount_minor']], $inflowLines),
            array_map(fn ($o) => ['type' => 'Outflow', 'item' => $o['item'], 'category' => $o['category'], 'amount_minor' => -$o['amount_minor']], $outflowLines)
        );

        return [
            'summary' => [
                'total_inflows_minor' => $totalInflows,
                'total_outflows_minor' => $totalOutflows,
                'net_cash_flow_minor' => $netCashFlow,
            ],
            'inflows' => $inflowLines,
            'outflows' => $outflowLines,
            'items' => $items,
            'pagination' => ['total' => count($items), 'page' => 1, 'per_page' => 50, 'last_page' => 1],
        ];
    }

    /**
     * 12. Tax Report: VAT & Tourism levies collected.
     */
    public function reportTax(string $tenantId, Carbon $start, Carbon $end, ?string $propertyId, array $filters): array
    {
        $folioTaxQuery = FolioLine::whereHas('folio', function ($q) use ($tenantId, $propertyId) {
            $q->where('tenant_id', $tenantId);
            if ($propertyId) {
                $q->where('property_id', $propertyId);
            }
        })
            ->whereBetween('created_at', [$start, $end])
            ->whereNotIn('line_type', ['discount', 'refund']);

        $totalFolioCharges = (int) (clone $folioTaxQuery)->sum('amount_minor');
        $totalFolioTax = (int) (clone $folioTaxQuery)->sum('tax_minor');

        $posTaxQuery = PosOrder::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->where('payment_status', 'paid')
            ->whereBetween('created_at', [$start, $end]);

        $totalPosSales = (int) (clone $posTaxQuery)->sum('total_minor');
        $totalPosTax = (int) (clone $posTaxQuery)->sum('tax_minor');

        $totalTaxableRevenue = $totalFolioCharges + $totalPosSales;
        $totalTaxCollected = $totalFolioTax + $totalPosTax;

        // Daily breakdown
        $days = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $d = $cursor->toDateString();
            $dFolioTax = (int) (clone $folioTaxQuery)->whereDate('created_at', $d)->sum('tax_minor');
            $dFolioRev = (int) (clone $folioTaxQuery)->whereDate('created_at', $d)->sum('amount_minor');
            $dPosTax = (int) (clone $posTaxQuery)->whereDate('created_at', $d)->sum('tax_minor');
            $dPosRev = (int) (clone $posTaxQuery)->whereDate('created_at', $d)->sum('total_minor');

            if ($dFolioRev > 0 || $dPosRev > 0 || $dFolioTax > 0 || $dPosTax > 0) {
                $days[] = [
                    'date' => $d,
                    'gross_sales_minor' => $dFolioRev + $dPosRev,
                    'net_taxable_minor' => ($dFolioRev + $dPosRev) - ($dFolioTax + $dPosTax),
                    'vat_tax_minor' => $dFolioTax + $dPosTax,
                ];
            }
            $cursor->addDay();
        }

        $rows = collect(array_reverse($days));
        $paginated = $this->paginateCollection($rows, $filters['page'] ?? 1, $filters['per_page'] ?? 25);

        return [
            'summary' => [
                'total_taxable_minor' => $totalTaxableRevenue - $totalTaxCollected,
                'total_tax_collected_minor' => $totalTaxCollected,
                'gross_sales_with_tax_minor' => $totalTaxableRevenue,
            ],
            'items' => $paginated['items'],
            'pagination' => $paginated['meta'],
        ];
    }

    /**
     * Export report data as Excel-compatible CSV.
     */
    public function exportCsv(string $tenantId, string $reportType, Request $request): StreamedResponse
    {
        $reportData = $this->generateReport($tenantId, $reportType, $request);
        $items = $reportData['items'] ?? [];
        $fileName = "{$reportType}_report_{$reportData['start_date']}_{$reportData['end_date']}.csv";

        return response()->streamDownload(function () use ($items, $reportType, $reportData) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM so Excel opens with proper character encoding
            fwrite($handle, "\xEF\xBB\xBF");

            // Header banner
            fputcsv($handle, [strtoupper(str_replace('_', ' ', $reportType)).' REPORT']);
            fputcsv($handle, ['Period:', "{$reportData['start_date']} to {$reportData['end_date']}"]);
            fputcsv($handle, ['Generated At:', Carbon::now()->toDateTimeString()]);
            fputcsv($handle, []);

            if (empty($items)) {
                fputcsv($handle, ['No records found for the selected period.']);
                fclose($handle);

                return;
            }

            // Column Headers from first item
            $firstItem = (array) $items[0];
            $keys = array_keys($firstItem);
            $cleanHeaders = array_map(fn ($k) => ucwords(str_replace('_', ' ', $k)), $keys);
            fputcsv($handle, $cleanHeaders);

            // Data rows
            foreach ($items as $item) {
                $row = array_map(function ($val, $key) {
                    if (is_array($val)) {
                        return json_encode($val);
                    }
                    if (str_ends_with($key, '_minor') && is_numeric($val)) {
                        return number_format($val / 100, 2, '.', ',');
                    }

                    return (string) $val;
                }, (array) $item, array_keys((array) $item));

                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Helper to paginate a Collection.
     */
    protected function paginateCollection($items, int $page, int $perPage): array
    {
        $items = collect($items);
        $total = $items->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $currentPage = min($lastPage, max(1, $page));
        $slice = $items->slice(($currentPage - 1) * $perPage, $perPage)->values();

        return [
            'items' => $slice->toArray(),
            'meta' => [
                'total' => $total,
                'page' => $currentPage,
                'per_page' => $perPage,
                'last_page' => $lastPage,
            ],
        ];
    }
}
