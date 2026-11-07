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
use App\Services\ManagerNotificationService;
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

        // Strictly enforce 1 room per reservation
        $selectedRoomIds = ! empty($validated['room_ids']) ? array_slice($validated['room_ids'], 0, 1) : array_filter([$validated['room_id'] ?? null]);
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

        $checkInDate = Carbon::parse($validated['check_in'])->startOfDay();
        $checkOutDate = Carbon::parse($validated['check_out'])->endOfDay();

        // 1. Resolve guest identity if existing (to detect duplicate concurrent room bookings)
        $targetGuestId = $validated['guest_id'] ?? null;
        if (! $targetGuestId) {
            // Try matching by phone
            if (! empty($validated['phone'])) {
                $targetGuestId = Guest::where('tenant_id', $tenantId)->where('phone', $validated['phone'])->value('id');
            }
            // Try matching by ID number
            if (! $targetGuestId && ! empty($validated['id_number'])) {
                $targetGuestId = Guest::where('tenant_id', $tenantId)->where('id_number', $validated['id_number'])->value('id');
            }
            // Try matching by email
            if (! $targetGuestId && ! empty($validated['email'])) {
                $targetGuestId = Guest::where('tenant_id', $tenantId)->where('email', $validated['email'])->value('id');
            }
            // Try matching by exact full name as a last resort (case-insensitive)
            if (! $targetGuestId && ! empty($validated['first_name']) && ! empty($validated['last_name'])) {
                $targetGuestId = Guest::where('tenant_id', $tenantId)
                    ->whereRaw('LOWER(first_name) = ?', [strtolower(trim($validated['first_name']))])
                    ->whereRaw('LOWER(last_name) = ?', [strtolower(trim($validated['last_name']))])
                    ->value('id');
            }
        }

        // 2. CONFLICT CHECK: A single guest cannot be reserved or checked into multiple rooms for overlapping dates
        if ($targetGuestId) {
            $guestConflict = Reservation::where('tenant_id', $tenantId)
                ->where('guest_id', $targetGuestId)
                ->whereIn('status', ['confirmed', 'checked_in'])
                ->where(function ($q) use ($checkInDate, $checkOutDate) {
                    $q->where('check_in', '<', $checkOutDate->toDateString())
                      ->where('check_out', '>', $checkInDate->toDateString());
                })
                ->with(['reservationRooms.room', 'guest'])
                ->first();

            if ($guestConflict) {
                $existingRoom = $guestConflict->reservationRooms->first()?->room?->room_number ?? 'another room';
                $guestName = $guestConflict->guest ? ($guestConflict->guest->first_name . ' ' . $guestConflict->guest->last_name) : 'Guest';
                $statusStr = $guestConflict->status === 'checked_in' ? 'checked-in (active stay)' : 'confirmed';
                $inFmt = Carbon::parse($guestConflict->check_in)->format('d M Y');
                $outFmt = Carbon::parse($guestConflict->check_out)->format('d M Y');

                return back()->withErrors([
                    'guest_id' => "Conflict: {$guestName} is {$statusStr} in Room {$existingRoom} from {$inFmt} to {$outFmt}. A guest cannot be reserved or checked into two rooms at the same time.",
                ])->withInput();
            }
        }

        // 3. CONFLICT CHECK: The selected Room cannot be double-booked for overlapping dates
        if ($primaryRoomId) {
            $roomConflict = ReservationRoom::where('tenant_id', $tenantId)
                ->where('room_id', $primaryRoomId)
                ->whereHas('reservation', fn ($q) => $q->where('tenant_id', $tenantId)->whereIn('status', ['confirmed', 'checked_in']))
                ->where(function ($q) use ($checkInDate, $checkOutDate) {
                    $q->where('check_in', '<', $checkOutDate->toDateString())
                      ->where('check_out', '>', $checkInDate->toDateString());
                })
                ->with(['reservation.guest', 'room'])
                ->first();

            if ($roomConflict) {
                $roomNum = $roomConflict->room?->room_number ?? $primaryRoom?->room_number ?? 'this room';
                $bookedBy = $roomConflict->reservation?->guest ? ($roomConflict->reservation->guest->first_name . ' ' . $roomConflict->reservation->guest->last_name) : 'another guest';
                $inFmt = Carbon::parse($roomConflict->check_in)->format('d M Y');
                $outFmt = Carbon::parse($roomConflict->check_out)->format('d M Y');

                return back()->withErrors([
                    'room_id' => "Room {$roomNum} is already reserved by {$bookedBy} from {$inFmt} to {$outFmt}. Please choose an available room.",
                ])->withInput();
            }
        }

        $createdReservation = null;

        DB::transaction(function () use (&$createdReservation, $validated, $user, $property, $tenantId, $primaryRoomId, $roomTypeId, $ratePlanId, $ratePrice) {
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

            // Calculate nights and total amount (strictly 1 room)
            $checkIn = Carbon::parse($validated['check_in']);
            $checkOut = Carbon::parse($validated['check_out']);
            $nights = max(1, $checkIn->diffInDays($checkOut));
            $ratePriceMinor = (int) ($ratePrice * 100);
            $totalMinor = $ratePriceMinor * $nights;
            $depositMinor = ! empty($validated['deposit']) ? (int) ($validated['deposit'] * 100) : 0;

            // Generate guaranteed unique Ref No
            $year = now()->year;
            do {
                $refNo = sprintf('RES-%d-%04d%s', $year, rand(1000, 9999), strtoupper(Str::random(2)));
            } while (Reservation::where('ref_no', $refNo)->where('property_id', $property->id)->exists());

            $status = ! empty($validated['check_in_now']) ? 'checked_in' : 'confirmed';

            // Generate receipt number if advance paid
            $receiptNo = null;
            if ($depositMinor > 0) {
                $candidate = ! empty($validated['receipt_no']) && str_starts_with($validated['receipt_no'], 'RCT-')
                    ? $validated['receipt_no']
                    : sprintf('RCT-%s-%04d', now()->format('ym'), rand(1000, 9999));

                while (Reservation::where('receipt_no', $candidate)->where('property_id', $property->id)->exists()) {
                    $candidate = sprintf('RCT-%s-%04d', now()->format('ym'), rand(1000, 9999));
                }
                $receiptNo = $candidate;
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

            $createdReservation = $reservation;

            // Create single ReservationRoom
            $rmObj = $primaryRoomId ? Room::find($primaryRoomId) : null;
            $rtId = $rmObj?->room_type_id ?? $roomTypeId;
            $createdRoom = ReservationRoom::create([
                'tenant_id' => $tenantId,
                'reservation_id' => $reservation->id,
                'room_type_id' => $rtId,
                'room_id' => $primaryRoomId,
                'rate_plan_id' => $ratePlanId,
                'check_in' => $validated['check_in'],
                'check_out' => $validated['check_out'],
                'rate_price_minor' => $ratePriceMinor,
                'status' => $status,
            ]);

            $createdRooms = [$createdRoom];
            $primaryResRoom = $createdRoom;

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

        // Trigger Instant Manager Alert (SMS, WhatsApp & Email) on room reservation
        if ($createdReservation) {
            try {
                app(ManagerNotificationService::class)->notifyReservationCreated($createdReservation);
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Failed sending manager reservation notification: ' . $e->getMessage());
            }
        }

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

        // 1a. Conflict Check: Verify guest has no OTHER active/confirmed reservation for overlapping dates
        $existingConfirmed = Reservation::where('tenant_id', $tenantId)
            ->where('guest_id', $reservation->guest_id)
            ->where('id', '!=', $reservation->id)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->where('check_in', '<', $reservation->check_out)
            ->where('check_out', '>', $reservation->check_in)
            ->with(['reservationRooms.room'])
            ->first();

        if ($existingConfirmed) {
            $otherRoom = $existingConfirmed->reservationRooms->first()?->room?->room_number ?? 'another room';
            $inFmt = Carbon::parse($existingConfirmed->check_in)->format('d M Y');
            $outFmt = Carbon::parse($existingConfirmed->check_out)->format('d M Y');
            return back()->withErrors([
                'room_id' => "Conflict: Guest already has a reservation (#{$existingConfirmed->ref_no}) in Room {$otherRoom} from {$inFmt} to {$outFmt}. Cancel or check out that reservation first.",
            ]);
        }

        // 1b. Conflict Check: Verify guest is not already active & checked in to another room
        $activeStay = Stay::where('guest_id', $reservation->guest_id)
            ->whereNull('checked_out_at')
            ->where('room_id', '!=', $room->id)
            ->with('room')
            ->first();

        if ($activeStay) {
            $otherRoom = $activeStay->room?->room_number ?? 'another room';
            return back()->withErrors([
                'room_id' => "Conflict: Guest is already checked in to Room {$otherRoom}. A guest cannot occupy multiple rooms simultaneously. Please check out the guest from Room {$otherRoom} first.",
            ]);
        }

        // 2. Conflict Check: Target room is not currently occupied
        if ($room->status_occupancy === 'occupied') {
            return back()->withErrors([
                'room_id' => "Room {$room->room_number} is currently occupied by another active guest.",
            ]);
        }

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
                    'rate_price_minor' => $room->roomType?->base_price_minor ?? 0,
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

        $checkIn = ! empty($validated['check_in']) ? Carbon::parse($validated['check_in'])->startOfDay() : Carbon::parse($reservation->check_in)->startOfDay();
        $checkOut = ! empty($validated['check_out']) ? Carbon::parse($validated['check_out'])->endOfDay() : Carbon::parse($reservation->check_out)->endOfDay();
        $targetRoomId = $validated['room_id'] ?? $reservation->reservationRooms->first()?->room_id;

        // 1. Conflict Check: Guest cannot hold another active booking during these dates
        $guestConflict = Reservation::where('tenant_id', $reservation->tenant_id)
            ->where('id', '!=', $reservation->id)
            ->where('guest_id', $reservation->guest_id)
            ->whereIn('status', ['confirmed', 'checked_in'])
            ->where(function ($q) use ($checkIn, $checkOut) {
                $q->where('check_in', '<', $checkOut->toDateString())
                  ->where('check_out', '>', $checkIn->toDateString());
            })
            ->with(['reservationRooms.room'])
            ->first();

        if ($guestConflict) {
            $existingRoom = $guestConflict->reservationRooms->first()?->room?->room_number ?? 'another room';
            return back()->withErrors([
                'check_in' => "Conflict: Guest already has an active booking in Room {$existingRoom} for overlapping dates. A guest cannot be reserved in two rooms simultaneously.",
            ]);
        }

        // 2. Conflict Check: Room cannot be double-booked
        if ($targetRoomId) {
            $roomConflict = ReservationRoom::where('room_id', $targetRoomId)
                ->where('reservation_id', '!=', $reservation->id)
                ->whereHas('reservation', fn ($q) => $q->whereIn('status', ['confirmed', 'checked_in']))
                ->where(function ($q) use ($checkIn, $checkOut) {
                    $q->where('check_in', '<', $checkOut->toDateString())
                      ->where('check_out', '>', $checkIn->toDateString());
                })
                ->first();

            if ($roomConflict) {
                return back()->withErrors([
                    'room_id' => "Conflict: The selected room is already booked by another reservation for overlapping dates.",
                ]);
            }
        }

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
