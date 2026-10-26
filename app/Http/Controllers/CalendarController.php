<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Property;
use App\Models\RatePlan;
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
        $rooms = Room::with('roomType')
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
            'roomType',
            'room',
        ])
            ->where(function ($query) use ($startDate, $endDate) {
                $query->where('check_in', '<', $endDate->toDateString())
                    ->where('check_out', '>', $startDate->toDateString());
            })
            ->whereIn('status', ['confirmed', 'tentative', 'checked_in', 'checked_out'])
            ->get();

        // Rate plans for modal booking
        $ratePlans = RatePlan::where('is_active', true)->get();

        return Inertia::render('Calendar/Index', [
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'businessDate' => $businessDate->toDateString(),
            'dates' => $dates,
            'rooms' => $rooms,
            'roomTypes' => $roomTypes,
            'reservationRooms' => $reservationRooms,
            'ratePlans' => $ratePlans,
            'filters' => [
                'room_type_id' => $request->input('room_type_id', ''),
            ],
        ]);
    }
}
