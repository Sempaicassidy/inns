<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Guest;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\Room;
use App\Models\RoomType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();

        $bDateRecord = $property ? BusinessDate::where('property_id', $property->id)->first() : null;
        $businessDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        $startDateStr = $request->input('start_date', $businessDate->toDateString());
        $startDate = Carbon::parse($startDateStr);
        $daysCount = (int) $request->input('days', 14);
        $endDate = $startDate->copy()->addDays($daysCount);

        // Date columns list
        $dates = [];
        for ($i = 0; $i < $daysCount; $i++) {
            $d = $startDate->copy()->addDays($i);
            $dates[] = [
                'date' => $d->toDateString(),
                'day_name' => $d->format('D'),
                'day_number' => $d->format('d'),
                'month_name' => $d->format('M'),
                'is_today' => $d->toDateString() === $businessDate->toDateString(),
                'is_weekend' => $d->isWeekend(),
            ];
        }

        // Room Types & Rooms
        $roomTypes = RoomType::where('is_active', true)->get();
        $rooms = Room::with([
            'roomType',
            'stays' => function ($q) {
                $q->whereNull('checked_out_at')->with('guest')->latest();
            },
        ])
            ->where('is_active', true)
            ->when($request->input('room_type_id'), function ($q, $rtId) {
                $q->where('room_type_id', $rtId);
            })
            ->orderBy('room_number')
            ->get();

        // Active reservation rooms in window
        $reservationRooms = ReservationRoom::with([
            'reservation.guest',
            'reservation.company',
            'reservation.folios',
            'roomType',
            'room',
            'ratePlan',
        ])
            ->where(function ($query) use ($startDate, $endDate) {
                $query->where('check_in', '<', $endDate->toDateString())
                    ->where('check_out', '>', $startDate->toDateString());
            })
            ->whereIn('status', ['confirmed', 'tentative', 'checked_in', 'checked_out'])
            ->get()
            ->map(function ($rr) {
                // Ensure check_in and check_out are clean Y-m-d strings
                $rr->check_in = Carbon::parse($rr->check_in)->toDateString();
                $rr->check_out = Carbon::parse($rr->check_out)->toDateString();

                $guestName = $rr->reservation?->guest?->full_name
                    ?: trim(($rr->reservation?->guest?->first_name ?? '').' '.($rr->reservation?->guest?->last_name ?? ''))
                    ?: 'Guest';
                $rr->guest_name = $guestName;

                return $rr;
            });

        // Rate plans for modal booking
        $ratePlans = RatePlan::where('is_active', true)->get();

        // Existing guests for auto-complete search
        $guests = Guest::select('id', 'first_name', 'last_name', 'phone', 'email', 'id_type', 'id_number', 'nationality')
            ->limit(100)
            ->get()
            ->map(function ($g) {
                return [
                    'id' => $g->id,
                    'first_name' => $g->first_name,
                    'last_name' => $g->last_name,
                    'full_name' => $g->full_name,
                    'phone' => $g->phone ?? '',
                    'email' => $g->email ?? '',
                    'id_type' => $g->id_type ?? 'national_id',
                    'id_number' => $g->id_number ?? '',
                    'nationality' => $g->nationality ?? 'Tanzanian',
                ];
            });

        $totalRooms = Room::where('is_active', true)->count();
        $occupiedRooms = Room::where('is_active', true)->where('status_occupancy', 'occupied')->count();
        $vacantClean = Room::where('is_active', true)->where('status_occupancy', 'vacant')->whereIn('status_hk', ['clean', 'inspected'])->count();
        $vacantDirty = Room::where('is_active', true)->where('status_occupancy', 'vacant')->where('status_hk', 'dirty')->count();
        $outOfOrder = Room::where('is_active', true)->whereIn('status_hk', ['out_of_order', 'out_of_service'])->count();
        $reservedCount = Reservation::where('status', 'confirmed')->whereDate('check_in', '>=', $businessDate)->count();
        $dueOutToday = Reservation::where('status', 'checked_in')->whereDate('check_out', $businessDate)->count();

        // Calculate daily availability and occupancy for bottom row
        $dailyMetrics = [];
        foreach ($dates as $dateItem) {
            $currDate = $dateItem['date'];
            // count reserved/in-house rooms on this date
            $occupiedOnDate = $reservationRooms->filter(function ($rr) use ($currDate) {
                return $rr->check_in <= $currDate && $rr->check_out > $currDate;
            })->count();

            $avail = max(0, $totalRooms - $occupiedOnDate);
            $pct = $totalRooms > 0 ? round(($occupiedOnDate / $totalRooms) * 100) : 0;

            $dailyMetrics[$currDate] = [
                'availability' => $avail,
                'occupancy_pct' => $pct,
                'occupied' => $occupiedOnDate,
            ];
        }

        return Inertia::render('Calendar/Index', [
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'businessDate' => $businessDate->toDateString(),
            'dates' => $dates,
            'rooms' => $rooms,
            'roomTypes' => $roomTypes,
            'reservationRooms' => $reservationRooms,
            'ratePlans' => $ratePlans,
            'guests' => $guests,
            'dailyMetrics' => $dailyMetrics,
            'summary' => [
                'all' => $totalRooms,
                'vacant' => $vacantClean,
                'occupied' => $occupiedRooms,
                'reserved' => $reservedCount,
                'blocked' => $outOfOrder,
                'due_out' => $dueOutToday,
                'dirty' => $vacantDirty,
            ],
            'stats' => [
                'total_rooms' => $totalRooms,
                'available_rooms' => $vacantClean,
                'occupied_rooms' => $occupiedRooms,
            ],
            'filters' => [
                'room_type_id' => $request->input('room_type_id', ''),
            ],
        ]);
    }

    /**
     * Quick block room for maintenance or deep cleaning.
     */
    public function blockRoom(Request $request)
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'reason' => 'required|string',
            'status_hk' => 'nullable|string|in:out_of_order,out_of_service,dirty',
        ]);

        $room = Room::findOrFail($validated['room_id']);
        $room->status_hk = $validated['status_hk'] ?? 'out_of_order';
        $room->status_occupancy = 'vacant';
        $room->save();

        return redirect()->back()->with('success', "Room {$room->room_number} blocked for {$validated['reason']}.");
    }

    /**
     * Unblock room and return it to available clean status.
     */
    public function unblockRoom(Request $request)
    {
        $validated = $request->validate([
            'room_id' => 'required|exists:rooms,id',
        ]);

        $room = Room::findOrFail($validated['room_id']);
        $room->status_hk = 'clean';
        $room->status_occupancy = 'vacant';
        $room->save();

        return redirect()->back()->with('success', "Room {$room->room_number} is now unblocked and ready for guests.");
    }
}
