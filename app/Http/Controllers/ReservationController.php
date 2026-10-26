<?php

namespace App\Http\Controllers;

use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Guest;
use App\Models\HousekeepingTask;
use App\Models\Payment;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Reservation;
use App\Models\ReservationRoom;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\Stay;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status');
        $search = $request->input('search');

        $reservations = Reservation::with(['guest', 'company', 'reservationRooms.roomType', 'reservationRooms.room', 'folios'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, function ($q, $search) {
                $q->where('ref_no', 'like', "%{$search}%")
                    ->orWhereHas('guest', function ($gq) use ($search) {
                        $gq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            })
            ->latest('check_in')
            ->paginate(15)
            ->withQueryString();

        $rooms = Room::with('roomType')->where('is_active', true)->get();
        $roomTypes = RoomType::where('is_active', true)->get();
        $ratePlans = RatePlan::where('is_active', true)->get();
        $guests = Guest::latest()->take(50)->get();

        return Inertia::render('Reservations/Index', [
            'reservations' => $reservations,
            'filters' => [
                'status' => $status ?? '',
                'search' => $search ?? '',
            ],
            'rooms' => $rooms,
            'roomTypes' => $roomTypes,
            'ratePlans' => $ratePlans,
            'guests' => $guests,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'guest_id' => 'nullable|uuid',
            'first_name' => 'required_without:guest_id|string|max:100',
            'last_name' => 'required_without:guest_id|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'nationality' => 'nullable|string|max:50',
            'id_number' => 'nullable|string|max:50',
            'room_type_id' => 'required|uuid',
            'room_id' => 'nullable|uuid',
            'rate_plan_id' => 'required|uuid',
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'adults' => 'required|integer|min:1',
            'children' => 'nullable|integer|min:0',
            'source' => 'required|string',
            'rate_price' => 'required|numeric|min:0',
            'deposit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'check_in_now' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();

        DB::transaction(function () use ($validated, $user, $property) {
            // Find or create guest
            if (! empty($validated['guest_id'])) {
                $guest = Guest::findOrFail($validated['guest_id']);
            } else {
                $guest = Guest::create([
                    'tenant_id' => $user->tenant_id,
                    'first_name' => $validated['first_name'],
                    'last_name' => $validated['last_name'],
                    'phone' => $validated['phone'] ?? null,
                    'email' => $validated['email'] ?? null,
                    'nationality' => $validated['nationality'] ?? 'Tanzanian',
                    'id_number' => $validated['id_number'] ?? null,
                ]);
            }

            // Calculate nights and total amount
            $checkIn = Carbon::parse($validated['check_in']);
            $checkOut = Carbon::parse($validated['check_out']);
            $nights = max(1, $checkIn->diffInDays($checkOut));
            $ratePriceMinor = (int) ($validated['rate_price'] * 100);
            $totalMinor = $ratePriceMinor * $nights;
            $depositMinor = ! empty($validated['deposit']) ? (int) ($validated['deposit'] * 100) : 0;

            // Generate Ref No
            $year = now()->year;
            $seq = Reservation::whereYear('created_at', $year)->count() + 1;
            $refNo = sprintf('RES-%d-%04d', $year, $seq);

            $status = ! empty($validated['check_in_now']) ? 'checked_in' : 'confirmed';

            $reservation = Reservation::create([
                'tenant_id' => $user->tenant_id,
                'property_id' => $property->id,
                'ref_no' => $refNo,
                'guest_id' => $guest->id,
                'source' => $validated['source'],
                'status' => $status,
                'check_in' => $validated['check_in'],
                'check_out' => $validated['check_out'],
                'adults' => $validated['adults'],
                'children' => $validated['children'] ?? 0,
                'total_minor' => $totalMinor,
                'deposit_minor' => $depositMinor,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            $resRoom = ReservationRoom::create([
                'tenant_id' => $user->tenant_id,
                'reservation_id' => $reservation->id,
                'room_type_id' => $validated['room_type_id'],
                'room_id' => $validated['room_id'] ?? null,
                'rate_plan_id' => $validated['rate_plan_id'],
                'check_in' => $validated['check_in'],
                'check_out' => $validated['check_out'],
                'rate_price_minor' => $ratePriceMinor,
                'status' => $status,
            ]);

            // Create Folio
            $folioNumber = sprintf('FOL-%05d', Folio::count() + 1);
            $folio = Folio::create([
                'tenant_id' => $user->tenant_id,
                'property_id' => $property->id,
                'reservation_id' => $reservation->id,
                'folio_number' => $folioNumber,
                'owner_type' => 'guest',
                'owner_id' => $guest->id,
                'currency' => $property->currency ?? 'TZS',
                'status' => 'open',
            ]);

            if ($depositMinor > 0) {
                Payment::create([
                    'tenant_id' => $user->tenant_id,
                    'folio_id' => $folio->id,
                    'business_date' => $checkIn->toDateString(),
                    'payment_method' => 'cash',
                    'amount_minor' => $depositMinor,
                    'status' => 'confirmed',
                    'received_by' => $user->id,
                    'notes' => 'Booking advance deposit',
                ]);
            }

            // If check in now
            if (! empty($validated['check_in_now']) && ! empty($validated['room_id'])) {
                $room = Room::findOrFail($validated['room_id']);
                $room->update(['status_occupancy' => 'occupied']);

                $stay = Stay::create([
                    'tenant_id' => $user->tenant_id,
                    'reservation_room_id' => $resRoom->id,
                    'room_id' => $room->id,
                    'guest_id' => $guest->id,
                    'checked_in_at' => now(),
                ]);

                $folio->update(['stay_id' => $stay->id]);

                // Post first night charge
                FolioLine::create([
                    'tenant_id' => $user->tenant_id,
                    'folio_id' => $folio->id,
                    'business_date' => $checkIn->toDateString(),
                    'line_type' => 'room',
                    'description' => "Night Accommodation - Room {$room->room_number}",
                    'amount_minor' => $ratePriceMinor,
                    'tax_minor' => (int) ($ratePriceMinor * 0.18 / 1.18),
                    'posted_by' => $user->id,
                ]);
            }

            $folio->recalculateBalance();
        });

        return redirect()->route('reservations.index')->with('success', 'Reservation created successfully!');
    }

    public function checkIn(Request $request, Reservation $reservation): RedirectResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|uuid|exists:rooms,id',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();
        $room = Room::findOrFail($validated['room_id']);

        DB::transaction(function () use ($reservation, $room, $user, $property) {
            $room->update(['status_occupancy' => 'occupied']);

            $reservation->update(['status' => 'checked_in']);

            $resRoom = $reservation->reservationRooms()->first();
            if ($resRoom) {
                $resRoom->update([
                    'room_id' => $room->id,
                    'status' => 'checked_in',
                ]);
            }

            $stay = Stay::create([
                'tenant_id' => $user->tenant_id,
                'reservation_room_id' => $resRoom?->id,
                'room_id' => $room->id,
                'guest_id' => $reservation->guest_id,
                'checked_in_at' => now(),
            ]);

            $folio = $reservation->folios()->first();
            if (! $folio) {
                $folio = Folio::create([
                    'tenant_id' => $user->tenant_id,
                    'property_id' => $property->id,
                    'reservation_id' => $reservation->id,
                    'stay_id' => $stay->id,
                    'folio_number' => sprintf('FOL-%05d', Folio::count() + 1),
                    'owner_type' => 'guest',
                    'owner_id' => $reservation->guest_id,
                    'currency' => $property->currency ?? 'TZS',
                    'status' => 'open',
                ]);
            } else {
                $folio->update(['stay_id' => $stay->id]);
            }

            // Post room charge if not posted yet
            $rateAmount = $resRoom?->rate_price_minor ?? ($reservation->total_minor / max(1, $reservation->check_in->diffInDays($reservation->check_out)));
            FolioLine::create([
                'tenant_id' => $user->tenant_id,
                'folio_id' => $folio->id,
                'business_date' => now()->toDateString(),
                'line_type' => 'room',
                'description' => "Room Charge - {$room->room_number} ({$reservation->ref_no})",
                'amount_minor' => $rateAmount,
                'tax_minor' => (int) ($rateAmount * 0.18 / 1.18),
                'posted_by' => $user->id,
            ]);

            $folio->recalculateBalance();
        });

        return back()->with('success', "Guest successfully checked in to Room {$room->room_number}!");
    }

    public function checkOut(Request $request, Reservation $reservation): RedirectResponse
    {
        $user = $request->user();

        DB::transaction(function () use ($reservation, $user) {
            $resRoom = $reservation->reservationRooms()->first();
            $room = $resRoom?->room;

            $reservation->update(['status' => 'checked_out']);

            if ($resRoom) {
                $resRoom->update(['status' => 'checked_out']);
            }

            $stay = Stay::where('reservation_room_id', $resRoom?->id)->whereNull('checked_out_at')->first();
            if ($stay) {
                $stay->update(['checked_out_at' => now()]);
            }

            if ($room) {
                $room->update([
                    'status_occupancy' => 'vacant',
                    'status_hk' => 'dirty',
                ]);

                // Create housekeeping cleaning task
                HousekeepingTask::create([
                    'tenant_id' => $user->tenant_id,
                    'property_id' => $reservation->property_id,
                    'room_id' => $room->id,
                    'task_type' => 'checkout_clean',
                    'priority' => 'high',
                    'status' => 'pending',
                    'notes' => "Guest checked out ({$reservation->ref_no}). Full departure turnover required.",
                ]);
            }

            $folio = $reservation->folios()->first();
            if ($folio && $folio->balance_minor <= 0) {
                $folio->update(['status' => 'closed']);
            }
        });

        return back()->with('success', 'Guest checked out successfully! Room has been marked Dirty for Housekeeping.');
    }

    public function cancel(Request $request, Reservation $reservation): RedirectResponse
    {
        DB::transaction(function () use ($reservation) {
            $reservation->update(['status' => 'cancelled']);
            $reservation->reservationRooms()->update(['status' => 'cancelled']);
        });

        return back()->with('success', 'Reservation has been cancelled.');
    }
}
