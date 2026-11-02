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
use App\Models\SystemNotification;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status');
        if (! $status) {
            if ($request->routeIs('reservations.checkin')) {
                $status = 'confirmed';
            } elseif ($request->routeIs('reservations.checkout')) {
                $status = 'checked_in';
            }
        }
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

        $user = $request->user();
        $property = $user?->property ?? Property::find(session('current_property_id')) ?? Property::first();

        $rooms = Room::with('roomType')->where('is_active', true)->get();
        $roomTypes = RoomType::where('is_active', true)->get();
        $ratePlans = RatePlan::where('is_active', true)->get();

        if ($property) {
            if ($ratePlans->isEmpty()) {
                $ratePlans = RatePlan::ensureDefaultsForProperty($property);
            }
            if ($rooms->isEmpty()) {
                RoomType::ensureDefaultsForProperty($property);
                $rooms = Room::with('roomType')->where('is_active', true)->get();
                $roomTypes = RoomType::where('is_active', true)->get();
            }
        }

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
        // Sanitize empty strings for nullable UUID/foreign key fields
        $cleanup = [];
        foreach (['guest_id', 'room_type_id', 'room_id', 'rate_plan_id'] as $field) {
            if ($request->has($field) && ($request->input($field) === '' || $request->input($field) === 'null')) {
                $cleanup[$field] = null;
            }
        }
        if (! empty($cleanup)) {
            $request->merge($cleanup);
        }

        // Auto-split guest_name if first_name/last_name are missing
        if ($request->has('guest_name') && ! $request->filled('first_name')) {
            $parts = explode(' ', trim($request->input('guest_name')), 2);
            $request->merge([
                'first_name' => $parts[0] ?? 'Guest',
                'last_name' => $parts[1] ?? ($parts[0] ?? 'Guest'),
            ]);
        }
        if ($request->has('guest_phone') && ! $request->filled('phone')) {
            $request->merge(['phone' => $request->input('guest_phone')]);
        }
        if ($request->has('guest_email') && ! $request->filled('email')) {
            $request->merge(['email' => $request->input('guest_email')]);
        }

        $source = $request->input('source');
        if (! in_array($source, ['walk_in', 'phone', 'email', 'website', 'booking_com', 'agent', 'corporate'])) {
            $request->merge(['source' => 'walk_in']);
        }

        $validated = $request->validate([
            'guest_id' => 'nullable|string|uuid',
            'first_name' => 'required_without:guest_id|nullable|string|max:100',
            'last_name' => 'required_without:guest_id|nullable|string|max:100',
            'gender' => 'nullable|string|max:20',
            'age' => 'nullable|integer|min:1|max:130',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'nationality' => 'nullable|string|max:50',
            'tribe' => 'nullable|string|max:100',
            'id_type' => 'nullable|string|max:50',
            'id_number' => 'nullable|string|max:50',
            'origin' => 'nullable|string|max:150',
            'destination' => 'nullable|string|max:150',
            'vehicle_reg_no' => 'nullable|string|max:50',
            'check_in_time' => 'nullable|string|max:20',
            'check_out_time' => 'nullable|string|max:20',
            'room_type_id' => 'nullable|string',
            'room_id' => 'nullable|string',
            'room_ids' => 'nullable|array',
            'rate_plan_id' => 'nullable|string',
            'check_in' => 'required|date',
            'check_out' => 'required|date|after:check_in',
            'adults' => 'required|integer|min:1',
            'children' => 'nullable|integer|min:0',
            'source' => 'required|string',
            'rate_price' => 'nullable|numeric|min:0',
            'deposit' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|max:50',
            'receipt_no' => 'nullable|string|max:100',
            'guest_signature' => 'nullable|boolean',
            'receptionist_name' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'check_in_now' => 'nullable|boolean',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id ?? Tenant::first()?->id;

        // Resolve room and room type intelligently if not explicitly given
        $selectedRoomIds = ! empty($validated['room_ids']) ? $validated['room_ids'] : array_filter([$validated['room_id'] ?? null]);
        $primaryRoomId = $selectedRoomIds[0] ?? $validated['room_id'] ?? null;
        $primaryRoom = $primaryRoomId ? Room::find($primaryRoomId) : null;

        $roomTypeId = $validated['room_type_id']
            ?? ($primaryRoom?->room_type_id ?? RoomType::where('is_active', true)->first()?->id);
        $roomType = $roomTypeId ? RoomType::find($roomTypeId) : null;

        $ratePlanId = $validated['rate_plan_id']
            ?? RatePlan::where('is_active', true)->first()?->id;

        $ratePrice = isset($validated['rate_price']) && is_numeric($validated['rate_price']) && $validated['rate_price'] > 0
            ? (float) $validated['rate_price']
            : (($roomType?->base_price_minor ?? 35000000) / 100);

        DB::transaction(function () use ($validated, $user, $property, $tenantId, $selectedRoomIds, $primaryRoomId, $roomTypeId, $ratePlanId, $ratePrice) {
            // Find or create guest
            if (! empty($validated['guest_id'])) {
                $guest = Guest::findOrFail($validated['guest_id']);
                $guestUpdates = array_filter([
                    'phone' => $validated['phone'] ?? null,
                    'email' => $validated['email'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                    'age' => $validated['age'] ?? null,
                    'nationality' => $validated['nationality'] ?? null,
                    'tribe' => $validated['tribe'] ?? null,
                    'id_type' => $validated['id_type'] ?? null,
                    'id_number' => $validated['id_number'] ?? null,
                    'origin' => $validated['origin'] ?? null,
                    'destination' => $validated['destination'] ?? null,
                    'vehicle_reg_no' => $validated['vehicle_reg_no'] ?? null,
                ]);
                if (! empty($guestUpdates)) {
                    $guest->update($guestUpdates);
                }
            } else {
                $firstName = ! empty($validated['first_name']) ? $validated['first_name'] : 'Walk-In';
                $lastName = ! empty($validated['last_name']) ? $validated['last_name'] : 'Guest';
                $guest = Guest::create([
                    'tenant_id' => $tenantId,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'gender' => $validated['gender'] ?? null,
                    'age' => $validated['age'] ?? null,
                    'phone' => $validated['phone'] ?? null,
                    'email' => $validated['email'] ?? null,
                    'nationality' => $validated['nationality'] ?? 'Tanzanian',
                    'tribe' => $validated['tribe'] ?? null,
                    'id_type' => $validated['id_type'] ?? 'national_id',
                    'id_number' => $validated['id_number'] ?? null,
                    'origin' => $validated['origin'] ?? null,
                    'destination' => $validated['destination'] ?? null,
                    'vehicle_reg_no' => $validated['vehicle_reg_no'] ?? null,
                ]);
            }

            // Calculate nights and total amount
            $checkIn = Carbon::parse($validated['check_in']);
            $checkOut = Carbon::parse($validated['check_out']);
            $nights = max(1, $checkIn->diffInDays($checkOut));
            $ratePriceMinor = (int) ($ratePrice * 100);
            $roomCount = max(1, count($selectedRoomIds));
            $totalMinor = $ratePriceMinor * $nights * $roomCount;
            $depositMinor = ! empty($validated['deposit']) ? (int) ($validated['deposit'] * 100) : 0;

            // Generate guaranteed unique Ref No
            $year = now()->year;
            do {
                $refNo = sprintf('RES-%d-%04d%s', $year, rand(1000, 9999), strtoupper(Str::random(2)));
            } while (Reservation::where('ref_no', $refNo)->where('property_id', $property->id)->exists());

            $status = ! empty($validated['check_in_now']) ? 'checked_in' : 'confirmed';

            // Generate receipt number if advance paid
            $receiptNo = $validated['receipt_no'] ?? null;
            if (empty($receiptNo) && $depositMinor > 0) {
                $receiptNo = sprintf('RCT-%s-%04d', now()->format('ym'), rand(1000, 9999));
            }

            $reservation = Reservation::create([
                'tenant_id' => $tenantId,
                'property_id' => $property->id,
                'ref_no' => $refNo,
                'guest_id' => $guest->id,
                'source' => $validated['source'],
                'status' => $status,
                'check_in' => $validated['check_in'],
                'check_in_time' => $validated['check_in_time'] ?? now()->format('H:i'),
                'check_out' => $validated['check_out'],
                'check_out_time' => $validated['check_out_time'] ?? '10:00',
                'adults' => $validated['adults'],
                'children' => $validated['children'] ?? 0,
                'origin' => $validated['origin'] ?? null,
                'destination' => $validated['destination'] ?? null,
                'vehicle_reg_no' => $validated['vehicle_reg_no'] ?? null,
                'total_minor' => $totalMinor,
                'deposit_minor' => $depositMinor,
                'receipt_no' => $receiptNo,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'guest_signature' => ! empty($validated['guest_signature']),
                'receptionist_name' => $validated['receptionist_name'] ?? $user->name,
                'notes' => $validated['notes'] ?? null,
                'created_by' => $user->id,
            ]);

            // Create ReservationRoom for each room selected (or primary room)
            $createdRooms = [];
            if (! empty($selectedRoomIds)) {
                foreach ($selectedRoomIds as $rId) {
                    $rmObj = Room::find($rId);
                    $rtId = $rmObj?->room_type_id ?? $roomTypeId;
                    $createdRooms[] = ReservationRoom::create([
                        'tenant_id' => $tenantId,
                        'reservation_id' => $reservation->id,
                        'room_type_id' => $rtId,
                        'room_id' => $rId,
                        'rate_plan_id' => $ratePlanId,
                        'check_in' => $validated['check_in'],
                        'check_out' => $validated['check_out'],
                        'rate_price_minor' => $ratePriceMinor,
                        'status' => $status,
                    ]);
                }
            } else {
                $createdRooms[] = ReservationRoom::create([
                    'tenant_id' => $tenantId,
                    'reservation_id' => $reservation->id,
                    'room_type_id' => $roomTypeId,
                    'room_id' => $primaryRoomId,
                    'rate_plan_id' => $ratePlanId,
                    'check_in' => $validated['check_in'],
                    'check_out' => $validated['check_out'],
                    'rate_price_minor' => $ratePriceMinor,
                    'status' => $status,
                ]);
            }

            $primaryResRoom = $createdRooms[0];

            // Create Folio
            $folioNumber = sprintf('FOL-%05d', Folio::count() + 1);
            $folio = Folio::create([
                'tenant_id' => $tenantId,
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
                    'tenant_id' => $tenantId,
                    'folio_id' => $folio->id,
                    'business_date' => $checkIn->toDateString(),
                    'payment_method' => $validated['payment_method'] ?? 'cash',
                    'provider_ref' => $receiptNo,
                    'amount_minor' => $depositMinor,
                    'currency' => $property->currency ?? 'TZS',
                    'status' => 'confirmed',
                    'received_by' => $user->id,
                    'notes' => 'Booking advance deposit' . ($receiptNo ? ' (Receipt: ' . $receiptNo . ')' : ''),
                ]);
            }

            // If check in now
            if (! empty($validated['check_in_now'])) {
                foreach ($createdRooms as $rr) {
                    if ($rr->room_id) {
                        $rm = Room::find($rr->room_id);
                        if ($rm) {
                            $rm->update(['status_occupancy' => 'occupied']);
                            $stay = Stay::create([
                                'tenant_id' => $tenantId,
                                'reservation_room_id' => $rr->id,
                                'room_id' => $rm->id,
                                'guest_id' => $guest->id,
                                'checked_in_at' => now(),
                            ]);
                            $folio->update(['stay_id' => $stay->id]);

                            // Post first night charge
                            FolioLine::create([
                                'tenant_id' => $tenantId,
                                'folio_id' => $folio->id,
                                'business_date' => $checkIn->toDateString(),
                                'line_type' => 'room',
                                'description' => "Night Accommodation - Room {$rm->room_number}",
                                'amount_minor' => $ratePriceMinor,
                                'tax_minor' => (int) ($ratePriceMinor * 0.18 / 1.18),
                                'posted_by' => $user->id,
                            ]);
                        }
                    }
                }
            }

            $folio->recalculateBalance();
        });

        try {
            SystemNotification::send(
                tenantId: $tenantId,
                title: 'New Booking Created',
                message: "New reservation created for check-in: {$validated['check_in']} to {$validated['check_out']}.",
                category: 'reservation',
                severity: 'info',
                actionUrl: route('reservations.index'),
                targetRole: 'receptionist',
                propertyId: $property?->id
            );
        } catch (\Throwable $e) {
        }

        if ($request->headers->has('referer')) {
            return back()->with('success', 'Reservation created successfully!');
        }

        return redirect()->route('reservations.index')->with('success', 'Reservation created successfully!');
    }

    public function checkIn(Request $request, Reservation $reservation): RedirectResponse
    {
        $source = $request->input('source');
        if (! in_array($source, ['walk_in', 'phone', 'email', 'website', 'booking_com', 'agent', 'corporate'])) {
            $request->merge(['source' => 'walk_in']);
        }

        $validated = $request->validate([
            'room_id' => 'required|uuid|exists:rooms,id',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();
        $room = Room::findOrFail($validated['room_id']);
        $tenantId = $reservation->tenant_id ?? $user->tenant_id ?? $property?->tenant_id ?? Tenant::first()?->id;

        DB::transaction(function () use ($reservation, $room, $user, $property, $tenantId) {
            $room->update(['status_occupancy' => 'occupied']);

            $reservation->update(['status' => 'checked_in']);

            $resRoom = $reservation->reservationRooms()->first();
            if (! $resRoom) {
                $resRoom = ReservationRoom::create([
                    'tenant_id' => $tenantId,
                    'reservation_id' => $reservation->id,
                    'room_type_id' => $room->room_type_id,
                    'room_id' => $room->id,
                    'rate_plan_id' => RatePlan::first()?->id ?? '',
                    'check_in' => $reservation->check_in,
                    'check_out' => $reservation->check_out,
                    'rate_price_minor' => $room->roomType?->base_price_minor ?? 35000000,
                    'status' => 'checked_in',
                ]);
            } else {
                $resRoom->update([
                    'room_id' => $room->id,
                    'status' => 'checked_in',
                ]);
            }

            $stay = Stay::create([
                'tenant_id' => $tenantId,
                'reservation_room_id' => $resRoom->id,
                'room_id' => $room->id,
                'guest_id' => $reservation->guest_id,
                'checked_in_at' => now(),
            ]);

            $folio = $reservation->folios()->first();
            if (! $folio) {
                $folio = Folio::create([
                    'tenant_id' => $tenantId,
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
                'tenant_id' => $tenantId,
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
        $tenantId = $reservation->tenant_id ?? $user->tenant_id ?? Tenant::first()?->id;

        DB::transaction(function () use ($reservation, $tenantId) {
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
                    'tenant_id' => $tenantId,
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

    public function update(Request $request, Reservation $reservation): RedirectResponse
    {
        $source = $request->input('source');
        if (! in_array($source, ['walk_in', 'phone', 'email', 'website', 'booking_com', 'agent', 'corporate'])) {
            $request->merge(['source' => 'walk_in']);
        }

        $validated = $request->validate([
            'check_in' => 'nullable|date',
            'check_out' => 'nullable|date|after:check_in',
            'room_id' => 'nullable|uuid|exists:rooms,id',
            'rate_price' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($reservation, $validated) {
            $checkIn = ! empty($validated['check_in']) ? Carbon::parse($validated['check_in']) : $reservation->check_in;
            $checkOut = ! empty($validated['check_out']) ? Carbon::parse($validated['check_out']) : $reservation->check_out;

            $reservation->check_in = $checkIn;
            $reservation->check_out = $checkOut;

            if (isset($validated['rate_price']) && is_numeric($validated['rate_price'])) {
                $nights = max(1, $checkIn->diffInDays($checkOut));
                $reservation->total_minor = (int) ($validated['rate_price'] * 100 * $nights);
            }

            $reservation->save();

            foreach ($reservation->reservationRooms as $rr) {
                $rr->check_in = $checkIn;
                $rr->check_out = $checkOut;
                if (! empty($validated['room_id'])) {
                    $rr->room_id = $validated['room_id'];
                }
                if (isset($validated['rate_price']) && is_numeric($validated['rate_price'])) {
                    $rr->rate_price_minor = (int) ($validated['rate_price'] * 100);
                }
                $rr->save();
            }
        });

        return back()->with('success', 'Reservation stay amended successfully!');
    }
}
