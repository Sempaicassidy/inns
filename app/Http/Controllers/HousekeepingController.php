<?php

namespace App\Http\Controllers;

use App\Models\HousekeepingTask;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HousekeepingController extends Controller
{
    public function index(Request $request): Response
    {
        $statusHk = $request->input('status_hk');
        $floor = $request->input('floor');

        $rooms = Room::with(['roomType', 'housekeepingTasks' => function ($q) {
            $q->whereIn('status', ['pending', 'in_progress'])->latest();
        }])
            ->where('is_active', true)
            ->when($statusHk, fn ($q) => $q->where('status_hk', $statusHk))
            ->when($floor, fn ($q) => $q->where('floor', $floor))
            ->orderBy('room_number')
            ->get();

        $tasks = HousekeepingTask::with(['room.roomType', 'assignee'])
            ->whereIn('status', ['pending', 'in_progress'])
            ->latest()
            ->get();

        $housekeepers = User::where('role', 'housekeeper')->get();
        $floors = Room::distinct()->pluck('floor');

        return Inertia::render('Housekeeping/Index', [
            'rooms' => $rooms,
            'tasks' => $tasks,
            'housekeepers' => $housekeepers,
            'floors' => $floors,
            'filters' => [
                'status_hk' => $statusHk ?? '',
                'floor' => $floor ?? '',
            ],
            'stats' => [
                'total' => $rooms->count(),
                'clean' => $rooms->where('status_hk', 'clean')->count(),
                'dirty' => $rooms->where('status_hk', 'dirty')->count(),
                'inspected' => $rooms->where('status_hk', 'inspected')->count(),
                'out_of_service' => $rooms->whereIn('status_hk', ['out_of_order', 'out_of_service'])->count(),
            ],
        ]);
    }

    public function updateRoomStatus(Request $request, Room $room): RedirectResponse
    {
        $validated = $request->validate([
            'status_hk' => 'required|in:clean,dirty,inspected,out_of_order,out_of_service',
        ]);

        $room->update(['status_hk' => $validated['status_hk']]);

        // If marked clean or inspected, complete any pending housekeeping task for this room
        if (in_array($validated['status_hk'], ['clean', 'inspected'])) {
            HousekeepingTask::where('room_id', $room->id)
                ->whereIn('status', ['pending', 'in_progress'])
                ->update(['status' => 'completed']);
        }

        return back()->with('success', "Room {$room->room_number} status updated to ".ucfirst(str_replace('_', ' ', $validated['status_hk'])));
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
        $property = $user->property ?? Property::first();

        HousekeepingTask::create([
            'tenant_id' => $user->tenant_id,
            'property_id' => $property->id,
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
