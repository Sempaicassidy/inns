<?php

namespace App\Http\Controllers;

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
use App\Models\SystemNotification;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OwnerPortalController extends Controller
{
    /**
     * Display the Hotel Owner Executive Portal.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // Enforce Owner or SuperAdmin access
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to access the Owner Portal.');
        }

        $tenantId = $user->tenant_id;
        $tenant = Tenant::with('properties')->find($tenantId);

        if (! $tenant && ! $user->isSuperAdmin()) {
            abort(403, 'Tenant account not found.');
        }

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $today = $now->copy()->startOfDay();

        // 1. Properties / Multi-Branch Overview
        $propertiesQuery = Property::query();
        if ($tenantId) {
            $propertiesQuery->where('tenant_id', $tenantId);
        }
        $properties = $propertiesQuery->withCount(['rooms', 'reservations'])->get();

        $multiBranchData = $properties->map(function ($property) use ($startOfMonth, $today, $now) {
            $roomCount = Room::where('property_id', $property->id)->count();
            $occupiedRooms = Room::where('property_id', $property->id)->where('status_occupancy', 'occupied')->count();
            $occupancyRate = $roomCount > 0 ? round(($occupiedRooms / $roomCount) * 100, 1) : 0;

            // Monthly Revenue (Payments & Folio settlements)
            $monthRevMinor = (int) Payment::whereHas('folio', fn ($q) => $q->where('property_id', $property->id))
                ->where('created_at', '>=', $startOfMonth)
                ->sum('amount_minor');

            // Today Revenue
            $todayRevMinor = (int) Payment::whereHas('folio', fn ($q) => $q->where('property_id', $property->id))
                ->where('created_at', '>=', $today)
                ->sum('amount_minor');

            // Monthly Expenses
            $monthExpMinor = (int) Expense::where('property_id', $property->id)
                ->where('expense_date', '>=', $startOfMonth->toDateString())
                ->where('status', '!=', 'cancelled')
                ->sum('amount_minor');

            // Gross Operating Profit
            $gopMinor = $monthRevMinor - $monthExpMinor;
            $gopMargin = $monthRevMinor > 0 ? round(($gopMinor / $monthRevMinor) * 100, 1) : 0;

            // Target Progress %
            $targetMinor = $property->monthly_target_revenue_minor ?? 0;
            $targetProgress = $targetMinor > 0 ? round(($monthRevMinor / $targetMinor) * 100, 1) : 0;

            // Average Daily Rate (ADR) & RevPAR
            $occupiedNightsMonth = max(1, $occupiedRooms * $now->day);
            $adrMinor = $occupiedNightsMonth > 0 ? (int) round($monthRevMinor / $occupiedNightsMonth) : 0;
            $totalAvailableRoomNights = max(1, $roomCount * $now->day);
            $revparMinor = $totalAvailableRoomNights > 0 ? (int) round($monthRevMinor / $totalAvailableRoomNights) : 0;

            // General Manager for this property
            $manager = User::where('property_id', $property->id)
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
                'total_rooms' => $roomCount,
                'occupied_rooms' => $occupiedRooms,
                'occupancy_rate' => $occupancyRate,
                'month_revenue_minor' => $monthRevMinor,
                'today_revenue_minor' => $todayRevMinor,
                'month_expenses_minor' => $monthExpMinor,
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

        // 2. Consolidated Group Financial KPIs
        $groupMonthRevenueMinor = $multiBranchData->sum('month_revenue_minor');
        $groupTodayRevenueMinor = $multiBranchData->sum('today_revenue_minor');
        $groupMonthExpensesMinor = $multiBranchData->sum('month_expenses_minor');
        $groupGopMinor = $groupMonthRevenueMinor - $groupMonthExpensesMinor;
        $groupGopMargin = $groupMonthRevenueMinor > 0 ? round(($groupGopMinor / $groupMonthRevenueMinor) * 100, 1) : 0;

        $totalRoomsGroup = $multiBranchData->sum('total_rooms');
        $totalOccupiedGroup = $multiBranchData->sum('occupied_rooms');
        $groupOccupancyRate = $totalRoomsGroup > 0 ? round(($totalOccupiedGroup / $totalRoomsGroup) * 100, 1) : 0;

        $groupTargetMinor = $multiBranchData->sum('monthly_target_revenue_minor');
        $groupTargetProgress = $groupTargetMinor > 0 ? round(($groupMonthRevenueMinor / $groupTargetMinor) * 100, 1) : 0;

        // 3. Chain of Command: Requisitions & Approvals
        $requisitionsQuery = OwnerRequisition::query();
        if ($tenantId) {
            $requisitionsQuery->where('tenant_id', $tenantId);
        }
        $requisitions = $requisitionsQuery->with(['property:id,name,city', 'requester:id,name,email,username', 'approver:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        $pendingApprovalsCount = $requisitions->where('status', 'pending_owner')->count();

        // 4. Executive Directives to Managers
        $directivesQuery = OwnerDirective::query();
        if ($tenantId) {
            $directivesQuery->where('tenant_id', $tenantId);
        }
        $directives = $directivesQuery->with(['property:id,name,city', 'creator:id,name', 'acknowledgedBy:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        // 5. Financial Audit & Loss Prevention Watchlist
        // Discounts given across folios
        $discountsWatchlist = FolioLine::whereHas('folio', function ($q) use ($tenantId) {
            if ($tenantId) {
                $q->where('tenant_id', $tenantId);
            }
        })
            ->where(function ($q) {
                $q->where('line_type', 'discount')
                    ->orWhere('amount_minor', '<', 0)
                    ->orWhere('description', 'like', '%discount%')
                    ->orWhere('description', 'like', '%punguzo%');
            })
            ->with(['folio.reservation.guest', 'folio.property'])
            ->orderBy('created_at', 'desc')
            ->take(15)
            ->get()
            ->map(fn ($line) => [
                'id' => $line->id,
                'date' => $line->created_at->format('Y-m-d H:i'),
                'property_name' => $line->folio?->property?->name ?? 'Main Lodge',
                'description' => $line->description,
                'amount_minor' => abs((int) $line->amount_minor),
                'guest_name' => $line->folio?->reservation?->guest?->full_name ?? 'Guest',
                'folio_id' => $line->folio_id,
            ]);

        // Cancelled / Voided Reservations
        $cancelledBookings = Reservation::where('tenant_id', $tenantId)
            ->where('status', 'cancelled')
            ->with(['guest', 'property'])
            ->orderBy('updated_at', 'desc')
            ->take(10)
            ->get()
            ->map(fn ($res) => [
                'id' => $res->id,
                'ref_no' => $res->ref_no,
                'date' => $res->updated_at->format('Y-m-d H:i'),
                'guest_name' => $res->guest?->full_name ?? 'Guest',
                'property_name' => $res->property?->name ?? 'Lodge',
                'total_amount_minor' => (int) $res->total_amount_minor,
                'notes' => $res->cancellation_reason ?: ($res->special_requests ?: 'No reason stated'),
            ]);

        // 6. Owner Drawings & Capital Injections
        $drawingsQuery = OwnerDrawing::query();
        if ($tenantId) {
            $drawingsQuery->where('tenant_id', $tenantId);
        }
        $drawings = $drawingsQuery->with(['property:id,name', 'creator:id,name'])
            ->orderBy('drawing_date', 'desc')
            ->get();

        $totalDrawingsMinor = $drawings->where('drawing_type', 'dividend')->sum('amount_minor');
        $totalCapitalInjectedMinor = $drawings->where('drawing_type', 'capital_injection')->sum('amount_minor');

        // All General Managers list for direct directives
        $managersList = User::where('tenant_id', $tenantId)
            ->where(function ($q) {
                $q->where('role', 'general_manager')
                    ->orWhere('role', 'manager')
                    ->orWhereJsonContains('roles', 'general_manager');
            })
            ->with('property:id,name,city')
            ->select('id', 'name', 'email', 'phone', 'username', 'property_id', 'status')
            ->get();

        // 7. Analytics: period comparison, revenue trend, occupancy, departments, alerts
        $analytics = $this->buildOwnerAnalytics($request, $tenantId);

        return Inertia::render('Owner/Index', [
            'tenant' => $tenant,
            'tab' => $request->query('tab', 'overview'),
            'period' => $analytics['period'],
            'metrics' => [
                'group_month_revenue_minor' => $groupMonthRevenueMinor,
                'group_today_revenue_minor' => $groupTodayRevenueMinor,
                'group_month_expenses_minor' => $groupMonthExpensesMinor,
                'group_gop_minor' => $groupGopMinor,
                'group_gop_margin_percent' => $groupGopMargin,
                'group_occupancy_rate' => $groupOccupancyRate,
                'total_rooms_group' => $totalRoomsGroup,
                'total_occupied_group' => $totalOccupiedGroup,
                'group_target_minor' => $groupTargetMinor,
                'group_target_progress_percent' => $groupTargetProgress,
                'pending_approvals_count' => $pendingApprovalsCount,
                'active_directives_count' => $directives->where('status', 'active')->count(),
                'total_drawings_minor' => $totalDrawingsMinor,
                'total_capital_injected_minor' => $totalCapitalInjectedMinor,
            ],
            'multiBranchData' => $multiBranchData,
            'requisitions' => $requisitions,
            'directives' => $directives,
            'discountsWatchlist' => $discountsWatchlist,
            'cancelledBookings' => $cancelledBookings,
            'drawings' => $drawings,
            'managersList' => $managersList,
            'inspectingPropertyId' => session('owner_inspecting_property_id'),
            'analytics' => $analytics,
        ]);
    }

    /**
     * Store a new executive directive to General Managers.
     */
    public function storeDirective(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'directive_text' => 'required|string',
            'property_id' => 'nullable|uuid',
            'priority' => 'required|in:normal,high,urgent',
            'category' => 'required|in:operations,finance,policy,maintenance,hr',
            'target_deadline' => 'nullable|date',
        ]);

        OwnerDirective::create([
            'tenant_id' => $user->tenant_id,
            'property_id' => $validated['property_id'] ?: null,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'directive_text' => $validated['directive_text'],
            'priority' => $validated['priority'],
            'category' => $validated['category'],
            'target_deadline' => $validated['target_deadline'] ?: null,
            'status' => 'active',
        ]);

        // Broadcast notification to General Managers
        $mgrQuery = User::where('tenant_id', $user->tenant_id)
            ->where(function ($q) {
                $q->where('role', 'general_manager')
                    ->orWhere('role', 'manager')
                    ->orWhereJsonContains('roles', 'general_manager');
            });

        if (! empty($validated['property_id'])) {
            $mgrQuery->where('property_id', $validated['property_id']);
        }

        $managers = $mgrQuery->get();
        foreach ($managers as $mgr) {
            SystemNotification::create([
                'tenant_id' => $user->tenant_id,
                'user_id' => $mgr->id,
                'target_role' => 'general_manager',
                'title' => 'Official Executive Directive from Owner: '.$validated['title'],
                'message' => Str::limit($validated['directive_text'], 140),
                'category' => 'governance',
                'severity' => $validated['priority'] === 'urgent' ? 'high' : 'info',
                'action_url' => route('dashboard'),
            ]);
        }

        return redirect()->back()->with('success', 'Executive Owner Directive has been dispatched to branch managers.');
    }

    /**
     * Update or complete an executive directive.
     */
    public function updateDirective(Request $request, OwnerDirective $directive): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,acknowledged,completed',
            'title' => 'sometimes|string|max:255',
            'directive_text' => 'sometimes|string',
        ]);

        $directive->update($validated);

        return redirect()->back()->with('success', 'Directive has been updated successfully.');
    }

    /**
     * Delete/Archive a directive.
     */
    public function deleteDirective(Request $request, OwnerDirective $directive): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $directive->delete();

        return redirect()->back()->with('success', 'Directive has been deleted.');
    }

    /**
     * Owner approves a manager requisition.
     */
    public function approveRequisition(Request $request, OwnerRequisition $requisition): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'owner_notes' => 'nullable|string|max:1000',
        ]);

        $requisition->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'owner_notes' => $validated['owner_notes'] ?? 'Approved by Property Owner.',
        ]);

        // Auto-create or link to approved expense if requested
        if ($request->boolean('create_expense')) {
            Expense::create([
                'tenant_id' => $requisition->tenant_id,
                'property_id' => $requisition->property_id,
                'created_by' => $requisition->requested_by,
                'expense_number' => 'EXP-'.strtoupper(Str::random(6)),
                'title' => $requisition->title,
                'category' => $requisition->category,
                'vendor_name' => $requisition->vendor_name,
                'amount_minor' => $requisition->amount_minor,
                'payment_method' => 'cash',
                'expense_date' => now()->toDateString(),
                'status' => 'approved',
                'notes' => 'Generated from approved Owner Requisition '.$requisition->requisition_no.'. Owner notes: '.($requisition->owner_notes ?? ''),
            ]);
        }

        // Notify requesting manager
        SystemNotification::create([
            'tenant_id' => $requisition->tenant_id,
            'user_id' => $requisition->requested_by,
            'target_role' => 'general_manager',
            'title' => 'Requisition Approved by Owner ('.$requisition->requisition_no.')',
            'message' => 'Your requisition "'.$requisition->title.'" for TZS '.number_format($requisition->amount_minor / 100, 0).' has been approved.',
            'category' => 'finance',
            'severity' => 'success',
            'action_url' => route('dashboard'),
        ]);

        return redirect()->back()->with('success', "Requisition {$requisition->requisition_no} has been approved.");
    }

    /**
     * Owner rejects a manager requisition.
     */
    public function rejectRequisition(Request $request, OwnerRequisition $requisition): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'owner_notes' => 'required|string|max:1000',
        ]);

        $requisition->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'rejected_at' => now(),
            'owner_notes' => $validated['owner_notes'],
        ]);

        // Notify requesting manager
        SystemNotification::create([
            'tenant_id' => $requisition->tenant_id,
            'user_id' => $requisition->requested_by,
            'target_role' => 'general_manager',
            'title' => 'Requisition Rejected by Owner ('.$requisition->requisition_no.')',
            'message' => 'Reason: '.$validated['owner_notes'],
            'category' => 'finance',
            'severity' => 'warning',
            'action_url' => route('dashboard'),
        ]);

        return redirect()->back()->with('warning', "Requisition {$requisition->requisition_no} has been rejected.");
    }

    /**
     * Update branch monthly revenue target.
     */
    public function updateBranchTarget(Request $request, Property $property): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'monthly_target_revenue' => 'required|numeric|min:0',
        ]);

        $targetMinor = (int) round($validated['monthly_target_revenue'] * 100);
        $property->update([
            'monthly_target_revenue_minor' => $targetMinor,
        ]);

        return redirect()->back()->with('success', "Monthly revenue target for {$property->name} updated: TZS ".number_format($validated['monthly_target_revenue'], 0));
    }

    /**
     * Record Owner Drawing, Dividend or Capital Injection.
     */
    public function recordDrawing(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'drawing_type' => 'required|in:dividend,draw,capital_injection',
            'amount' => 'required|numeric|min:1',
            'property_id' => 'nullable|uuid',
            'payment_method' => 'required|string',
            'drawing_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $amountMinor = (int) round($validated['amount'] * 100);

        OwnerDrawing::create([
            'tenant_id' => $user->tenant_id,
            'property_id' => $validated['property_id'] ?: null,
            'created_by' => $user->id,
            'drawing_type' => $validated['drawing_type'],
            'amount_minor' => $amountMinor,
            'payment_method' => $validated['payment_method'],
            'reference_no' => 'OWN-'.strtoupper(Str::random(6)),
            'drawing_date' => $validated['drawing_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $typeLabel = match ($validated['drawing_type']) {
            'dividend' => 'Dividend',
            'capital_injection' => 'Capital Injection',
            default => 'Owner Drawing',
        };

        return redirect()->back()->with('success', "{$typeLabel} transaction of TZS ".number_format($validated['amount'], 0).' recorded successfully.');
    }

    /**
     * Inspect a specific branch operational workspace as Manager.
     */
    public function inspectBranch(Request $request, Property $property): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        session([
            'owner_inspecting_property_id' => $property->id,
            'current_property_id' => $property->id,
            'owner_inspecting_property_name' => $property->name,
        ]);

        return redirect()->route('dashboard')->with('info', "Inspecting operations for property: {$property->name} in Owner Mode.");
    }

    /**
     * Leave branch inspection and return to Owner Portal.
     */
    public function leaveInspectBranch(Request $request): RedirectResponse
    {
        session()->forget(['owner_inspecting_property_id', 'owner_inspecting_property_name']);

        return redirect()->route('owner.index')->with('success', 'Returned to Executive Owner Portal.');
    }

    /**
     * Build server-side analytics for the Owner Dashboard.
     * All queries are tenant-isolated; financial totals use confirmed
     * payments only and non-cancelled expenses.
     *
     * @return array<string, mixed>
     */
    private function buildOwnerAnalytics(Request $request, ?string $tenantId): array
    {
        $empty = [
            'period' => 'month',
            'range' => ['start' => null, 'end' => null, 'previous_start' => null, 'previous_end' => null],
            'comparison' => [],
            'revenue_trend' => [],
            'occupancy' => [],
            'departments' => [],
            'staff' => [],
            'alerts' => [],
        ];

        if (! $tenantId) {
            return $empty;
        }

        $period = (string) $request->query('period', 'month');
        $now = Carbon::now();
        $end = $now->copy()->endOfDay();

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

        // Optional single-property filter — validated against tenant-owned properties only
        $propertyFilter = $request->query('property_id');
        $propertyIdsQuery = Property::where('tenant_id', $tenantId);
        if ($propertyFilter) {
            $propertyIdsQuery->where('id', $propertyFilter);
        }
        $propertyIds = $propertyIdsQuery->pluck('id');
        $selectedPropertyId = $propertyFilter && $propertyIds->isNotEmpty() ? (string) $propertyFilter : null;

        $revenueQuery = fn ($from, $to) => (int) Payment::whereHas('folio', function ($q) use ($tenantId, $selectedPropertyId) {
            $q->where('tenant_id', $tenantId);
            if ($selectedPropertyId) {
                $q->where('property_id', $selectedPropertyId);
            }
        })
            ->where('status', 'confirmed')
            ->whereBetween('created_at', [$from, $to])
            ->sum('amount_minor');

        $expenseQuery = fn ($from, $to) => (int) Expense::whereIn('property_id', $propertyIds)
            ->where('status', '!=', 'cancelled')
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->sum('amount_minor');

        $posOrderScope = function ($q) use ($tenantId, $propertyIds, $selectedPropertyId) {
            $q->where('tenant_id', $tenantId);
            if ($selectedPropertyId) {
                $q->where('property_id', $selectedPropertyId);
            } else {
                $q->whereIn('property_id', $propertyIds);
            }
            $q->where('status', '!=', 'cancelled');
        };

        $posRevenueQuery = fn ($from, $to) => (int) PosOrder::where($posOrderScope)
            ->whereBetween('created_at', [$from, $to])
            ->sum('total_minor');

        $curRev = $revenueQuery($start, $end);
        $prevRev = $revenueQuery($prevStart, $prevEnd);
        $curExp = $expenseQuery($start, $end);
        $prevExp = $expenseQuery($prevStart, $prevEnd);
        $curPos = $posRevenueQuery($start, $end);
        $prevPos = $posRevenueQuery($prevStart, $prevEnd);

        $pctChange = function (int|float $current, int|float $previous): ?float {
            if ($previous == 0) {
                return $current == 0 ? 0.0 : null;
            }

            return round((($current - $previous) / $previous) * 100, 1);
        };

        // Revenue trend series
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

            $accomRev = (int) Payment::whereHas('folio', function ($q) use ($tenantId, $selectedPropertyId) {
                $q->where('tenant_id', $tenantId);
                if ($selectedPropertyId) {
                    $q->where('property_id', $selectedPropertyId);
                }
            })
                ->where('status', 'confirmed')
                ->whereBetween('created_at', [$bucketStart, $bucketEnd])
                ->sum('amount_minor');
            $posRev = (int) PosOrder::where($posOrderScope)
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

        // Occupancy snapshot
        $roomsQuery = Room::whereIn('property_id', $propertyIds);
        $totalRooms = (clone $roomsQuery)->count();
        $occupiedRooms = (clone $roomsQuery)->where('status_occupancy', 'occupied')->count();
        $reservedRooms = Reservation::where('tenant_id', $tenantId)
            ->whereIn('property_id', $propertyIds)
            ->where('status', 'confirmed')
            ->whereDate('check_in', '<=', $end->toDateString())
            ->whereDate('check_out', '>', $now->toDateString())
            ->count();
        $oooRooms = (clone $roomsQuery)->whereIn('status_hk', ['out_of_order', 'out_of_service'])->count();

        // Department revenue (POS outlets)
        $departments = PosOrder::where($posOrderScope)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('outlet_type, COUNT(*) as orders_count, SUM(total_minor) as revenue_minor')
            ->groupBy('outlet_type')
            ->get()
            ->map(fn ($row) => [
                'name' => ucfirst((string) ($row->outlet_type ?? 'other')),
                'orders' => (int) $row->orders_count,
                'revenue_minor' => (int) $row->revenue_minor,
            ])
            ->values()
            ->all();

        // Collections per payment method — confirmed folio receipts plus
        // settled POS tenders (posted_to_room orders settle later via folio).
        $paymentsByMethod = Payment::whereHas('folio', function ($q) use ($tenantId, $selectedPropertyId) {
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
            ->mapWithKeys(fn ($row) => [$row->payment_method ?: 'cash' => [
                'method' => $row->payment_method ?: 'cash',
                'total_minor' => (int) $row->total_amount,
                'count' => (int) $row->tx_count,
            ]])
            ->all();

        PosOrder::where($posOrderScope)
            ->where('payment_status', 'paid')
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

        // Staff overview (tenant-wide; property filter applies only when a property is selected)
        $staffQuery = User::where('tenant_id', $tenantId)->where('status', 'active');
        if ($selectedPropertyId) {
            $staffQuery->where('property_id', $selectedPropertyId);
        }
        $staffByRole = $staffQuery
            ->selectRaw('role, COUNT(*) as total')
            ->groupBy('role')
            ->pluck('total', 'role')
            ->all();

        // Alerts — real data only
        $alerts = [];
        $pendingReqQuery = OwnerRequisition::where('tenant_id', $tenantId)->where('status', 'pending_owner');
        if ($selectedPropertyId) {
            $pendingReqQuery->where('property_id', $selectedPropertyId);
        }
        $pendingReq = $pendingReqQuery->count();
        if ($pendingReq > 0) {
            $alerts[] = ['type' => 'approval', 'severity' => 'warning', 'message' => "{$pendingReq} expenditure requisition(s) awaiting your approval.", 'route' => 'owner.index?tab=approvals'];
        }
        if ($oooRooms > 0) {
            $alerts[] = ['type' => 'rooms', 'severity' => 'warning', 'message' => "{$oooRooms} room(s) are out of order or out of service.", 'route' => 'housekeeping.index'];
        }
        $lowStockQuery = PosItem::where('tenant_id', $tenantId)
            ->whereColumn('stock_quantity', '<=', 'reorder_level');
        if ($selectedPropertyId) {
            $lowStockQuery->where('property_id', $selectedPropertyId);
        }
        $lowStock = $lowStockQuery->count();
        if ($lowStock > 0) {
            $alerts[] = ['type' => 'inventory', 'severity' => 'info', 'message' => "{$lowStock} inventory item(s) at or below low-stock threshold.", 'route' => 'inventory.index'];
        }
        $cancelledCount = Reservation::where('tenant_id', $tenantId)
            ->whereIn('property_id', $propertyIds)
            ->where('status', 'cancelled')
            ->whereBetween('updated_at', [$start, $end])
            ->count();
        $totalRes = Reservation::where('tenant_id', $tenantId)
            ->whereIn('property_id', $propertyIds)
            ->whereBetween('created_at', [$start, $end])
            ->count();
        if ($totalRes > 0 && ($cancelledCount / $totalRes) > 0.2) {
            $alerts[] = ['type' => 'cancellations', 'severity' => 'warning', 'message' => 'Cancellation rate exceeded 20% for the selected period.', 'route' => 'reports.index'];
        }

        return [
            'period' => $period,
            'selected_property_id' => $selectedPropertyId,
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
                'previous_start' => $prevStart->toDateString(),
                'previous_end' => $prevEnd->toDateString(),
            ],
            'comparison' => [
                'revenue_minor' => $curRev,
                'previous_revenue_minor' => $prevRev,
                'revenue_change_percent' => $pctChange($curRev, $prevRev),
                'expenses_minor' => $curExp,
                'previous_expenses_minor' => $prevExp,
                'expenses_change_percent' => $pctChange($curExp, $prevExp),
                'gop_minor' => $curRev - $curExp,
                'previous_gop_minor' => $prevRev - $prevExp,
                'gop_change_percent' => $pctChange($curRev - $curExp, $prevRev - $prevExp),
                'pos_revenue_minor' => $curPos,
                'previous_pos_revenue_minor' => $prevPos,
            ],
            'revenue_trend' => $trend,
            'occupancy' => [
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedRooms,
                'available_rooms' => max(0, $totalRooms - $occupiedRooms - $oooRooms),
                'reserved_rooms' => $reservedRooms,
                'out_of_order_rooms' => $oooRooms,
                'occupancy_rate' => $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0,
            ],
            'departments' => $departments,
            'payments_by_method' => array_values($paymentsByMethod),
            'staff' => [
                'total_active' => array_sum($staffByRole),
                'by_role' => $staffByRole,
            ],
            'alerts' => $alerts,
        ];
    }
}
