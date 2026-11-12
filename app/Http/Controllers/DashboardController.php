<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EnsureModuleAccess;
use App\Models\BusinessDate;
use App\Models\Expense;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\OwnerDirective;
use App\Models\OwnerRequisition;
use App\Models\Payment;
use App\Models\PosOrder;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Stay;
use App\Models\SystemNotification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if ($user && $user->isSuperAdmin() && ! session()->has('impersonating_original_superadmin_id')) {
            return redirect()->route('saas-admin.index');
        }

        // If user active role is Owner and not inspecting a specific lodge, redirect to Owner Portal
        if ($user && ($user->active_role === 'owner' || ($user->role === 'owner' && ! session()->has('active_role'))) && ! session()->has('owner_inspecting_property_id')) {
            return redirect()->route('owner.index');
        }

        if ($user && in_array($user->active_role, ['accountant', 'senior_accountant', 'finance_officer'], true)) {
            return app(AccountingController::class)->index($request);
        }

        // Operational roles land on their dedicated workspace instead of the
        // front-desk style dashboard. Only redirect when the role can actually
        // pass the target route's module + plan gates (avoids redirect loops).
        if ($user && $user->active_role) {
            $dedicated = match ($user->active_role) {
                'housekeeper', 'housekeeping_supervisor' => ['housekeeping.index', 'housekeeping', 'housekeeping'],
                'pos_cashier', 'cashier', 'waiter', 'bartender', 'chef',
                'restaurant_cashier', 'restaurant_staff' => ['pos.index', 'restaurant_pos', 'restaurant_pos'],
                'grocery_cashier', 'supermarket_cashier' => ['grocery.dashboard', 'grocery_pos', 'grocery_pos'],
                'storekeeper', 'procurement_manager' => ['inventory.index', 'inventory', 'inventory'],
                'night_auditor' => ['night-audit.index', null, null],
                'hr_manager' => ['hr.index', 'hr_payroll', 'hr_payroll'],
                default => null,
            };

            if ($dedicated !== null) {
                [$dedicatedRoute, $moduleKey, $featureKey] = $dedicated;
                $tenant = $user->tenant;
                $featureOk = $featureKey === null || ! $tenant || $tenant->hasFeature($featureKey);
                $moduleOk = $moduleKey === null || EnsureModuleAccess::roleCanAccessModule($moduleKey, $user->active_role);

                if ($featureOk && $moduleOk) {
                    return redirect()->route($dedicatedRoute);
                }
            }
        }

        $property = $user->property ?? Property::first();
        if (session()->has('owner_inspecting_property_id')) {
            $inspectingId = session('owner_inspecting_property_id');
            $property = Property::find($inspectingId) ?? $property;
        }

        $bDateRecord = $property ? BusinessDate::where('property_id', $property->id)->first() : null;
        $currentDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        // ─── Date range from query string ─────────────────────────────────────
        $selectedRange = $request->input('range', '7days');
        [$startDate, $prevStart, $prevEnd] = $this->resolveDateRange($selectedRange, $currentDate);

        // ─── 1. Room Counts ───────────────────────────────────────────────────
        $totalRooms = Room::where('is_active', true)->count();
        $occupiedRooms = Room::where('is_active', true)->where('status_occupancy', 'occupied')->count();
        $vacantClean = Room::where('is_active', true)->where('status_occupancy', 'vacant')->whereIn('status_hk', ['clean', 'inspected'])->count();
        $vacantDirty = Room::where('is_active', true)->where('status_occupancy', 'vacant')->where('status_hk', 'dirty')->count();
        $outOfOrder = Room::where('is_active', true)->whereIn('status_hk', ['out_of_order', 'out_of_service'])->count();
        $reservedCount = Room::where('is_active', true)->where('status_occupancy', 'vacant')->whereIn('status_hk', ['clean', 'inspected'])->count();

        $sellable = max(1, $totalRooms - $outOfOrder);
        $occupancyPct = round(($occupiedRooms / $sellable) * 100, 1);

        // ─── 2. Revenue — Payments received for the period ────────────────────
        // payments has no property_id; join via folios
        $totalPayments = Payment::whereHas('folio', function ($q) use ($property) {
            if ($property) {
                $q->where('property_id', $property->id);
            }
        })
            ->whereDate('created_at', '>=', $startDate)
            ->where('status', 'confirmed')
            ->sum('amount_minor');

        $prevPayments = Payment::whereHas('folio', function ($q) use ($property) {
            if ($property) {
                $q->where('property_id', $property->id);
            }
        })
            ->whereDate('created_at', '>=', $prevStart)
            ->whereDate('created_at', '<=', $prevEnd)
            ->where('status', 'confirmed')
            ->sum('amount_minor');

        $revenueChangePct = $prevPayments > 0
            ? round((($totalPayments - $prevPayments) / $prevPayments) * 100, 1)
            : ($totalPayments > 0 ? 100 : 0);

        // ─── 3. Room Revenue (folio_lines type = 'room') ──────────────────────
        $roomRevenue = FolioLine::whereHas('folio', function ($q) use ($property) {
            if ($property) {
                $q->where('property_id', $property->id);
            }
        })
            ->where('line_type', 'room')
            ->whereDate('business_date', '>=', $startDate)
            ->sum('amount_minor');

        // ─── 4. POS/Restaurant Revenue ────────────────────────────────────────
        $posRevenue = PosOrder::where('payment_status', 'paid')
            ->whereDate('created_at', '>=', $startDate)
            ->sum('total_minor');

        // ─── 4b. Collections grouped by payment method ─────────────────────────
        $paymentsByMethod = Payment::whereHas('folio', function ($q) use ($property) {
            if ($property) {
                $q->where('property_id', $property->id);
            }
        })
            ->whereDate('created_at', '>=', $startDate)
            ->where('status', 'confirmed')
            ->selectRaw('payment_method, sum(amount_minor) as total_amount, count(*) as tx_count')
            ->groupBy('payment_method')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->payment_method ?: 'cash' => [
                'method' => $row->payment_method ?: 'cash',
                'total_minor' => (int) $row->total_amount,
                'count' => (int) $row->tx_count,
            ]])
            ->all();

        // Settled POS collections (cash / card / mpesa received at the till).
        // 'posted_to_room' orders are excluded — they settle later via folio payments.
        PosOrder::where('payment_status', 'paid')
            ->whereDate('created_at', '>=', $startDate)
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

        // ─── 5. Expenses ──────────────────────────────────────────────────────
        $expensesTotal = Expense::whereDate('expense_date', '>=', $startDate)
            ->sum('amount_minor');

        // ─── 6. Outstanding Balance (open folios with positive balance) ────────
        $outstandingBalance = Folio::where('balance_minor', '>', 0)
            ->where('status', 'open')
            ->sum('balance_minor');

        // ─── 7. ADR & RevPAR (stored in minor currency units) ──────────────
        $paidStaysCount = max(1, Stay::whereDate('checked_in_at', '>=', $startDate)->count());
        $adr = round($roomRevenue / $paidStaysCount, 0);
        $revpar = $sellable > 0 ? round($roomRevenue / $sellable, 0) : 0;

        // ─── 8. Today's arrivals & departures ────────────────────────────────
        $arrivals = Reservation::with(['guest', 'reservationRooms.roomType', 'reservationRooms.room'])
            ->whereDate('check_in', $currentDate->toDateString())
            ->whereIn('status', ['confirmed', 'tentative'])
            ->get();

        $departures = Reservation::with(['guest', 'reservationRooms.room', 'folios'])
            ->whereDate('check_out', $currentDate->toDateString())
            ->where('status', 'checked_in')
            ->get();

        $inHouseStays = Stay::with(['guest', 'room.roomType', 'reservationRoom.reservation', 'folio'])
            ->whereNull('checked_out_at')
            ->latest('checked_in_at')
            ->get();

        // ─── 9. Pending bookings ──────────────────────────────────────────────
        $pendingCount = Reservation::whereIn('status', ['tentative', 'inquiry'])->count();

        // ─── 10. Revenue Trend (daily, for chart) ─────────────────────────────
        $revenueTrend = $this->buildRevenueTrend($property, $startDate, $currentDate);

        // ─── 11. Guest Activity List ─────────────────────────────────────────
        $guestList = $this->buildGuestList($inHouseStays, $arrivals);

        // ─── 12. Room Clean List ──────────────────────────────────────────────
        $rooms = Room::with(['roomType', 'housekeepingTasks' => function ($q) {
            $q->latest()->limit(1)->with('assignee');
        }, 'stays' => function ($q) {
            $q->whereNull('checked_out_at')->latest()->with(['guest', 'folio', 'reservationRoom.reservation']);
        }])->orderBy('room_number')->get();

        $roomCleanList = $rooms->map(function ($r) {
            $latestTask = $r->housekeepingTasks->first();
            $activeStay = $r->stays->first();
            $isAllocated = $r->status_occupancy === 'occupied' || $activeStay !== null;

            $taskLabel = 'Clean';
            if ($r->status_hk === 'dirty') {
                $taskLabel = 'Dirty';
            } elseif (in_array($r->status_hk, ['out_of_order', 'out_of_service'])) {
                $taskLabel = 'Maintenance';
            }

            return [
                'id' => $r->id,
                'room_number' => str_starts_with($r->room_number, '#') ? $r->room_number : '#'.$r->room_number,
                'status' => $isAllocated ? 'Allocated' : 'Not Allocated',
                'task' => $taskLabel,
                'status_hk' => $r->status_hk,
                'assignee' => $latestTask?->assignee?->name ?? 'None',
                'assignee_avatar' => null,
            ];
        });

        // ─── 13. Notifications from real events ──────────────────────────────
        $notifications = $this->buildNotifications($property);

        // ─── 14. Staff List ───────────────────────────────────────────────────
        $staffList = User::where('tenant_id', $user->tenant_id ?? null)
            ->select('id', 'name', 'role')
            ->get();

        // ─── 15. Room Gallery ─────────────────────────────────────────────────
        $roomGallery = [
            ['number' => '#B17', 'type' => 'Double Bed', 'image' => 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'],
            ['number' => '#B18', 'type' => 'Luxury Queen', 'image' => 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80'],
            ['number' => '#B19', 'type' => 'Double Bed', 'image' => 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80'],
            ['number' => $totalRooms.'+', 'type' => 'Total Rooms', 'image' => 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=600&q=80'],
        ];

        $role = $user->active_role ?: $user->role;
        $isManager = in_array($role, ['general_manager', 'manager', 'owner', 'super_admin', 'admin']);
        $isReceptionist = ! $isManager && in_array($role, ['receptionist', 'front_desk', 'front_office', 'front_office_manager', 'staff']);

        return Inertia::render('Dashboard', [
            'selectedRange' => $selectedRange,
            'stats' => [
                'current_business_date' => $currentDate->format('M d, Y'),
                'occupancy_percent' => $occupancyPct,
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedRooms,
                'vacant_clean' => $vacantClean,
                'vacant_dirty' => $vacantDirty,
                'out_of_service' => $outOfOrder,
                'today_revenue_minor' => $isReceptionist ? 0 : $totalPayments,
                'room_revenue_minor' => $isReceptionist ? 0 : $roomRevenue,
                'pos_revenue_minor' => $isReceptionist ? 0 : $posRevenue,
                'expenses_minor' => $isReceptionist ? 0 : $expensesTotal,
                'outstanding_minor' => $isReceptionist ? 0 : $outstandingBalance,
                'net_profit_minor' => $isReceptionist ? 0 : (($roomRevenue + $posRevenue) - $expensesTotal),
                'adr' => $isReceptionist ? 0 : $adr,
                'revpar' => $isReceptionist ? 0 : $revpar,
                'in_house_count' => $inHouseStays->count(),
                'arrivals_count' => $arrivals->count(),
                'departures_count' => $departures->count(),
                'available_count' => $vacantClean,
                'reserved_count' => $pendingCount,
                'revenue_change_pct' => $isReceptionist ? 0 : $revenueChangePct,
            ],
            'paymentsByMethod' => $isReceptionist ? [] : array_values($paymentsByMethod),
            'revenueTrend' => $isReceptionist ? [] : $revenueTrend,
            'arrivals' => $arrivals,
            'departures' => $departures,
            'inHouseStays' => $inHouseStays,
            'guestList' => $guestList->values()->all(),
            'roomCleanList' => $roomCleanList->take(6)->values()->all(),
            'roomGallery' => $roomGallery,
            'staffList' => $staffList,
            'notifications' => $notifications,
            'availableRooms' => $rooms->where('status_occupancy', 'vacant')->values()->all(),
            'isReceptionist' => $isReceptionist,
            'pendingFoliosCount' => Folio::where('balance_minor', '>', 0)->where('status', 'open')->count(),
            'calendarData' => app(CalendarController::class)->getCalendarData($request),
            'allRooms' => $rooms->map(function ($r) use ($currentDate) {
                $stay = $r->stays->first();
                $res = $stay?->reservationRoom?->reservation;
                $folio = $stay?->folio ?? $res?->folios?->first();

                return [
                    'id' => $r->id,
                    'room_number' => $r->room_number,
                    'room_type_id' => $r->room_type_id,
                    'type_name' => $r->roomType?->name ?? 'Standard',
                    'floor' => $r->floor ?? 'Ground Floor',
                    'base_price_minor' => $r->roomType?->base_price_minor ?? 0,
                    'status_occupancy' => $r->status_occupancy,
                    'status_hk' => $r->status_hk,
                    'guest_name' => $stay?->guest?->full_name ?? $stay?->guest?->name,
                    'current_guest' => $stay?->guest?->full_name ?? $stay?->guest?->name,
                    'current_guest_phone' => $stay?->guest?->phone,
                    'current_check_in' => $stay?->checked_in_at ? Carbon::parse($stay->checked_in_at)->toDateString() : ($res?->check_in ? Carbon::parse($res->check_in)->toDateString() : null),
                    'current_check_out' => $stay?->expected_check_out ? Carbon::parse($stay->expected_check_out)->toDateString() : ($res?->check_out ? Carbon::parse($res->check_out)->toDateString() : null),
                    'current_folio_id' => $folio?->id,
                    'current_folio_balance_minor' => $folio?->balance_minor ?? 0,
                    'is_due_out' => ($stay?->expected_check_out && Carbon::parse($stay->expected_check_out)->toDateString() === $currentDate->toDateString()),
                ];
            })->values()->all(),
            'ownerDirectives' => OwnerDirective::where('tenant_id', $user->tenant_id)
                ->where(function ($q) use ($property) {
                    $q->whereNull('property_id');
                    if ($property) {
                        $q->orWhere('property_id', $property->id);
                    }
                })
                ->where('status', '!=', 'completed')
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(),
            'myRequisitions' => OwnerRequisition::where('tenant_id', $user->tenant_id)
                ->where('property_id', $property?->id)
                ->orderBy('created_at', 'desc')
                ->take(8)
                ->get(),
            'isOwnerInspecting' => session()->has('owner_inspecting_property_id'),
            'ownerInspectingPropertyName' => session('owner_inspecting_property_name'),
        ]);
    }

    /**
     * General Manager submits a requisition to the Owner.
     */
    public function storeRequisition(Request $request): RedirectResponse
    {
        $user = $request->user();
        $property = $user->property ?? Property::where('tenant_id', $user->tenant_id)->first();

        if (! $property) {
            return redirect()->back()->with('error', 'No property is linked to your account.');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|in:maintenance,supplies,equipment,renovation,utilities,staff,other',
            'amount' => 'required|numeric|min:1',
            'urgency' => 'required|in:routine,priority,emergency',
            'justification' => 'required|string',
            'vendor_name' => 'nullable|string|max:255',
        ]);

        $amountMinor = (int) round($validated['amount'] * 100);
        $reqNo = 'REQ-'.date('Ym').'-'.strtoupper(Str::random(4));

        $requisition = OwnerRequisition::create([
            'tenant_id' => $user->tenant_id,
            'property_id' => $property->id,
            'requested_by' => $user->id,
            'requisition_no' => $reqNo,
            'title' => $validated['title'],
            'category' => $validated['category'],
            'amount_minor' => $amountMinor,
            'urgency' => $validated['urgency'],
            'justification' => $validated['justification'],
            'vendor_name' => $validated['vendor_name'] ?? null,
            'status' => 'pending_owner',
        ]);

        // Send notification to Owner(s)
        $owners = User::where('tenant_id', $user->tenant_id)
            ->where(function ($q) {
                $q->where('role', 'owner')
                    ->orWhereJsonContains('roles', 'owner');
            })
            ->get();

        foreach ($owners as $owner) {
            SystemNotification::create([
                'tenant_id' => $user->tenant_id,
                'user_id' => $owner->id,
                'target_role' => 'owner',
                'title' => "New Expenditure Approval Request ({$reqNo}) from {$user->name}",
                'message' => "Property: {$property->name} — Amount: TZS ".number_format($validated['amount'], 0)." — {$validated['title']}",
                'category' => 'governance',
                'severity' => $validated['urgency'] === 'emergency' ? 'high' : 'info',
                'action_url' => route('owner.index', ['tab' => 'approvals']),
            ]);
        }

        return redirect()->back()->with('success', "Approval Request {$reqNo} has been submitted to Property Owner for review.");
    }

    /**
     * General Manager acknowledges receipt of an Owner Directive.
     */
    public function acknowledgeDirective(Request $request, OwnerDirective $directive): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $directive->update([
            'status' => 'acknowledged',
            'acknowledged_at' => now(),
            'acknowledged_by' => $user->id,
            'acknowledgement_notes' => $validated['notes'] ?? 'Acknowledged by Manager.',
        ]);

        // Notify the Owner who created it
        if ($directive->created_by) {
            SystemNotification::create([
                'tenant_id' => $directive->tenant_id,
                'user_id' => $directive->created_by,
                'target_role' => 'owner',
                'title' => "Directive Acknowledged by Manager ({$user->name})",
                'message' => "Manager confirmed receipt of directive: \"{$directive->title}\"",
                'category' => 'governance',
                'severity' => 'info',
                'action_url' => route('owner.index', ['tab' => 'directives']),
            ]);
        }

        return redirect()->back()->with('success', 'You have acknowledged the owner directive.');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private function resolveDateRange(string $range, Carbon $today): array
    {
        $days = match ($range) {
            'today' => 1,
            '30days' => 30,
            '90days' => 90,
            default => 7,
        };

        $start = $today->copy()->subDays($days - 1)->startOfDay();
        $prevEnd = $start->copy()->subDay()->endOfDay();
        $prevStart = $prevEnd->copy()->subDays($days - 1)->startOfDay();

        return [$start, $prevStart, $prevEnd];
    }

    private function buildRevenueTrend(?Property $property, Carbon $startDate, Carbon $currentDate): array
    {
        // Get daily confirmed payments grouped by date
        $query = Payment::selectRaw('DATE(created_at) as day, SUM(amount_minor) as total')
            ->where('status', 'confirmed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $currentDate);

        if ($property) {
            $query->whereHas('folio', fn ($q) => $q->where('property_id', $property->id));
        }

        $rows = $query->groupBy('day')->orderBy('day')->get()->keyBy('day');

        $trend = [];
        $current = $startDate->copy();
        while ($current->lte($currentDate)) {
            $dateKey = $current->toDateString();
            $trend[] = [
                'date' => $dateKey,
                'label' => $current->format('M d'),
                'day' => $current->format('D'),
                'revenue' => (int) ($rows->get($dateKey)?->total ?? 0),
            ];
            $current->addDay();
        }

        return $trend;
    }

    private function buildGuestList($inHouseStays, $arrivals): Collection
    {
        $list = collect();

        foreach ($inHouseStays->take(10) as $stay) {
            $balance = $stay->folio ? $stay->folio->balance_minor : 0;
            $dueAmount = $balance > 0 ? 'TZS '.number_format($balance / 100, 0) : 'Settled';
            $list->push([
                'id' => $stay->id,
                'guest_name' => $stay->guest?->full_name ?? 'Guest',
                'check_in' => $stay->checked_in_at?->format('M d, H:i') ?? '-',
                'check_out' => '-',
                'room_type' => $stay->room?->roomType?->name ?? '-',
                'allocated_room' => '#'.($stay->room?->room_number ?? '—'),
                'due_amount' => $dueAmount,
                'status' => 'Checked In',
            ]);
        }

        foreach ($arrivals->take(5) as $res) {
            $room = $res->reservationRooms->first()?->room;
            $roomType = $res->reservationRooms->first()?->roomType;
            $list->push([
                'id' => $res->id,
                'guest_name' => $res->guest?->full_name ?? 'Reserved Guest',
                'check_in' => Carbon::parse($res->check_in)->format('M d'),
                'check_out' => Carbon::parse($res->check_out)->format('M d'),
                'room_type' => $roomType?->name ?? '-',
                'allocated_room' => $room ? '#'.$room->room_number : 'Unassigned',
                'due_amount' => 'TZS '.number_format($res->total_minor / 100, 0),
                'status' => 'Arriving Today',
            ]);
        }

        return $list;
    }

    private function buildNotifications(?Property $property): array
    {
        $events = [];

        // Recent check-ins (last 24h)
        $recentCheckIns = Stay::with(['guest', 'room'])
            ->whereNotNull('checked_in_at')
            ->where('checked_in_at', '>=', now()->subHours(24))
            ->latest('checked_in_at')
            ->take(4)
            ->get();

        foreach ($recentCheckIns as $stay) {
            $events[] = [
                'id' => 'checkin-'.$stay->id,
                'type' => 'check_in',
                'color' => 'green',
                'title' => 'Guest Checked In',
                'description' => ($stay->guest?->full_name ?? 'A guest').' checked in to Room '.($stay->room?->room_number ? '#'.$stay->room->room_number : ''),
                'time' => $stay->checked_in_at?->diffForHumans() ?? 'recently',
                'link' => route('reservations.index'),
                'read' => false,
            ];
        }

        // Recent payments (last 24h)
        $recentPayments = Payment::with('folio')
            ->where('status', 'confirmed')
            ->where('created_at', '>=', now()->subHours(24))
            ->latest()
            ->take(3)
            ->get();

        foreach ($recentPayments as $payment) {
            $events[] = [
                'id' => 'payment-'.$payment->id,
                'type' => 'payment',
                'color' => 'blue',
                'title' => 'Payment Received',
                'description' => 'TZS '.number_format($payment->amount_minor / 100, 0).' received via '.ucfirst($payment->payment_method),
                'time' => $payment->created_at?->diffForHumans() ?? 'recently',
                'link' => route('accounting.index'),
                'read' => false,
            ];
        }

        // New reservations (last 48h)
        $newReservations = Reservation::with('guest')
            ->whereIn('status', ['confirmed', 'tentative'])
            ->where('created_at', '>=', now()->subHours(48))
            ->latest()
            ->take(3)
            ->get();

        foreach ($newReservations as $res) {
            $events[] = [
                'id' => 'res-'.$res->id,
                'type' => 'booking',
                'color' => 'blue',
                'title' => 'New Booking',
                'description' => 'Booking '.$res->ref_no.' — '.($res->guest?->full_name ?? 'Guest').' — Check-in: '.Carbon::parse($res->check_in)->format('M d'),
                'time' => $res->created_at?->diffForHumans() ?? 'recently',
                'link' => route('reservations.index'),
                'read' => false,
            ];
        }

        // Cancelled reservations (last 48h)
        $cancelled = Reservation::with('guest')
            ->where('status', 'cancelled')
            ->where('updated_at', '>=', now()->subHours(48))
            ->latest()
            ->take(2)
            ->get();

        foreach ($cancelled as $res) {
            $events[] = [
                'id' => 'cancel-'.$res->id,
                'type' => 'cancellation',
                'color' => 'red',
                'title' => 'Reservation Cancelled',
                'description' => 'Booking '.$res->ref_no.' was cancelled — '.($res->guest?->full_name ?? 'Guest'),
                'time' => $res->updated_at?->diffForHumans() ?? 'recently',
                'link' => route('reservations.index'),
                'read' => false,
            ];
        }

        // Rooms needing maintenance
        $maintenanceRooms = Room::whereIn('status_hk', ['out_of_order', 'out_of_service'])
            ->take(2)
            ->get();

        foreach ($maintenanceRooms as $room) {
            $events[] = [
                'id' => 'maint-'.$room->id,
                'type' => 'maintenance',
                'color' => 'amber',
                'title' => 'Room Maintenance',
                'description' => 'Room #'.$room->room_number.' is marked as '.str_replace('_', ' ', $room->status_hk),
                'time' => $room->updated_at?->diffForHumans() ?? 'recently',
                'link' => route('housekeeping.index'),
                'read' => false,
            ];
        }

        // Sort by most recent (they all have a 'time' string, so sort by updated_at proxy)
        return array_slice($events, 0, 10);
    }
}
