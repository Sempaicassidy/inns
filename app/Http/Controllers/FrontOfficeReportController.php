<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\FrontOfficeReport;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Stay;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FrontOfficeReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id;

        $bDateRecord = $property ? BusinessDate::where('property_id', $property->id)->first() : null;
        $currentDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        // 1. Live Front Office Operational Snapshot (strictly operational, ZERO financial metrics)
        $totalRooms = Room::where('is_active', true)->count();
        $occupiedRooms = Room::where('is_active', true)->where('status_occupancy', 'occupied')->count();
        $vacantClean = Room::where('is_active', true)->where('status_occupancy', 'vacant')->whereIn('status_hk', ['clean', 'inspected'])->count();
        $vacantDirty = Room::where('is_active', true)->where('status_occupancy', 'vacant')->where('status_hk', 'dirty')->count();
        $maintenance = Room::where('is_active', true)->whereIn('status_hk', ['out_of_order', 'out_of_service'])->count();

        $arrivalsToday = Reservation::whereDate('check_in', $currentDate->toDateString())
            ->whereIn('status', ['confirmed', 'tentative'])
            ->count();

        $departuresToday = Reservation::whereDate('check_out', $currentDate->toDateString())
            ->where('status', 'checked_in')
            ->count();

        $inHouseCount = Stay::whereNull('checked_out_at')->count();

        // 2. Fetch past reports with author
        $reports = FrontOfficeReport::with('user:id,name,role')
            ->where('tenant_id', $tenantId)
            ->latest('report_date')
            ->latest('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('FrontOffice/Reports/Index', [
            'reports' => $reports,
            'snapshot' => [
                'current_date' => $currentDate->format('M d, Y'),
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedRooms,
                'vacant_clean' => $vacantClean,
                'vacant_dirty' => $vacantDirty,
                'maintenance_rooms' => $maintenance,
                'arrivals_today' => $arrivalsToday,
                'departures_today' => $departuresToday,
                'in_house_count' => $inHouseCount,
                'occupancy_pct' => $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id;

        $validated = $request->validate([
            'report_date' => 'nullable|date',
            'shift_type' => 'required|string|in:morning,evening,night,full_day',
            'shift_handover_to' => 'nullable|string|max:100',
            'operational_summary' => 'required|string|min:5',
            'guest_issues' => 'nullable|string',
            'maintenance_issues' => 'nullable|string',
            'handover_notes' => 'nullable|string',
        ]);

        $bDateRecord = $property ? BusinessDate::where('property_id', $property->id)->first() : null;
        $currentDate = ! empty($validated['report_date'])
            ? Carbon::parse($validated['report_date'])
            : ($bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today());

        $totalOccupied = Room::where('is_active', true)->where('status_occupancy', 'occupied')->count();
        $arrivals = Reservation::whereDate('check_in', $currentDate->toDateString())->whereIn('status', ['confirmed', 'tentative'])->count();
        $departures = Reservation::whereDate('check_out', $currentDate->toDateString())->where('status', 'checked_in')->count();
        $inHouse = Stay::whereNull('checked_out_at')->count();

        FrontOfficeReport::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'user_id' => $user->id,
            'report_date' => $currentDate->toDateString(),
            'shift_type' => $validated['shift_type'],
            'shift_handover_to' => $validated['shift_handover_to'] ?? null,
            'occupancy_count' => $totalOccupied,
            'arrivals_count' => $arrivals,
            'departures_count' => $departures,
            'in_house_count' => $inHouse,
            'operational_summary' => $validated['operational_summary'],
            'guest_issues' => $validated['guest_issues'] ?? null,
            'maintenance_issues' => $validated['maintenance_issues'] ?? null,
            'handover_notes' => $validated['handover_notes'] ?? null,
            'status' => 'submitted',
        ]);

        return back()->with('success', 'Front Office shift progress report submitted successfully!');
    }
}
