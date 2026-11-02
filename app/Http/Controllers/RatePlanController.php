<?php

namespace App\Http\Controllers;

use App\Models\Property;
use App\Models\RatePlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RatePlanController extends Controller
{
    /**
     * List all rate plans for the active property.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $property = $user?->property ?? Property::find(session('current_property_id')) ?? Property::first();

        if ($property) {
            $ratePlans = RatePlan::where('property_id', $property->id)
                ->where('is_active', true)
                ->get();

            if ($ratePlans->isEmpty()) {
                $ratePlans = RatePlan::ensureDefaultsForProperty($property);
            }
        } else {
            $ratePlans = RatePlan::where('is_active', true)->get();
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'ratePlans' => $ratePlans,
            ]);
        }

        return redirect()->back();
    }

    /**
     * Store a newly created rate plan.
     */
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'meal_plan' => 'required|in:RO,BB,HB,FB,AI',
            'code' => 'nullable|string|max:30',
            'is_resident_only' => 'nullable|boolean',
            'description' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $property = $user?->property ?? Property::find(session('current_property_id')) ?? Property::first();
        $tenantId = $user?->tenant_id ?? $property?->tenant_id;

        if (! $property) {
            return back()->withErrors(['property' => 'No active property found.']);
        }

        $code = ! empty($validated['code'])
            ? Str::upper(Str::slug($validated['code']))
            : Str::upper(Str::slug($validated['name'])) . '-' . $validated['meal_plan'];

        // Ensure unique code for this property
        $existingCount = RatePlan::withoutGlobalScopes()
            ->where('property_id', $property->id)
            ->where('code', $code)
            ->count();

        if ($existingCount > 0) {
            $code .= '-' . rand(10, 99);
        }

        $ratePlan = RatePlan::withoutGlobalScopes()->create([
            'tenant_id' => $tenantId,
            'property_id' => $property->id,
            'code' => $code,
            'name' => $validated['name'],
            'meal_plan' => $validated['meal_plan'],
            'is_resident_only' => ! empty($validated['is_resident_only']),
            'rules' => ! empty($validated['description']) ? ['description' => $validated['description']] : null,
            'is_active' => true,
        ]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => "Rate plan '{$ratePlan->name}' created successfully.",
                'ratePlan' => $ratePlan,
            ]);
        }

        return redirect()->back()->with('success', "Rate plan '{$ratePlan->name}' created successfully.");
    }

    /**
     * Update an existing rate plan.
     */
    public function update(Request $request, RatePlan $ratePlan): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100',
            'meal_plan' => 'sometimes|required|in:RO,BB,HB,FB,AI',
            'is_resident_only' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
        ]);

        $ratePlan->update($validated);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Rate plan updated successfully.',
                'ratePlan' => $ratePlan,
            ]);
        }

        return redirect()->back()->with('success', 'Rate plan updated successfully.');
    }

    /**
     * Delete or deactivate a rate plan.
     */
    public function destroy(Request $request, RatePlan $ratePlan): JsonResponse|RedirectResponse
    {
        $ratePlan->delete();

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Rate plan removed successfully.',
            ]);
        }

        return redirect()->back()->with('success', 'Rate plan removed successfully.');
    }
}

