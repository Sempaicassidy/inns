<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Property;
use App\Models\Room;
use App\Models\Stay;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BranchController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->isSuperAdmin();
        $tenant = $user->tenant;

        $currentPropertyId = session('current_property_id', $user->property_id);

        if ($isSuperAdmin) {
            $properties = Property::with('tenant')->latest()->get();
        } else {
            $properties = Property::where('tenant_id', $tenant->id)->orderBy('created_at')->get();
        }

        $branchesData = $properties->map(function ($property) use ($currentPropertyId) {
            $bDate = BusinessDate::where('property_id', $property->id)->first();
            $currentDate = $bDate ? Carbon::parse($bDate->current_business_date)->toDateString() : Carbon::today()->toDateString();

            $totalRooms = Room::where('property_id', $property->id)->where('is_active', true)->count();
            $occupiedRooms = Room::where('property_id', $property->id)
                ->where('is_active', true)
                ->where('status_occupancy', 'occupied')
                ->count();

            $activeStays = Stay::whereHas('room', function ($q) use ($property) {
                $q->where('property_id', $property->id);
            })->whereNull('checked_out_at')->count();

            $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

            return [
                'id' => $property->id,
                'name' => $property->name,
                'is_main' => (bool) $property->is_main,
                'code' => $property->code ?? strtoupper(substr($property->name, 0, 3)),
                'property_type' => $property->property_type,
                'city' => $property->city,
                'address' => $property->address,
                'phone' => $property->phone,
                'email' => $property->email,
                'currency' => $property->currency,
                'is_active' => (bool) $property->is_active,
                'is_current' => $property->id === $currentPropertyId,
                'business_date' => $currentDate,
                'total_rooms' => $totalRooms,
                'occupied_rooms' => $occupiedRooms,
                'occupancy_rate' => $occupancyRate,
                'active_stays' => $activeStays,
                'tenant_name' => $property->tenant?->name ?? 'Standard',
            ];
        });

        $canManage = $user->canManageBranches();
        $maxBranches = $tenant?->max_branches ?? 5;
        $canAdd = $canManage && ($isSuperAdmin || ($tenant && $tenant->canAddBranch()));

        return Inertia::render('Branches/Index', [
            'branches' => $branchesData,
            'currentPropertyId' => $currentPropertyId,
            'canManageBranches' => $canManage,
            'canAddBranch' => $canAdd,
            'tenant' => [
                'id' => $tenant?->id,
                'name' => $tenant?->name ?? 'Haula Hotel Group',
                'plan' => ucfirst($tenant?->plan ?? 'Standard'),
                'max_branches' => $maxBranches,
                'branch_count' => $properties->count(),
                'status' => $tenant?->subscription_status ?? 'active',
                'is_active' => (bool) ($tenant?->is_active ?? true),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user->canManageBranches()) {
            return back()->with('error', 'You do not have administrative permission to create new branches.');
        }

        $tenant = $user->tenant;
        if (! $user->isSuperAdmin() && $tenant && ! $tenant->canAddBranch()) {
            return back()->with('error', "Your current SaaS subscription plan allows a maximum of {$tenant->max_branches} branches. Please upgrade your subscription.");
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'required|string|max:10',
            'property_type' => 'required|in:hotel,lodge,camp,resort,guest_house',
            'city' => 'required|string|max:100',
            'address' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'currency' => 'required|string|size:3',
            'checkin_time' => 'nullable|string|max:5',
            'checkout_time' => 'nullable|string|max:5',
        ]);

        $tenantId = $user->tenant_id;
        $isFirstBranch = Property::where('tenant_id', $tenantId)->count() === 0;

        $property = Property::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'is_main' => $isFirstBranch,
            'code' => strtoupper($validated['code']),
            'property_type' => $validated['property_type'],
            'city' => $validated['city'],
            'address' => $validated['address'] ?? null,
            'country' => $validated['country'] ?? 'Tanzania',
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'currency' => strtoupper($validated['currency']),
            'checkin_time' => $validated['checkin_time'] ?? '14:00',
            'checkout_time' => $validated['checkout_time'] ?? '10:00',
            'is_active' => true,
        ]);

        // Initialize Business Date for this new branch
        BusinessDate::create([
            'tenant_id' => $tenantId,
            'property_id' => $property->id,
            'current_business_date' => Carbon::today()->toDateString(),
            'status' => 'open',
        ]);

        return redirect()->route('branches.index')->with('success', "Branch '{$property->name}' created successfully!");
    }

    public function update(Request $request, Property $branch): RedirectResponse
    {
        $user = $request->user();

        if (! $user->canManageBranches()) {
            return back()->with('error', 'You do not have permission to edit branches.');
        }

        if (! $user->isSuperAdmin() && $branch->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'required|string|max:10',
            'property_type' => 'required|in:hotel,lodge,camp,resort,guest_house',
            'city' => 'required|string|max:100',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'currency' => 'required|string|size:3',
            'checkin_time' => 'nullable|string|max:5',
            'checkout_time' => 'nullable|string|max:5',
        ]);

        $branch->update([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'property_type' => $validated['property_type'],
            'city' => $validated['city'],
            'address' => $validated['address'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
            'currency' => strtoupper($validated['currency']),
            'checkin_time' => $validated['checkin_time'] ?? $branch->checkin_time,
            'checkout_time' => $validated['checkout_time'] ?? $branch->checkout_time,
        ]);

        return back()->with('success', "Branch '{$branch->name}' updated successfully!");
    }

    public function toggle(Request $request, Property $branch): RedirectResponse
    {
        $user = $request->user();

        if (! $user->canManageBranches()) {
            return back()->with('error', 'You do not have permission to modify branch status.');
        }

        if (! $user->isSuperAdmin() && $branch->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        $newStatus = ! $branch->is_active;
        $branch->update(['is_active' => $newStatus]);

        $label = $newStatus ? 'activated' : 'deactivated';

        return back()->with('success', "Branch '{$branch->name}' has been {$label}.");
    }

    public function switchBranch(Request $request, Property $branch): RedirectResponse
    {
        $user = $request->user();

        if (! $user->isSuperAdmin() && $branch->tenant_id !== $user->tenant_id) {
            return back()->with('error', 'You do not have access to this branch.');
        }

        session(['current_property_id' => $branch->id]);

        $user->update(['property_id' => $branch->id]);

        return back()->with('success', "Active branch switched to '{$branch->name}'.");
    }
}
