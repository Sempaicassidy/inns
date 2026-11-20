<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\OwnerDirective;
use App\Models\OwnerDrawing;
use App\Models\OwnerRequisition;
use App\Models\Property;
use App\Models\SystemNotification;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OwnerDashboardService;
use App\Services\ReportingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OwnerPortalController extends Controller
{
    public function __construct(
        protected OwnerDashboardService $dashboardService,
        protected ReportingService $reportingService,
    ) {}

    /**
     * Display the Hotel Owner Executive Portal.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // Enforce Owner or SuperAdmin access
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            return redirect()->route('dashboard')->with('error', 'You do not have permission to access the Owner Portal.');
        }

        $tenantId = $user->tenant_id;
        $tenant = Tenant::with('properties')->find($tenantId);

        if (! $tenant && ! $user->isSuperAdmin()) {
            abort(403, 'Tenant account not found.');
        }

        // Live, comprehensive calculation of all operational and financial metrics
        $dashboardData = $this->dashboardService->getDashboardData($user, $request);

        // Reporting Center integration
        $tab = $request->query('tab', 'overview');
        $reportType = $request->query('report_type', 'sales');
        $reportData = $this->reportingService->generateReport($tenantId, $reportType, $request);

        return Inertia::render('Owner/Index', array_merge($dashboardData, [
            'tab' => $tab,
            'reportType' => $reportType,
            'reportData' => $reportData,
        ]));
    }

    /**
     * Export any report directly as CSV/Excel for the Business Owner.
     */
    public function exportReport(Request $request): StreamedResponse|RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403, 'Unauthorized.');
        }

        $reportType = (string) $request->input('report_type', 'sales');

        return $this->reportingService->exportCsv($user->tenant_id, $reportType, $request);
    }

    /**
     * Store a new executive directive to General Managers.
     */
    public function storeDirective(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'directive_text' => 'required|string',
            'property_id' => 'nullable|uuid',
            'priority' => 'required|in:normal,high,urgent',
            'category' => 'required|in:operations,finance,policy,maintenance,hr',
            'target_deadline' => 'nullable|date',
        ]);

        OwnerDirective::create([
            'tenant_id' => $user->tenant_id,
            'property_id' => $validated['property_id'] ?: null,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'directive_text' => $validated['directive_text'],
            'priority' => $validated['priority'],
            'category' => $validated['category'],
            'target_deadline' => $validated['target_deadline'] ?: null,
            'status' => 'active',
        ]);

        // Broadcast notification to General Managers
        $mgrQuery = User::where('tenant_id', $user->tenant_id)
            ->where(function ($q) {
                $q->where('role', 'general_manager')
                    ->orWhere('role', 'manager')
                    ->orWhereJsonContains('roles', 'general_manager');
            });

        if (! empty($validated['property_id'])) {
            $mgrQuery->where('property_id', $validated['property_id']);
        }

        $managers = $mgrQuery->get();
        foreach ($managers as $mgr) {
            SystemNotification::create([
                'tenant_id' => $user->tenant_id,
                'user_id' => $mgr->id,
                'target_role' => 'general_manager',
                'title' => 'Official Executive Directive from Owner: '.$validated['title'],
                'message' => Str::limit($validated['directive_text'], 140),
                'category' => 'governance',
                'severity' => $validated['priority'] === 'urgent' ? 'high' : 'info',
                'action_url' => route('dashboard'),
            ]);
        }

        return redirect()->back()->with('success', 'Executive Owner Directive has been dispatched to branch managers.');
    }

    /**
     * Update or complete an executive directive.
     */
    public function updateDirective(Request $request, OwnerDirective $directive): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'status' => 'required|in:active,acknowledged,completed',
            'title' => 'sometimes|string|max:255',
            'directive_text' => 'sometimes|string',
        ]);

        $directive->update($validated);

        return redirect()->back()->with('success', 'Directive has been updated successfully.');
    }

    /**
     * Delete/Archive a directive.
     */
    public function deleteDirective(Request $request, OwnerDirective $directive): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $directive->delete();

        return redirect()->back()->with('success', 'Directive has been deleted.');
    }

    /**
     * Owner approves a manager requisition.
     */
    public function approveRequisition(Request $request, OwnerRequisition $requisition): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'owner_notes' => 'nullable|string|max:1000',
        ]);

        $requisition->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'owner_notes' => $validated['owner_notes'] ?? 'Approved by Property Owner.',
        ]);

        // Auto-create or link to approved expense if requested
        if ($request->boolean('create_expense')) {
            Expense::create([
                'tenant_id' => $requisition->tenant_id,
                'property_id' => $requisition->property_id,
                'created_by' => $requisition->requested_by,
                'expense_number' => 'EXP-'.strtoupper(Str::random(6)),
                'title' => $requisition->title,
                'category' => $requisition->category,
                'vendor_name' => $requisition->vendor_name,
                'amount_minor' => $requisition->amount_minor,
                'payment_method' => 'cash',
                'expense_date' => now()->toDateString(),
                'status' => 'approved',
                'notes' => 'Generated from approved Owner Requisition '.$requisition->requisition_no.'. Owner notes: '.($requisition->owner_notes ?? ''),
            ]);
        }

        // Notify requesting manager
        SystemNotification::create([
            'tenant_id' => $requisition->tenant_id,
            'user_id' => $requisition->requested_by,
            'target_role' => 'general_manager',
            'title' => 'Requisition Approved by Owner ('.$requisition->requisition_no.')',
            'message' => 'Your requisition "'.$requisition->title.'" for TZS '.number_format($requisition->amount_minor / 100, 0).' has been approved.',
            'category' => 'finance',
            'severity' => 'success',
            'action_url' => route('dashboard'),
        ]);

        return redirect()->back()->with('success', "Requisition {$requisition->requisition_no} has been approved.");
    }

    /**
     * Owner rejects a manager requisition.
     */
    public function rejectRequisition(Request $request, OwnerRequisition $requisition): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'owner_notes' => 'required|string|max:1000',
        ]);

        $requisition->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'rejected_at' => now(),
            'owner_notes' => $validated['owner_notes'],
        ]);

        // Notify requesting manager
        SystemNotification::create([
            'tenant_id' => $requisition->tenant_id,
            'user_id' => $requisition->requested_by,
            'target_role' => 'general_manager',
            'title' => 'Requisition Rejected by Owner ('.$requisition->requisition_no.')',
            'message' => 'Reason: '.$validated['owner_notes'],
            'category' => 'finance',
            'severity' => 'warning',
            'action_url' => route('dashboard'),
        ]);

        return redirect()->back()->with('warning', "Requisition {$requisition->requisition_no} has been rejected.");
    }

    /**
     * Update branch monthly revenue target.
     */
    public function updateBranchTarget(Request $request, Property $property): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'monthly_target_revenue' => 'required|numeric|min:0',
        ]);

        $targetMinor = (int) round($validated['monthly_target_revenue'] * 100);
        $property->update([
            'monthly_target_revenue_minor' => $targetMinor,
        ]);

        return redirect()->back()->with('success', "Monthly revenue target for {$property->name} updated: TZS ".number_format($validated['monthly_target_revenue'], 0));
    }

    /**
     * Record Owner Drawing, Dividend or Capital Injection.
     */
    public function recordDrawing(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'drawing_type' => 'required|in:dividend,draw,capital_injection',
            'amount' => 'required|numeric|min:1',
            'property_id' => 'nullable|uuid',
            'payment_method' => 'required|string',
            'drawing_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $amountMinor = (int) round($validated['amount'] * 100);

        OwnerDrawing::create([
            'tenant_id' => $user->tenant_id,
            'property_id' => $validated['property_id'] ?: null,
            'created_by' => $user->id,
            'drawing_type' => $validated['drawing_type'],
            'amount_minor' => $amountMinor,
            'payment_method' => $validated['payment_method'],
            'reference_no' => 'OWN-'.strtoupper(Str::random(6)),
            'drawing_date' => $validated['drawing_date'],
            'notes' => $validated['notes'] ?? null,
        ]);

        $typeLabel = match ($validated['drawing_type']) {
            'dividend' => 'Dividend',
            'capital_injection' => 'Capital Injection',
            default => 'Owner Drawing',
        };

        return redirect()->back()->with('success', "{$typeLabel} transaction of TZS ".number_format($validated['amount'], 0).' recorded successfully.');
    }

    /**
     * Inspect a specific branch operational workspace as Manager.
     */
    public function inspectBranch(Request $request, Property $property): RedirectResponse
    {
        $user = $request->user();
        if (! $user->isOwner() && ! $user->isSuperAdmin()) {
            abort(403);
        }

        session([
            'owner_inspecting_property_id' => $property->id,
            'current_property_id' => $property->id,
            'owner_inspecting_property_name' => $property->name,
        ]);

        return redirect()->route('dashboard')->with('info', "Inspecting operations for property: {$property->name} in Owner Mode.");
    }

    /**
     * Leave branch inspection and return to Owner Portal.
     */
    public function leaveInspectBranch(Request $request): RedirectResponse
    {
        session()->forget(['owner_inspecting_property_id', 'owner_inspecting_property_name']);

        return redirect()->route('owner.index')->with('success', 'Returned to Executive Owner Portal.');
    }
}
