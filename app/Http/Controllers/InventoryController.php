<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\Property;
use App\Models\StockMovement;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id ?? Tenant::first()?->id;

        $items = InventoryItem::where('tenant_id', $tenantId)
            ->where('is_active', true)
            ->orderBy('department')
            ->orderBy('name')
            ->get()
            ->map(function ($item) {
                $totalVal = $item->current_quantity * $item->unit_cost_minor;
                $status = $item->current_quantity <= 0
                    ? 'depleted'
                    : ($item->current_quantity <= $item->reorder_level ? 'low_stock' : 'optimal');

                return [
                    'id' => $item->id,
                    'sku' => $item->sku,
                    'name' => $item->name,
                    'department' => $item->department,
                    'unit' => $item->unit,
                    'current_quantity' => $item->current_quantity,
                    'reorder_level' => $item->reorder_level,
                    'unit_cost_minor' => $item->unit_cost_minor,
                    'total_valuation_minor' => $totalVal,
                    'notes' => $item->notes ?? '',
                    'status' => $status,
                ];
            });

        // Summary metrics
        $totalItemsCount = $items->count();
        $totalValuationMinor = $items->sum('total_valuation_minor');
        $depletedCount = $items->where('status', 'depleted')->count();
        $lowStockCount = $items->where('status', 'low_stock')->count();
        $optimalCount = $items->where('status', 'optimal')->count();

        // Department breakdown
        $departments = [
            'linens' => 'Housekeeping & Linens',
            'amenities' => 'Guest Amenities',
            'kitchen' => 'Kitchen & Food Provisions',
            'beverage' => 'Beverage & Bar Cellar',
            'maintenance' => 'Engineering & Maintenance',
            'general' => 'General Store & Supplies',
        ];

        $byDepartment = [];
        foreach ($departments as $deptKey => $deptLabel) {
            $deptItems = $items->where('department', $deptKey);
            $byDepartment[] = [
                'department_key' => $deptKey,
                'name' => $deptLabel,
                'items_count' => $deptItems->count(),
                'total_valuation_minor' => $deptItems->sum('total_valuation_minor'),
                'low_stock_count' => $deptItems->whereIn('status', ['low_stock', 'depleted'])->count(),
            ];
        }

        // Recent Audit Movements (Inbound & Outbound Requisitions)
        $movements = StockMovement::with(['inventoryItem', 'user'])
            ->where('tenant_id', $tenantId)
            ->whereNotNull('inventory_item_id')
            ->latest()
            ->take(25)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'item_name' => $m->inventoryItem?->name ?? 'Inventory Item',
                    'sku' => $m->inventoryItem?->sku ?? '—',
                    'movement_type' => $m->movement_type,
                    'quantity' => $m->quantity,
                    'department' => $m->department ?? 'General Store',
                    'reference_no' => $m->reference_no ?? '—',
                    'notes' => $m->notes ?? '—',
                    'performed_by' => $m->user?->name ?? 'Store Manager',
                    'created_at' => $m->created_at->format('d M Y, H:i'),
                ];
            });

        return Inertia::render('Inventory/Index', [
            'metrics' => [
                'total_items_count' => $totalItemsCount,
                'total_valuation_minor' => $totalValuationMinor,
                'depleted_count' => $depletedCount,
                'low_stock_count' => $lowStockCount,
                'optimal_count' => $optimalCount,
            ],
            'items' => $items,
            'byDepartment' => $byDepartment,
            'movements' => $movements,
            'departments' => $departments,
        ]);
    }

    public function storeItem(Request $request): RedirectResponse
    {
        if (! $request->filled('sku')) {
            $request->merge(['sku' => 'SKU-'.strtoupper(Str::random(6))]);
        }
        if ($request->has('category') && ! $request->filled('department')) {
            $request->merge(['department' => $request->input('category')]);
        }
        if ($request->has('current_stock') && ! $request->filled('current_quantity')) {
            $request->merge(['current_quantity' => (int) $request->input('current_stock')]);
        }
        if ($request->has('min_stock_alert') && ! $request->filled('reorder_level')) {
            $request->merge(['reorder_level' => (int) $request->input('min_stock_alert')]);
        }
        if ($request->has('unit_cost_minor') && ! $request->filled('unit_cost')) {
            $request->merge(['unit_cost' => (float) ($request->input('unit_cost_minor') / 100)]);
        }

        $validated = $request->validate([
            'sku' => 'required|string|max:64',
            'name' => 'required|string|max:150',
            'department' => 'required|string|max:50',
            'unit' => 'required|string|max:30',
            'current_quantity' => 'nullable|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'unit_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id ?? Tenant::first()?->id;

        $costMinor = (int) ($validated['unit_cost'] * 100);

        $item = InventoryItem::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'sku' => strtoupper($validated['sku']),
            'name' => $validated['name'],
            'department' => $validated['department'],
            'unit' => $validated['unit'],
            'current_quantity' => (int) $validated['current_quantity'],
            'reorder_level' => (int) $validated['reorder_level'],
            'unit_cost_minor' => $costMinor,
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
        ]);

        if ($item->current_quantity > 0) {
            StockMovement::create([
                'tenant_id' => $tenantId,
                'property_id' => $property?->id,
                'inventory_item_id' => $item->id,
                'movement_type' => 'receive_stock',
                'quantity' => $item->current_quantity,
                'unit_cost_minor' => $costMinor,
                'department' => 'central_store',
                'reference_no' => 'INITIAL-BALANCE',
                'notes' => 'Item created and initial stock recorded by Manager',
                'performed_by' => $user->id,
            ]);
        }

        return back()->with('success', "Store SKU {$item->sku} ({$item->name}) registered successfully!");
    }

    public function receiveStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'reference_no' => 'nullable|string|max:60',
            'notes' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $item = InventoryItem::findOrFail($validated['item_id']);
        $qty = (int) $validated['quantity'];
        $unitCostMinor = isset($validated['unit_cost']) && $validated['unit_cost'] > 0
            ? (int) ($validated['unit_cost'] * 100)
            : $item->unit_cost_minor;

        $item->increment('current_quantity', $qty);
        if ($unitCostMinor > 0) {
            $item->update(['unit_cost_minor' => $unitCostMinor]);
        }

        StockMovement::create([
            'tenant_id' => $item->tenant_id,
            'property_id' => $item->property_id,
            'inventory_item_id' => $item->id,
            'movement_type' => 'receive_stock',
            'quantity' => $qty,
            'unit_cost_minor' => $unitCostMinor,
            'department' => 'central_store',
            'reference_no' => $validated['reference_no'] ?? ('GRN-'.date('Ymd')),
            'notes' => $validated['notes'] ?? "Goods received in central store (+{$qty} {$item->unit})",
            'performed_by' => $user->id,
        ]);

        return back()->with('success', "Received +{$qty} {$item->unit} of {$item->name}. New balance: {$item->current_quantity} {$item->unit}.");
    }

    public function issueStock(Request $request): RedirectResponse
    {
        if ($request->has('inventory_item_id') && ! $request->filled('item_id')) {
            $request->merge(['item_id' => $request->input('inventory_item_id')]);
        }
        if ($request->has('destination') && ! $request->filled('department')) {
            $request->merge(['department' => $request->input('destination')]);
        }

        $validated = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'department' => 'required|string|max:50',
            'recipient_name' => 'nullable|string|max:100',
            'reference_no' => 'nullable|string|max:60',
            'notes' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $item = InventoryItem::findOrFail($validated['item_id']);
        $qty = (int) $validated['quantity'];

        if ($item->current_quantity < $qty) {
            return back()->withErrors(['quantity' => "Insufficient stock! Current store balance is only {$item->current_quantity} {$item->unit}."]);
        }

        $item->decrement('current_quantity', $qty);

        $notes = "Issued to {$validated['department']}";
        if (! empty($validated['recipient_name'])) {
            $notes .= " (Received by: {$validated['recipient_name']})";
        }
        if (! empty($validated['notes'])) {
            $notes .= ' - '.$validated['notes'];
        }

        StockMovement::create([
            'tenant_id' => $item->tenant_id,
            'property_id' => $item->property_id,
            'inventory_item_id' => $item->id,
            'movement_type' => 'issue_requisition',
            'quantity' => -$qty,
            'unit_cost_minor' => $item->unit_cost_minor,
            'department' => $validated['department'],
            'reference_no' => $validated['reference_no'] ?? ('REQ-'.date('Ymd')),
            'notes' => $notes,
            'performed_by' => $user->id,
        ]);

        return back()->with('success', "Issued {$qty} {$item->unit} of {$item->name} to {$validated['department']}. Remaining store balance: {$item->current_quantity} {$item->unit}.");
    }

    public function adjustStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'adjustment_type' => 'required|in:damage,shrinkage,audit_correction',
            'quantity' => 'required|integer|min:1',
            'notes' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $item = InventoryItem::findOrFail($validated['item_id']);
        $qty = (int) $validated['quantity'];

        if ($item->current_quantity < $qty) {
            return back()->withErrors(['quantity' => "Adjustment exceeds current stock ({$item->current_quantity} {$item->unit})."]);
        }

        $item->decrement('current_quantity', $qty);

        StockMovement::create([
            'tenant_id' => $item->tenant_id,
            'property_id' => $item->property_id,
            'inventory_item_id' => $item->id,
            'movement_type' => 'damage_adjustment',
            'quantity' => -$qty,
            'unit_cost_minor' => $item->unit_cost_minor,
            'department' => 'central_store',
            'reference_no' => 'ADJ-'.strtoupper($validated['adjustment_type']),
            'notes' => "Stock adjustment ({$validated['adjustment_type']}): ".$validated['notes'],
            'performed_by' => $user->id,
        ]);

        return back()->with('success', "Stock adjusted (-{$qty} {$item->unit}) for {$item->name}. Remaining balance: {$item->current_quantity}.");
    }
}
