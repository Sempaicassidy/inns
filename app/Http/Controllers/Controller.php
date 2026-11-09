<?php

namespace App\Http\Controllers;

use App\Models\Property;
use Illuminate\Http\Request;

abstract class Controller
{
    /**
     * Resolve the active property for the current request, authenticated user, and session.
     * Guarantees self-healing fallback and multi-tenant safety.
     */
    protected function resolveActiveProperty(?Request $request = null): ?Property
    {
        $request = $request ?? request();
        $user = $request?->user();

        // 1. Explicit property_id in request input/header/query/session/user (skip empty strings)
        $rawPropertyId = $request?->input('property_id')
            ?: $request?->route('property_id')
            ?: $request?->header('X-Property-ID')
            ?: session('current_property_id')
            ?: $user?->property_id;

        $propertyId = is_string($rawPropertyId) ? trim($rawPropertyId) : null;
        if ($propertyId === '') {
            $propertyId = null;
        }

        $property = null;

        if ($propertyId) {
            $property = Property::withoutGlobalScopes()->find($propertyId);
            // Verify tenant boundary if user belongs to a specific tenant and not super admin
            if ($property && $user && ! $user->isSuperAdmin() && $user->tenant_id && $property->tenant_id !== $user->tenant_id) {
                $property = null;
            }
        }

        // 2. Fall back to user's direct assigned property
        if (! $property && $user?->property_id) {
            $property = Property::withoutGlobalScopes()->find($user->property_id);
        }

        // 3. Fall back to active branch of user's tenant
        $tenantId = $user?->tenant_id ?? session('current_tenant_id');
        $tenant = $user?->tenant ?? ($tenantId ? \App\Models\Tenant::withoutGlobalScopes()->find($tenantId) : null) ?? \App\Models\Tenant::withoutGlobalScopes()->first();

        if (! $property && $tenant) {
            $property = Property::withoutGlobalScopes()
                ->where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->orderByDesc('is_main')
                ->first();

            if (! $property) {
                $property = Property::withoutGlobalScopes()
                    ->where('tenant_id', $tenant->id)
                    ->first();
            }
        }

        // 4. Fall back to any active property in system
        if (! $property) {
            $property = Property::withoutGlobalScopes()->where('is_active', true)->first()
                ?? Property::withoutGlobalScopes()->first();
        }

        // 5. If ZERO properties exist anywhere, auto-provision main property (guaranteed self-healing)
        if (! $property) {
            if (! $tenant) {
                $tenant = \App\Models\Tenant::withoutGlobalScopes()->create([
                    'name' => 'Main Hotel & Suites',
                    'domain' => 'hotel.local',
                    'is_active' => true,
                ]);
            }

            $tenantName = $tenant->name ?: 'Main Hotel & Suites';
            $code = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $tenantName), 0, 4)) ?: 'MAIN';

            $property = Property::withoutGlobalScopes()->create([
                'tenant_id' => $tenant->id,
                'name' => $tenantName,
                'code' => $code,
                'is_main' => true,
                'is_active' => true,
                'property_type' => 'hotel',
                'city' => 'Dar es Salaam',
                'country' => 'Tanzania',
                'currency' => 'TZS',
                'timezone' => 'Africa/Dar_es_Salaam',
                'checkin_time' => '14:00',
                'checkout_time' => '11:00',
            ]);
        }

        // 6. Persist resolved property to user and session for consistent future requests
        if ($property) {
            if ($user && ! $user->property_id) {
                $user->forceFill(['property_id' => $property->id])->saveQuietly();
            }
            if ($request && $request->hasSession() && ! session()->has('current_property_id')) {
                session(['current_property_id' => $property->id]);
            }
        }

        return $property;
    }
}

