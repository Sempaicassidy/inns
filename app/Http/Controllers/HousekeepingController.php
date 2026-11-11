<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\HousekeepingTask;
use App\Models\Property;
use App\Models\RatePlan;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\SystemNotification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HousekeepingController extends Controller
{
    public function index(Request $request): Response
    {
        $statusHk = $request->input('status_hk');
        $statusOccupancy = $request->input('status_occupancy');
        $floor = $request->input('floor');
        $roomTypeId = $request->input('room_type_id');
        $search = $request->input('search');

        $user = $request->user();
        $property = $this->resolveActiveProperty($request);
        if ($property) {
            RoomType::ensureDefaultsForProperty($property);
            RatePlan::ensureDefaultsForProperty($property);
        }
        $bDateRecord = $property ? BusinessDate::where('property_id', $property->id)->first() : null;
        $todayStr = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date)->toDateString() : Carbon::today()->toDateString();

        // Base query for all active rooms to calculate total stats
        $allActiveRooms = Room::with('roomType')
            ->where('is_active', true)
            ->get();

        // Filtered rooms
        $rooms = Room::with([
            'roomType',
            'housekeepingTasks' => function ($q) {
                $q->whereIn('status', ['pending', 'in_progress'])
                    ->with('assignee')
                    ->latest();
            },
            'reservationRooms' => function ($q) use ($todayStr) {
                $q->whereIn('status', ['checked_in', 'confirmed'])
                    ->where('check_in', '<=', $todayStr)
                    ->where('check_out', '>=', $todayStr)
                    ->with(['reservation.guest', 'reservation.folios'])
                    ->latest();
            },
            'stays' => function ($q) {
                $q->whereNull('checked_out_at')
                    ->with(['guest', 'reservationRoom.reservation.folios'])
                    ->latest();
            },
        ])
            ->where('is_active', true)
            ->when($statusHk, fn ($q) => $q->where('status_hk', $statusHk))
            ->when($statusOccupancy, fn ($q) => $q->where('status_occupancy', $statusOccupancy))
            ->when($floor, fn ($q) => $q->where('floor', $floor))
            ->when($roomTypeId, fn ($q) => $q->where('room_type_id', $roomTypeId))
            ->when($search, function ($q, $term) {
                $q->where(function ($sub) use ($term) {
                    $sub->where('room_number', 'like', "%{$term}%")
                        ->orWhere('floor', 'like', "%{$term}%")
                        ->orWhereHas('roomType', fn ($rt) => $rt->where('name', 'like', "%{$term}%"));
                });
            })
            ->orderBy('room_number')
            ->get()
            ->map(function ($room) use ($todayStr) {
                $activeStay = $room->stays->first();
                $activeResRoom = $room->reservationRooms->first();

                $guestName = null;
                $guestPhone = null;
                $checkInDate = null;
                $checkOutDate = null;
                $folioId = null;
                $folioBalanceMinor = 0;
                $reservationId = null;
                $reservationNumber = null;

                if ($activeStay && $activeStay->guest) {
                    $guestName = $activeStay->guest->full_name ?? ($activeStay->guest->first_name.' '.$activeStay->guest->last_name);
                    $guestPhone = $activeStay->guest->phone;
                    $checkInDate = $activeStay->checked_in_at ? Carbon::parse($activeStay->checked_in_at)->toDateString() : null;
                    $res = $activeStay->reservationRoom?->reservation;
                    if ($res) {
                        $reservationId = $res->id;
                        $reservationNumber = $res->reservation_number ?? substr($res->id, 0, 8);
                        $checkOutDate = $activeStay->reservationRoom?->check_out ? Carbon::parse($activeStay->reservationRoom->check_out)->toDateString() : null;
                        $folio = $res->folios->first();
                        if ($folio) {
                            $folioId = $folio->id;
                            $folioBalanceMinor = (int) ($folio->balance_minor ?? ($folio->total_charges_minor - $folio->total_payments_minor));
                        }
                    }
                } elseif ($activeResRoom && $activeResRoom->reservation) {
                    $res = $activeResRoom->reservation;
                    $reservationId = $res->id;
                    $reservationNumber = $res->reservation_number ?? substr($res->id, 0, 8);
                    $guest = $res->guest;
                    if ($guest) {
                        $guestName = $guest->full_name ?? ($guest->first_name.' '.$guest->last_name);
                        $guestPhone = $guest->phone;
                    }
                    $checkInDate = $activeResRoom->check_in ? Carbon::parse($activeResRoom->check_in)->toDateString() : null;
                    $checkOutDate = $activeResRoom->check_out ? Carbon::parse($activeResRoom->check_out)->toDateString() : null;
                    $folio = $res->folios->first();
                    if ($folio) {
                        $folioId = $folio->id;
                        $folioBalanceMinor = (int) ($folio->balance_minor ?? ($folio->total_charges_minor - $folio->total_payments_minor));
                    }
                }

                $activeTask = $room->housekeepingTasks->first();

                return [
                    'id' => $room->id,
                    'room_number' => $room->room_number,
                    'room_type_id' => $room->room_type_id,
                    'room_type' => $room->roomType,
                    'floor' => $room->floor ?? 'Ground Floor',
                    'status_occupancy' => $room->status_occupancy,
                    'status_hk' => $room->status_hk,
                    'is_active' => $room->is_active,
                    'current_guest' => $guestName,
                    'current_guest_phone' => $guestPhone,
                    'current_check_in' => $checkInDate,
                    'current_check_out' => $checkOutDate,
                    'current_reservation_id' => $reservationId,
                    'current_reservation_number' => $reservationNumber,
                    'current_folio_id' => $folioId,
                    'current_folio_balance_minor' => $folioBalanceMinor,
                    'is_due_out' => $checkOutDate === $todayStr,
                    'active_task' => $activeTask ? [
                        'id' => $activeTask->id,
                        'task_type' => $activeTask->task_type,
                        'priority' => $activeTask->priority,
                        'status' => $activeTask->status,
                        'assigned_to_name' => $activeTask->assignee?->name ?? 'Unassigned',
                        'notes' => $activeTask->notes,
                    ] : null,
                    'features' => $room->features ?? [],
                    'amenities' => $room->roomType?->amenities ?? [],
                    'description' => $room->roomType?->description,
                    'max_occupancy' => $room->roomType?->max_adults ?? $room->roomType?->base_occupancy,
                ];
            });

        // Tasks in queue
        $tasks = HousekeepingTask::with(['room.roomType', 'assignee'])
            ->whereIn('status', ['pending', 'in_progress'])
            ->latest()
            ->get();

        // Housekeeper list (with fallback to all users if no dedicated housekeeper role exists yet)
        $housekeepers = User::where('role', 'housekeeper')->get();
        if ($housekeepers->isEmpty()) {
            $housekeepers = User::all();
        }

        $floors = Room::distinct()->whereNotNull('floor')->pluck('floor');
        $roomTypes = RoomType::where('is_active', true)->get();

        // Calculate stats
        $totalRooms = $allActiveRooms->count();
        $vacantClean = $allActiveRooms->where('status_occupancy', 'vacant')->whereIn('status_hk', ['clean', 'inspected'])->count();
        $vacantDirty = $allActiveRooms->where('status_occupancy', 'vacant')->where('status_hk', 'dirty')->count();
        $occupied = $allActiveRooms->where('status_occupancy', 'occupied')->count();
        $dirty = $allActiveRooms->where('status_hk', 'dirty')->count();
        $inspected = $allActiveRooms->where('status_hk', 'inspected')->count();
        $outOfService = $allActiveRooms->whereIn('status_hk', ['out_of_order', 'out_of_service'])->count();
        $clean = $allActiveRooms->where('status_hk', 'clean')->count();

        return Inertia::render('Housekeeping/Index', [
            'rooms' => $rooms,
            'roomTypes' => $roomTypes,
            'ratePlans' => $property ? RatePlan::where('property_id', $property->id)->where('is_active', true)->get() : RatePlan::where('is_active', true)->get(),
            'tasks' => $tasks,
            'housekeepers' => $housekeepers,
            'floors' => $floors,
            'filters' => [
                'status_hk' => $statusHk ?? '',
                'status_occupancy' => $statusOccupancy ?? '',
                'floor' => $floor ?? '',
                'room_type_id' => $roomTypeId ?? '',
                'search' => $search ?? '',
            ],
            'stats' => [
                'total' => $totalRooms,
                'vacant_clean' => $vacantClean,
                'vacant_dirty' => $vacantDirty,
                'occupied' => $occupied,
                'clean' => $clean,
                'dirty' => $dirty,
                'inspected' => $inspected,
                'out_of_service' => $outOfService,
                'pending_tasks' => $tasks->count(),
            ],
            'business_date' => $todayStr,
        ]);
    }

    public function storeRoom(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_number' => 'required|string|max:20',
            'room_type_id' => 'required|exists:room_types,id',
            'floor' => 'nullable|string|max:50',
            'status_occupancy' => 'nullable|in:vacant,occupied',
            'status_hk' => 'nullable|in:clean,dirty,inspected,out_of_order,out_of_service',
            'features' => 'nullable|array',
            'features.*' => 'string|max:60',
        ]);

        $user = $request->user();
        $property = $this->resolveActiveProperty($request);
        $tenantId = $property?->tenant_id ?? $user?->tenant_id;

        Room::create([
            'tenant_id' => $tenantId,
            'property_id' => $property ? $property->id : null,
            'room_number' => $validated['room_number'],
            'room_type_id' => $validated['room_type_id'],
            'floor' => $validated['floor'] ?? '1st Floor',
            'status_occupancy' => $validated['status_occupancy'] ?? 'vacant',
            'status_hk' => $validated['status_hk'] ?? 'clean',
            'features' => $validated['features'] ?? [],
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "Room {$validated['room_number']} added successfully.");
    }

    /**
     * Delete a room from the property/lodge.
     */
    public function destroyRoom(Request $request, Room $room): RedirectResponse
    {
        $user = $request->user();

        // 1. Authorization: General Manager, Manager, Owner, or Super Admin
        $canDelete = $user->isSuperAdmin()
            || session()->has('impersonating_original_superadmin_id')
            || in_array($user->role, ['general_manager', 'manager', 'owner', 'admin'])
            || in_array($user->active_role, ['general_manager', 'manager', 'owner', 'admin']);

        if (! $canDelete) {
            return redirect()->back()->with('error', 'Only General Managers or Property Owners have permission to delete rooms.');
        }

        // 2. Safety Check: Occupied room or active stay
        if ($room->status_occupancy === 'occupied') {
            return redirect()->back()->with('error', "Cannot delete Room {$room->room_number} because it is currently marked as OCCUPIED. Please check out the guest or update the room status first.");
        }

        $hasActiveStay = $room->stays()->whereNull('checked_out_at')->exists();
        if ($hasActiveStay) {
            return redirect()->back()->with('error', "Cannot delete Room {$room->room_number} because a guest is currently checked in. Please check out the guest first.");
        }

        // 3. Safety Check: Active reservations for today or future
        $hasActiveReservations = $room->reservationRooms()
            ->whereHas('reservation', function ($q) {
                $q->whereIn('status', ['confirmed', 'checked_in'])
                    ->where('check_out', '>=', now()->toDateString());
            })
            ->exists();

        if ($hasActiveReservations) {
            return redirect()->back()->with('error', "Cannot delete Room {$room->room_number} because it has active upcoming reservations. Please reassign or cancel those reservations first.");
        }

        $roomNumber = $room->room_number;
        $room->delete(); // Soft-deleted safely

        return redirect()->back()->with('success', "Room {$roomNumber} has been deleted successfully.");
    }

    public function updateRoomStatus(Request $request, Room $room): RedirectResponse
    {
        $validated = $request->validate([
            'status_hk' => 'nullable|in:clean,dirty,inspected,out_of_order,out_of_service',
            'status_occupancy' => 'nullable|in:vacant,occupied',
        ]);

        $update = [];
        if (! empty($validated['status_hk'])) {
            $update['status_hk'] = $validated['status_hk'];
        }
        if (! empty($validated['status_occupancy'])) {
            $update['status_occupancy'] = $validated['status_occupancy'];
        }

        if (! empty($update)) {
            $room->update($update);
        }

        // If marked clean or inspected, complete any pending housekeeping task for this room
        if (isset($validated['status_hk']) && in_array($validated['status_hk'], ['clean', 'inspected'])) {
            HousekeepingTask::where('room_id', $room->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->update(['status' => 'completed']);

            SystemNotification::send(
                tenantId: $room->tenant_id,
                title: "Room {$room->room_number} is ".ucfirst($validated['status_hk']),
                message: "Room {$room->room_number} has been marked {$validated['status_hk']}. Ready for front desk check-in assignment.",
                category: 'housekeeping',
                severity: 'success',
                actionUrl: route('housekeeping.status'),
                targetRole: 'receptionist',
                propertyId: $room->property_id
            );
        }

        return back()->with('success', "Room {$room->room_number} status updated.");
    }

    public function createTask(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'room_id' => 'required|uuid|exists:rooms,id',
            'task_type' => 'required|in:checkout_clean,stayover_clean,deep_clean,inspection,touchup',
            'priority' => 'required|in:normal,high,urgent',
            'assigned_to' => 'nullable|exists:users,id',
            'notes' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $property = $this->resolveActiveProperty($request);
        $tenantId = $property?->tenant_id ?? $user?->tenant_id;

        HousekeepingTask::create([
            'tenant_id' => $tenantId,
            'property_id' => $property ? $property->id : null,
            'room_id' => $validated['room_id'],
            'task_type' => $validated['task_type'],
            'priority' => $validated['priority'],
            'status' => 'pending',
            'assigned_to' => $validated['assigned_to'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Housekeeping task assigned successfully!');
    }

    public function updateTaskStatus(Request $request, HousekeepingTask $task): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,inspected',
        ]);

        $task->update(['status' => $validated['status']]);

        if ($validated['status'] === 'completed') {
            $task->room->update(['status_hk' => 'clean']);
        } elseif ($validated['status'] === 'inspected') {
            $task->room->update(['status_hk' => 'inspected']);
        }

        return back()->with('success', 'Task status updated.');
    }
}
