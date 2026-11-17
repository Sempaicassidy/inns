<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Property;
use App\Models\Tenant;
use App\Services\TenantDataPurgeService;
use App\Services\TraVfdService;
use Illuminate\Http\JsonResponse;
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
        $vfd = $settings['vfd'] ?? [];
        $vfdService = app(TraVfdService::class);

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
                'vfd_device_id' => $vfd['device_id'] ?? env('TRA_VFD_DEVICE_ID', ''),
                'vfd_api_key' => $vfd['api_key'] ?? env('TRA_VFD_API_KEY', ''),
                'vfd_base_url' => $vfd['base_url'] ?? env('TRA_VFD_BASE_URL', 'https://vfd.tra.go.tz/api/v1'),
                'vfd_environment' => $vfd['environment'] ?? env('TRA_VFD_ENV', 'sandbox'),
                'vfd_is_configured' => $vfdService->isConfigured($tenant),
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
            'vfd_device_id' => 'nullable|string|max:100',
            'vfd_api_key' => 'nullable|string|max:255',
            'vfd_base_url' => 'nullable|string|max:255',
            'vfd_environment' => 'nullable|string|in:sandbox,production',
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

        // VFD Settings
        $vfd = $settings['vfd'] ?? [];
        $vfd['device_id'] = $validated['vfd_device_id'] ?? null;
        $vfd['api_key'] = $validated['vfd_api_key'] ?? null;
        if (! empty($validated['vfd_base_url'])) {
            $vfd['base_url'] = $validated['vfd_base_url'];
        }
        if (! empty($validated['vfd_environment'])) {
            $vfd['environment'] = $validated['vfd_environment'];
        }
        $settings['vfd'] = $vfd;
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
            $taxConfig['vfd_device_id'] = $validated['vfd_device_id'] ?? null;

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

        return redirect()->back()->with('success', 'Hotel details, receipt branding, and system display name updated successfully. Changes are now active across all receipts, messages, and displays.');
    }

    /**
     * Fetch real-time module record counts for active tenant.
     */
    public function getModuleCounts(Request $request, TenantDataPurgeService $purgeService): JsonResponse
    {
        $user = $request->user();
        $allowedRoles = ['general_manager', 'manager', 'owner', 'admin', 'super_admin'];
        if (! in_array($user->active_role, $allowedRoles) && ! in_array($user->role, $allowedRoles) && ! $user->isSuperAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $tenant = $user->tenant ?? Tenant::find($user->tenant_id);
        if (! $tenant) {
            abort(404, 'Tenant not found.');
        }

        return response()->json([
            'success' => true,
            'modules' => $purgeService->getModules(),
            'counts' => $purgeService->getModuleCounts($tenant),
        ]);
    }

    /**
     * Purge selected modules for active tenant with safety confirmation.
     */
    public function clearModuleData(Request $request, TenantDataPurgeService $purgeService): RedirectResponse|JsonResponse
    {
        $user = $request->user();
        $allowedRoles = ['general_manager', 'manager', 'owner', 'admin', 'super_admin'];
        if (! in_array($user->active_role, $allowedRoles) && ! in_array($user->role, $allowedRoles) && ! $user->isSuperAdmin()) {
            abort(403, 'Unauthorized. Only General Managers, Owners, or Admins can perform module data clearing.');
        }

        $tenant = $user->tenant ?? Tenant::find($user->tenant_id);
        if (! $tenant) {
            abort(404, 'Tenant not found.');
        }

        $validated = $request->validate([
            'modules' => 'required|array|min:1',
            'modules.*' => 'string',
            'confirmation' => 'required|string',
        ]);

        $confirmation = trim(strtoupper($validated['confirmation']));
        $tenantNameUpper = trim(strtoupper($tenant->name));
        $tenantSlugUpper = trim(strtoupper($tenant->slug));

        if ($confirmation !== 'CLEAR' && $confirmation !== $tenantNameUpper && $confirmation !== $tenantSlugUpper) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Neno la uthibitisho si sahihi. Andika CLEAR au jina la hoteli kuthibitisha.',
                ], 422);
            }

            return redirect()->back()->with('error', 'Neno la uthibitisho si sahihi. Andika CLEAR au jina la hoteli kuthibitisha.');
        }

        try {
            $result = $purgeService->purgeModules($tenant, $validated['modules'], $user);

            $msg = "Moduli zilizochaguliwa zimesafishwa kikamilifu. Jumla ya rekodi {$result['total_deleted']} zimefutwa.";

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $msg,
                    'result' => $result,
                ]);
            }

            return redirect()->back()->with('success', $msg);
        } catch (\Throwable $e) {
            $err = 'Hitilafu imetokea wakati wa kusafisha database: '.$e->getMessage();
            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'message' => $err], 500);
            }

            return redirect()->back()->with('error', $err);
        }
    }

    /**
     * Test connection to VFD service endpoint using tenant credentials.
     */
    public function testVfd(Request $request, TraVfdService $vfdService): JsonResponse
    {
        $user = $request->user();
        $allowedRoles = ['general_manager', 'manager', 'owner', 'admin', 'super_admin'];
        if (! in_array($user->active_role, $allowedRoles) && ! in_array($user->role, $allowedRoles) && ! $user->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $tenant = $user->tenant ?? Tenant::find($user->tenant_id);
        if (! $tenant) {
            return response()->json(['success' => false, 'message' => 'Hotel workspace not found.'], 404);
        }

        // Allow testing unsaved on-the-fly inputs from frontend form
        if ($request->filled('vfd_device_id') || $request->filled('vfd_api_key')) {
            $settings = $tenant->settings ?? [];
            $vfd = $settings['vfd'] ?? [];
            if ($request->filled('vfd_device_id')) {
                $vfd['device_id'] = $request->input('vfd_device_id');
            }
            if ($request->filled('vfd_api_key')) {
                $vfd['api_key'] = $request->input('vfd_api_key');
            }
            if ($request->filled('vfd_base_url')) {
                $vfd['base_url'] = $request->input('vfd_base_url');
            }
            if ($request->filled('vfd_environment')) {
                $vfd['environment'] = $request->input('vfd_environment');
            }
            $tenant->settings = array_merge($settings, ['vfd' => $vfd]);
        }

        $result = $vfdService->testConnection($tenant);

        return response()->json($result);
    }
}
