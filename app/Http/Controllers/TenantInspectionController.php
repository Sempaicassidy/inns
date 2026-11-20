<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\TenantInspectionSession;
use App\Services\TenantInspectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantInspectionController extends Controller
{
    public function __construct(
        protected TenantInspectionService $inspectionService
    ) {}

    /**
     * Display Global Tenant Directory & Cross-Tenant Overview.
     */
    public function index(Request $request): Response
    {
        $directory = $this->inspectionService->getGlobalDirectory($request);
        $crossTenantMetrics = $this->inspectionService->getCrossTenantMetrics();

        return Inertia::render('SaasAdmin/Inspection/Index', [
            'directory' => $directory,
            'crossTenantMetrics' => $crossTenantMetrics,
            'filters' => [
                'search' => $request->input('search', ''),
                'status' => $request->input('status', 'all'),
                'plan' => $request->input('plan', 'all'),
                'sort_by' => $request->input('sort_by', 'created_at'),
                'sort_order' => $request->input('sort_order', 'desc'),
                'per_page' => (int) $request->input('per_page', 15),
            ],
        ]);
    }

    /**
     * Display dedicated individual Tenant Inspection Workspace.
     */
    public function show(Request $request, Tenant $tenant): Response
    {
        $section = $request->input('section', 'overview');
        $filters = $request->only(['status', 'branch_id']);

        $inspectionData = $this->inspectionService->getTenantInspectionData($tenant, $section, $filters);

        // Record that super admin inspected this section
        $user = auth()->user();
        $this->inspectionService->logAuditEvent([
            'tenant_id' => $tenant->id,
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'module' => 'system',
            'action_type' => 'tenant_inspected',
            'description' => "Super Admin {$user?->name} inspected section '{$section}' for tenant {$tenant->name}.",
            'record_type' => Tenant::class,
            'record_id' => (string) $tenant->id,
            'status' => 'success',
        ]);

        return Inertia::render('SaasAdmin/Inspection/Show', [
            'inspection' => $inspectionData,
            'currentSection' => $section,
            'filters' => $filters,
        ]);
    }

    /**
     * Display Unified Global Tenant Activity Timeline.
     */
    public function timeline(Request $request): Response
    {
        $filters = [
            'tenant_id' => $request->input('tenant_id'),
            'module' => $request->input('module', 'all'),
            'action_type' => $request->input('action_type', 'all'),
            'status' => $request->input('status', 'all'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'search' => $request->input('search', ''),
        ];

        $timeline = $this->inspectionService->getGlobalTimeline($filters, 30);
        $tenantsList = Tenant::select('id', 'name')->orderBy('name', 'asc')->get();

        return Inertia::render('SaasAdmin/Inspection/Timeline', [
            'timeline' => $timeline,
            'tenantsList' => $tenantsList,
            'filters' => $filters,
        ]);
    }

    /**
     * Display Cross-Tenant Financial Monitoring Matrix.
     */
    public function financials(Request $request): Response
    {
        $financialsData = $this->inspectionService->getCrossTenantFinancials($request->all());

        return Inertia::render('SaasAdmin/Inspection/Financials', [
            'financials' => $financialsData,
        ]);
    }

    /**
     * Start an explicit Support Inspection Session.
     */
    public function startSession(Request $request, Tenant $tenant): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|min:5|max:255',
            'is_write_mode' => 'nullable|boolean',
        ]);

        $superAdmin = auth()->user();
        $this->inspectionService->startSupportSession(
            $tenant,
            $superAdmin,
            $validated['reason'],
            $request->ip(),
            $request->userAgent(),
            (bool) ($validated['is_write_mode'] ?? false)
        );

        return redirect()->back()->with('success', "Support Inspection Session started for {$tenant->name}.");
    }

    /**
     * End an active Support Inspection Session.
     */
    public function endSession(Request $request, TenantInspectionSession $session): RedirectResponse
    {
        $this->inspectionService->endSupportSession($session);

        return redirect()->back()->with('success', 'Support Inspection Session has been concluded.');
    }

    /**
     * Export complete audit profile for a tenant as JSON.
     */
    public function exportReport(Request $request, Tenant $tenant): JsonResponse
    {
        $fullData = $this->inspectionService->getTenantInspectionData($tenant, 'all');

        $superAdmin = auth()->user();
        $this->inspectionService->logAuditEvent([
            'tenant_id' => $tenant->id,
            'user_id' => $superAdmin?->id,
            'user_name' => $superAdmin?->name,
            'module' => 'security',
            'action_type' => 'audit_report_exported',
            'description' => "Super Admin {$superAdmin?->name} exported audit report for tenant {$tenant->name}.",
            'record_type' => Tenant::class,
            'record_id' => (string) $tenant->id,
            'status' => 'success',
        ]);

        return response()->json([
            'export_timestamp' => now()->toIso8601String(),
            'exported_by' => $superAdmin?->name,
            'data' => $fullData,
        ]);
    }
}
