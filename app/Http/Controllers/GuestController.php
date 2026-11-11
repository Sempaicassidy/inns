<?php

namespace App\Http\Controllers;

use App\Models\Folio;
use App\Models\Guest;
use App\Models\RatePlan;
use App\Models\Room;
use App\Models\RoomType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GuestController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search', '');
        $statusFilter = $request->input('filter', 'all'); // all, in_house, has_balance, vip, checked_out

        $query = Guest::query()
            ->with([
                'reservations' => function ($q) {
                    $q->with([
                        'reservationRooms.room.roomType',
                        'folios' => function ($fq) {
                            $fq->select('id', 'reservation_id', 'folio_number', 'status', 'total_charges_minor', 'total_payments_minor', 'balance_minor');
                        },
                    ])->orderBy('check_in', 'desc');
                },
                'stays' => function ($sq) {
                    $sq->with('room.roomType')->orderBy('checked_in_at', 'desc');
                },
            ]);

        // Search Filter
        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('id_number', 'like', "%{$search}%")
                    ->orWhereHas('reservations.reservationRooms.room', function ($rq) use ($search) {
                        $rq->where('room_number', 'like', "%{$search}%");
                    });
            });
        }

        // Status filter
        if ($statusFilter === 'in_house') {
            $query->whereHas('reservations', function ($q) {
                $q->where('status', 'checked_in');
            });
        } elseif ($statusFilter === 'has_balance') {
            $query->whereHas('reservations.folios', function ($q) {
                $q->where('balance_minor', '>', 0);
            });
        } elseif ($statusFilter === 'vip') {
            $query->where('vip_level', '!=', 'Standard')->whereNotNull('vip_level');
        } elseif ($statusFilter === 'checked_out') {
            $query->whereHas('reservations', function ($q) {
                $q->where('status', 'checked_out');
            });
        }

        // Get Paginated Guests
        $guests = $query->latest()->paginate(15)->withQueryString();

        // Calculate Overview Statistics
        $totalGuests = Guest::count();
        $inHouseGuests = Guest::whereHas('reservations', function ($q) {
            $q->where('status', 'checked_in');
        })->count();

        // Calculate total outstanding balance across all guests
        $totalOutstandingMinor = Folio::where('balance_minor', '>', 0)->sum('balance_minor');
        $vipGuestsCount = Guest::where('vip_level', '!=', 'Standard')->whereNotNull('vip_level')->count();

        // Extra data for Quick Reservation Modal
        $rooms = Room::with('roomType')->where('is_active', true)->orderBy('room_number')->get();
        $roomTypes = RoomType::where('is_active', true)->get();
        $ratePlans = RatePlan::where('is_active', true)->get();

        return Inertia::render('Guests/Index', [
            'guests' => $guests,
            'stats' => [
                'total_guests' => $totalGuests,
                'in_house_guests' => $inHouseGuests,
                'total_outstanding_minor' => $totalOutstandingMinor,
                'vip_guests_count' => $vipGuestsCount,
            ],
            'filters' => [
                'search' => $search,
                'filter' => $statusFilter,
            ],
            'rooms' => $rooms,
            'roomTypes' => $roomTypes,
            'ratePlans' => $ratePlans,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'nationality' => 'nullable|string|max:50',
            'is_resident' => 'nullable|boolean',
            'id_type' => 'nullable|string|in:national_id,passport,driving_license,voter_id,other',
            'id_number' => 'nullable|string|max:50',
            'vip_level' => 'nullable|string|max:30',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id;

        Guest::create([
            'tenant_id' => $tenantId,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'nationality' => $validated['nationality'] ?? 'Tanzanian',
            'is_resident' => $validated['is_resident'] ?? true,
            'id_type' => $validated['id_type'] ?? 'national_id',
            'id_number' => $validated['id_number'] ?? null,
            'vip_level' => $validated['vip_level'] ?? 'Standard',
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Guest registered successfully!');
    }

    public function update(Request $request, Guest $guest): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'nationality' => 'nullable|string|max:50',
            'is_resident' => 'nullable|boolean',
            'id_type' => 'nullable|string',
            'id_number' => 'nullable|string|max:50',
            'vip_level' => 'nullable|string|max:30',
            'notes' => 'nullable|string',
        ]);

        $guest->update($validated);

        return back()->with('success', 'Guest information updated successfully!');
    }
}
