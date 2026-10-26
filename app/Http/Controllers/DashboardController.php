<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Folio;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Stay;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();

        $bDateRecord = $property ? BusinessDate::where('property_id', $property->id)->first() : null;
        $currentDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        // 1. Room Occupancy & Counts
        $totalRooms = Room::where('is_active', true)->count();
        $occupiedRooms = Room::where('is_active', true)->where('status_occupancy', 'occupied')->count();
        $vacantCleanRooms = Room::where('is_active', true)->where('status_occupancy', 'vacant')->whereIn('status_hk', ['clean', 'inspected'])->count();
        $vacantDirtyRooms = Room::where('is_active', true)->where('status_occupancy', 'vacant')->where('status_hk', 'dirty')->count();
        $outOfOrderRooms = Room::where('is_active', true)->whereIn('status_hk', ['out_of_order', 'out_of_service'])->count();

        $sellableRooms = max(1, $totalRooms - $outOfOrderRooms);
        $occupancyPercent = round(($occupiedRooms / $sellableRooms) * 100, 1);

        // 2. Revenue & Rates (Today)
        $todayPayments = Payment::whereDate('business_date', $currentDate->toDateString())
            ->where('status', 'confirmed')
            ->sum('amount_minor');

        // ADR & RevPAR (from checked_in reservations / stays)
        $roomRevenueToday = Folio::whereHas('lines', function ($q) use ($currentDate) {
            $q->whereDate('business_date', $currentDate->toDateString())
                ->where('line_type', 'room');
        })->get()->sum(function ($folio) use ($currentDate) {
            return $folio->lines()
                ->whereDate('business_date', $currentDate->toDateString())
                ->where('line_type', 'room')
                ->sum('amount_minor');
        });

        $adr = $occupiedRooms > 0 ? round(($roomRevenueToday / $occupiedRooms) / 100) : 0;
        $revpar = $sellableRooms > 0 ? round(($roomRevenueToday / $sellableRooms) / 100) : 0;

        // 3. Today's Arrivals & Departures
        $arrivals = Reservation::with(['guest', 'reservationRooms.roomType', 'reservationRooms.room'])
            ->whereDate('check_in', $currentDate->toDateString())
            ->whereIn('status', ['confirmed', 'tentative'])
            ->get();

        $departures = Reservation::with(['guest', 'reservationRooms.room', 'folios'])
            ->whereDate('check_out', $currentDate->toDateString())
            ->where('status', 'checked_in')
            ->get();

        $inHouseStays = Stay::with(['guest', 'room.roomType', 'reservationRoom.reservation'])
            ->whereNull('checked_out_at')
            ->latest('checked_in_at')
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'current_business_date' => $currentDate->format('M d, Y'),
                'occupancy_percent' => $occupancyPercent,
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedRooms,
                'vacant_clean' => $vacantCleanRooms,
                'vacant_dirty' => $vacantDirtyRooms,
                'out_of_service' => $outOfOrderRooms,
                'today_revenue_minor' => $todayPayments,
                'room_revenue_minor' => $roomRevenueToday,
                'adr' => $adr,
                'revpar' => $revpar,
                'in_house_count' => $inHouseStays->count(),
                'arrivals_count' => $arrivals->count(),
                'departures_count' => $departures->count(),
            ],
            'arrivals' => $arrivals,
            'departures' => $departures,
            'inHouseStays' => $inHouseStays,
        ]);
    }
}
