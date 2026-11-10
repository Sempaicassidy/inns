<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\RoomType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoomTypeController extends Controller
{
    /**
     * List all room types for the active property.
     */
    public function index(Request $request)
    {
        $property = $this->resolveActiveProperty($request);

        if ($property) {
            $roomTypes = RoomType::withoutGlobalScopes()
                ->where('property_id', $property->id)
                ->withCount('rooms')
                ->where('is_active', true)
                ->get();

            if ($roomTypes->isEmpty()) {
                $roomTypes = RoomType::ensureDefaultsForProperty($property);
            }
        } else {
            $roomTypes = RoomType::withCount('rooms')->where('is_active', true)->get();
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'roomTypes' => $roomTypes,
                'property' => $property,
            ]);
        }

        return redirect()->back();
    }

    /**
     * Store a newly created room type.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'property_id' => 'nullable|string',
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'base_price' => 'required|numeric|min:0',
            'base_occupancy' => 'nullable|integer|min:1|max:20',
            'max_adults' => 'nullable|integer|min:1|max:20',
            'max_children' => 'nullable|integer|min:0|max:20',
            'amenities' => 'nullable|array',
            'description' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $property = $this->resolveActiveProperty($request);
        $tenantId = $property?->tenant_id ?? $user?->tenant_id;

        if (! $property) {
            $tenant = $user?->tenant ?? ($tenantId ? \App\Models\Tenant::withoutGlobalScopes()->find($tenantId) : null) ?? \App\Models\Tenant::withoutGlobalScopes()->first();
            if ($tenant) {
                $property = Property::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
                if (! $property) {
                    $property = Property::withoutGlobalScopes()->create([
                        'tenant_id' => $tenant->id,
                        'name' => $tenant->name ?? 'Main Hotel Branch',
                        'code' => 'MAIN',
                        'city' => 'Arusha',
                        'is_active' => true,
                        'is_main' => true,
                    ]);
                }
                if ($user && ! $user->property_id) {
                    $user->update(['property_id' => $property->id]);
                }
                session(['current_property_id' => $property->id]);
            }
        }

        if (! $property) {
            if ($request->wantsJson() || $request->ajax() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active property found. Please configure a branch or property first.',
                ], 422);
            }
            return back()->withErrors(['property' => 'No active property found.']);
        }

        $code = ! empty($validated['code'])
            ? Str::upper(substr(preg_replace('/[^A-Za-z0-9]/', '', $validated['code']), 0, 15))
            : Str::upper(substr(preg_replace('/[^A-Za-z0-9]/', '', $validated['name']), 0, 10));

        // Ensure uniqueness for this property
        $exists = RoomType::withoutGlobalScopes()
            ->where('property_id', $property->id)
            ->where('code', $code)
            ->exists();

        if ($exists) {
            $code .= '-' . rand(10, 99);
        }

        $basePriceMinor = (int) round((float) $validated['base_price'] * 100);

        $roomType = RoomType::withoutGlobalScopes()->create([
            'tenant_id' => $tenantId,
            'property_id' => $property->id,
            'code' => $code,
            'name' => $validated['name'],
            'base_occupancy' => $validated['base_occupancy'] ?? 2,
            'max_adults' => $validated['max_adults'] ?? 2,
            'max_children' => $validated['max_children'] ?? 1,
            'base_price_minor' => $basePriceMinor,
            'amenities' => $validated['amenities'] ?? ['King Bed', 'WiFi', 'Air Conditioning', 'En-suite Bathroom'],
            'description' => $validated['description'] ?? null,
            'is_active' => true,
        ]);

        $roomType->loadCount('rooms');

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "Room type '{$roomType->name}' created successfully.",
                'roomType' => $roomType,
            ]);
        }

        return redirect()->back()->with('success', "Room type '{$roomType->name}' created successfully.");
    }

    /**
     * Update an existing room type.
     */
    public function update(Request $request, RoomType $roomType): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'code' => 'sometimes|nullable|string|max:20',
            'base_price' => 'sometimes|required|numeric|min:0',
            'base_occupancy' => 'sometimes|nullable|integer|min:1|max:20',
            'max_adults' => 'sometimes|nullable|integer|min:1|max:20',
            'max_children' => 'sometimes|nullable|integer|min:0|max:20',
            'amenities' => 'nullable|array',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['base_price'])) {
            $validated['base_price_minor'] = (int) round((float) $validated['base_price'] * 100);
            unset($validated['base_price']);
        }

        $roomType->update($validated);
        $roomType->loadCount('rooms');

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "Room type '{$roomType->name}' updated successfully.",
                'roomType' => $roomType,
            ]);
        }

        return redirect()->back()->with('success', "Room type '{$roomType->name}' updated successfully.");
    }

    /**
     * Delete or deactivate a room type.
     */
    public function destroy(Request $request, RoomType $roomType): JsonResponse|RedirectResponse
    {
        $roomCount = $roomType->rooms()->count();

        if ($roomCount > 0) {
            $roomType->update(['is_active' => false]);
            $msg = "Room type '{$roomType->name}' was deactivated because {$roomCount} room(s) are assigned to it.";
        } else {
            $roomType->delete();
            $msg = "Room type '{$roomType->name}' deleted successfully.";
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }
}

