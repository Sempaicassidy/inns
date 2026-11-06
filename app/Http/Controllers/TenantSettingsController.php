<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Property;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantSettingsController extends Controller
{
    /**
     * Display the manager's tenant branding & receipt configuration view.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Enforce Managerial / Administrative Authorization
        $allowedRoles = ['general_manager', 'manager', 'owner', 'admin', 'super_admin'];
        if (! in_array($user->active_role, $allowedRoles) && ! in_array($user->role, $allowedRoles) && ! $user->isSuperAdmin()) {
            abort(403, 'Unauthorized. Only General Managers, Owners, or Admins can configure hotel identity and receipt settings.');
        }

        $tenant = $user->tenant;
        if (! $tenant && $user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id);
        }

        if (! $tenant) {
            abort(404, 'Hotel tenant workspace not found.');
        }

        $activePropId = session('current_property_id', $user->property_id);
        $property = $activePropId ? Property::find($activePropId) : ($user->property ?? $tenant->properties()->first());

        $bDateRecord = $property ? BusinessDate::where('property_id', $property->id)->first() : null;
        $businessDate = $bDateRecord?->current_business_date?->format('Y-m-d') ?? now()->format('Y-m-d');

        $settings = $tenant->settings ?? [];

        return Inertia::render('Settings/TenantSettings', [
            'tenant' => [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'subdomain' => $tenant->subdomain,
                'plan' => $tenant->plan,
                'system_name' => $settings['system_name'] ?? $tenant->name ?? 'THE INNS',
                'tagline' => $settings['tagline'] ?? 'Excellence in Luxury Hospitality & Guest Comfort',
                'tin' => $settings['tin'] ?? ($property?->tax_config['tin'] ?? '102-458-999'),
                'vrn' => $settings['vrn'] ?? ($property?->tax_config['vrn'] ?? '40-001234-A'),
                'business_license' => $settings['business_license'] ?? 'BL-2026-00918',
                'phone' => $settings['phone'] ?? $property?->phone ?? '+255 754 000 111',
                'email' => $settings['email'] ?? $property?->email ?? 'info@theinns.co.tz',
                'address' => $settings['address'] ?? $property?->address ?? 'Plot 42, Safari Way, P.O. Box 1042',
                'city' => $settings['city'] ?? $property?->city ?? 'Seronera, Serengeti',
                'country' => $settings['country'] ?? ($property?->country ?? 'Tanzania'),
                'website' => $settings['website'] ?? 'https://theinns.co.tz',
                'receipt_header' => $settings['receipt_header'] ?? 'OFFICIAL FISCAL CASH RECEIPT / INVOICE',
                'receipt_footer' => $settings['receipt_footer'] ?? 'Thank you for staying with us! Goods & services once paid are non-refundable. Karibu tena!',
                'currency' => $settings['currency'] ?? ($property?->currency ?? 'TZS'),
                'currency_symbol' => $settings['currency_symbol'] ?? 'TZS',
                'sender_id' => $settings['sender_id'] ?? $tenant->name ?? 'THE INNS',
                'wifi_ssid' => $settings['wifi_ssid'] ?? 'GUEST-HIGH-SPEED-WIFI',
                'wifi_password' => $settings['wifi_password'] ?? 'welcome2026',
            ],
            'property' => $property,
            'businessDate' => $businessDate,
        ]);
    }

    /**
     * Save the updated hotel branding, receipt details, and system identity.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Enforce Managerial / Administrative Authorization
        $allowedRoles = ['general_manager', 'manager', 'owner', 'admin', 'super_admin'];
        if (! in_array($user->active_role, $allowedRoles) && ! in_array($user->role, $allowedRoles) && ! $user->isSuperAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $tenant = $user->tenant;
        if (! $tenant && $user->tenant_id) {
            $tenant = Tenant::find($user->tenant_id);
        }

        if (! $tenant) {
            abort(404, 'Hotel tenant workspace not found.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'system_name' => 'nullable|string|max:100',
            'tagline' => 'nullable|string|max:255',
            'tin' => 'nullable|string|max:50',
            'vrn' => 'nullable|string|max:50',
            'business_license' => 'nullable|string|max:80',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'website' => 'nullable|string|max:150',
            'receipt_header' => 'nullable|string|max:150',
            'receipt_footer' => 'nullable|string|max:500',
            'currency' => 'nullable|string|max:10',
            'currency_symbol' => 'nullable|string|max:10',
            'sender_id' => 'nullable|string|max:25',
            'wifi_ssid' => 'nullable|string|max:80',
            'wifi_password' => 'nullable|string|max:80',
        ]);

        // 1. Update Tenant Name
        $tenant->name = $validated['name'];

        // 2. Merge into Tenant settings JSON
        $settings = $tenant->settings ?? [];
        $settings['system_name'] = $validated['system_name'] ?: $validated['name'];
        $settings['tagline'] = $validated['tagline'] ?? null;
        $settings['tin'] = $validated['tin'] ?? null;
        $settings['vrn'] = $validated['vrn'] ?? null;
        $settings['business_license'] = $validated['business_license'] ?? null;
        $settings['phone'] = $validated['phone'] ?? null;
        $settings['email'] = $validated['email'] ?? null;
        $settings['address'] = $validated['address'] ?? null;
        $settings['city'] = $validated['city'] ?? null;
        $settings['country'] = $validated['country'] ?? 'Tanzania';
        $settings['website'] = $validated['website'] ?? null;
        $settings['receipt_header'] = $validated['receipt_header'] ?: 'OFFICIAL FISCAL CASH RECEIPT / INVOICE';
        $settings['receipt_footer'] = $validated['receipt_footer'] ?: 'Thank you for choosing us! Goods & services once paid are non-refundable.';
        $settings['currency'] = $validated['currency'] ?: 'TZS';
        $settings['currency_symbol'] = $validated['currency_symbol'] ?: 'TZS';
        $settings['sender_id'] = $validated['sender_id'] ?: $validated['name'];
        $settings['wifi_ssid'] = $validated['wifi_ssid'] ?? null;
        $settings['wifi_password'] = $validated['wifi_password'] ?? null;

        $tenant->settings = $settings;
        $tenant->save();

        // 3. Keep Main/Active Property in sync with tenant details
        $activePropId = session('current_property_id', $user->property_id);
        $property = $activePropId ? Property::find($activePropId) : ($user->property ?? $tenant->properties()->first());

        if ($property) {
            $taxConfig = $property->tax_config ?? [];
            $taxConfig['tin'] = $validated['tin'] ?? null;
            $taxConfig['vrn'] = $validated['vrn'] ?? null;

            $property->update([
                'phone' => $validated['phone'] ?? $property->phone,
                'email' => $validated['email'] ?? $property->email,
                'address' => $validated['address'] ?? $property->address,
                'city' => $validated['city'] ?? $property->city,
                'country' => $validated['country'] ?? $property->country,
                'currency' => $validated['currency'] ?? $property->currency,
                'tax_config' => $taxConfig,
            ]);
        }

        return redirect()->back()->with('success', "Hotel details, receipt branding, and system display name updated successfully. Changes are now active across all receipts, messages, and displays.");
    }
}

