<?php

namespace App\Http\Controllers;

use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\Property;
use App\Models\Stay;
use App\Models\StockMovement;
use App\Models\Tenant;
use App\Services\LedgerService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GroceryController extends Controller
{
    protected function ensureDefaultGrocerySetup(string $tenantId, ?string $propertyId): void
    {
        // 1. Categories
        $groceryCategories = PosCategory::where('tenant_id', $tenantId)
            ->where('department', 'grocery')
            ->orderBy('sort_order')
            ->get();

        if ($groceryCategories->isEmpty()) {
            $defaultCat = PosCategory::create([
                'tenant_id' => $tenantId,
                'property_id' => $propertyId,
                'department' => 'grocery',
                'name' => 'Snacks & Confectionery',
                'icon' => 'shopping-bag',
                'sort_order' => 1,
                'is_active' => true,
            ]);

            $drinksCat = PosCategory::create([
                'tenant_id' => $tenantId,
                'property_id' => $propertyId,
                'department' => 'grocery',
                'name' => 'Bottled Drinks & Sodas',
                'icon' => 'glass',
                'sort_order' => 2,
                'is_active' => true,
            ]);

            $careCat = PosCategory::create([
                'tenant_id' => $tenantId,
                'property_id' => $propertyId,
                'department' => 'grocery',
                'name' => 'Personal Care & Sundries',
                'icon' => 'package',
                'sort_order' => 3,
                'is_active' => true,
            ]);

            $groceryCategories = collect([$defaultCat, $drinksCat, $careCat]);
        }
    }

    public function index(Request $request): Response
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $property = $user->property ?? ($tenantId ? Property::where('tenant_id', $tenantId)->first() : null);

        $this->ensureDefaultGrocerySetup((string) $tenantId, $property?->id);

        $groceryCategories = PosCategory::where('tenant_id', $tenantId)
            ->where('department', 'grocery')
            ->orderBy('sort_order')
            ->get();

        $groceryCategoryIds = $groceryCategories->pluck('id')->toArray();

        // Items strictly in Grocery department
        $items = PosItem::with('category')
            ->where('tenant_id', $tenantId)
            ->where('department', 'grocery')
            ->orderBy('name')
            ->get()
            ->map(function ($item) {
                $cost = (int) ($item->cost_price_minor ?? 0);
                $price = (int) $item->price_minor;
                $marginPct = $price > 0 ? round((($price - $cost) / $price) * 100, 1) : 0;
                $stockVal = $cost * ($item->stock_quantity ?? 0);

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'code' => $item->code ?? 'SKU-'.substr($item->id, 0, 6),
                    'pos_category_id' => $item->pos_category_id,
                    'category_name' => $item->category?->name ?? 'Grocery',
                    'price_minor' => $price,
                    'cost_price_minor' => $cost,
                    'stock_quantity' => (int) ($item->stock_quantity ?? 0),
                    'reorder_level' => (int) ($item->reorder_level ?? 10),
                    'unit' => $item->unit ?? 'pcs',
                    'is_available' => (bool) $item->is_available,
                    'margin_pct' => $marginPct,
                    'stock_valuation_minor' => $stockVal,
                    'status' => ($item->stock_quantity ?? 0) <= 0
                        ? 'out_of_stock'
                        : (($item->stock_quantity ?? 0) <= ($item->reorder_level ?? 10) ? 'low_stock' : 'optimal'),
                ];
            });

        // Summary Metrics (Strictly Grocery)
        $totalItemsCount = $items->count();
        $totalCostValuation = $items->sum('stock_valuation_minor');
        $totalRetailValuation = $items->sum(fn ($i) => $i['price_minor'] * $i['stock_quantity']);
        $lowStockCount = $items->where('status', 'low_stock')->count();
        $outOfStockCount = $items->where('status', 'out_of_stock')->count();
        $optimalCount = $items->where('status', 'optimal')->count();

        // Recent Grocery Orders (Strictly outlet_type = grocery)
        $recentOrders = PosOrder::with(['items', 'room'])
            ->where('tenant_id', $tenantId)
            ->where('outlet_type', 'grocery')
            ->latest()
            ->take(20)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'order_type' => $order->order_type,
                    'table_number' => $order->table_number,
                    'room_number' => $order->room?->room_number ?? 'Walk-In',
                    'guest_name' => $order->guest_name ?? 'Walk-In Customer',
                    'total_minor' => $order->total_minor,
                    'payment_method' => $order->payment_method ?? 'cash',
                    'payment_status' => $order->payment_status,
                    'status' => $order->status,
                    'items_count' => $order->items->count(),
                    'created_at' => $order->created_at->format('d M Y, H:i'),
                ];
            });

        // Grocery Revenue Calculations
        $todayRevenueMinor = (int) PosOrder::where('tenant_id', $tenantId)
            ->where('outlet_type', 'grocery')
            ->whereDate('created_at', Carbon::today())
            ->whereIn('payment_status', ['paid', 'posted_to_room'])
            ->sum('total_minor');

        $monthRevenueMinor = (int) PosOrder::where('tenant_id', $tenantId)
            ->where('outlet_type', 'grocery')
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->whereIn('payment_status', ['paid', 'posted_to_room'])
            ->sum('total_minor');

        // Recent Stock Movements for Grocery
        $movements = StockMovement::with(['posItem', 'user'])
            ->where('tenant_id', $tenantId)
            ->whereNotNull('pos_item_id')
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'item_name' => $m->posItem?->name ?? 'Grocery Item',
                    'movement_type' => $m->movement_type,
                    'quantity' => $m->quantity,
                    'reference_no' => $m->reference_no ?? '—',
                    'notes' => $m->notes ?? '—',
                    'performed_by' => $m->user?->name ?? 'Manager',
                    'created_at' => $m->created_at->format('d M Y, H:i'),
                ];
            });

        // Active Stays for Room Folio Posting
        $activeStays = Stay::with(['room', 'guest', 'folio', 'reservationRoom.reservation.folios', 'reservationRoom.reservation.guest'])
            ->where('tenant_id', $tenantId)
            ->whereNull('checked_out_at')
            ->get()
            ->map(function ($stay) {
                $res = $stay->reservationRoom?->reservation;
                $folioId = $stay->folio?->id
                    ?? $res?->folios?->where('status', 'open')->first()?->id
                    ?? $res?->folios?->first()?->id;

                return [
                    'stay_id' => $stay->id,
                    'room_number' => $stay->room?->room_number ?? '—',
                    'guest_name' => $stay->guest?->full_name ?? $res?->guest?->full_name ?? 'Guest',
                    'folio_id' => $folioId,
                ];
            });

        // Category performance and valuation breakdown for manager overview
        $categoryBreakdown = $groceryCategories->map(function ($cat) use ($items) {
            $catItems = $items->where('pos_category_id', $cat->id);
            $costVal = $catItems->sum('stock_valuation_minor');
            $retailVal = $catItems->sum(fn ($i) => $i['price_minor'] * $i['stock_quantity']);

            return [
                'id' => $cat->id,
                'name' => $cat->name,
                'items_count' => $catItems->count(),
                'cost_valuation_minor' => $costVal,
                'retail_valuation_minor' => $retailVal,
                'margin_profit_minor' => max(0, $retailVal - $costVal),
                'low_stock_count' => $catItems->where('status', 'low_stock')->count(),
                'out_of_stock_count' => $catItems->where('status', 'out_of_stock')->count(),
            ];
        });

        // Top selling grocery retail products
        $topSelling = PosOrderItem::whereHas('order', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId)
                ->where('outlet_type', 'grocery')
                ->whereIn('payment_status', ['paid', 'posted_to_room']);
        })
            ->selectRaw('item_name, sum(quantity) as total_qty, sum(total_minor) as total_sales_minor')
            ->groupBy('item_name')
            ->orderByDesc('total_qty')
            ->take(6)
            ->get();

        return Inertia::render('Grocery/Index', [
            'metrics' => [
                'today_revenue_minor' => $todayRevenueMinor,
                'month_revenue_minor' => $monthRevenueMinor,
                'total_cost_valuation_minor' => $totalCostValuation,
                'total_retail_valuation_minor' => $totalRetailValuation,
                'total_skus' => $totalItemsCount,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'optimal_count' => $optimalCount,
            ],
            'items' => $items,
            'categories' => $groceryCategories,
            'allCategories' => $groceryCategories,
            'categoryBreakdown' => $categoryBreakdown,
            'topSelling' => $topSelling,
            'recentOrders' => $recentOrders,
            'recentMovements' => $movements,
            'activeStays' => $activeStays,
        ]);
    }

    /**
     * Super / Mini Market POS terminal — item grid, cart and checkout.
     */
    public function pos(Request $request): Response
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $property = $user->property ?? ($tenantId ? Property::where('tenant_id', $tenantId)->first() : null);

        $this->ensureDefaultGrocerySetup((string) $tenantId, $property?->id);

        $categories = PosCategory::where('tenant_id', $tenantId)
            ->where('department', 'grocery')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'icon']);

        $items = PosItem::with('category')
            ->where('tenant_id', $tenantId)
            ->where('department', 'grocery')
            ->where('is_available', true)
            ->orderBy('name')
            ->get()
            ->map(fn ($item) => [
                'id' => $item->id,
                'pos_category_id' => $item->pos_category_id,
                'name' => $item->name,
                'code' => $item->code ?? 'SKU-'.substr($item->id, 0, 6),
                'price_minor' => (int) $item->price_minor,
                'stock_quantity' => (int) ($item->stock_quantity ?? 0),
                'unit' => $item->unit ?? 'pcs',
                'category' => $item->category ? ['id' => $item->category->id, 'name' => $item->category->name] : null,
            ]);

        $activeStays = Stay::with(['room', 'guest', 'folio', 'reservationRoom.reservation.folios', 'reservationRoom.reservation.guest'])
            ->where('tenant_id', $tenantId)
            ->whereNull('checked_out_at')
            ->get()
            ->map(function ($stay) {
                $res = $stay->reservationRoom?->reservation;
                $folioId = $stay->folio?->id
                    ?? $res?->folios?->where('status', 'open')->first()?->id
                    ?? $res?->folios?->first()?->id;

                return [
                    'stay_id' => $stay->id,
                    'room_id' => $stay->room_id,
                    'room_number' => $stay->room?->room_number ?? '—',
                    'guest_name' => $stay->guest?->full_name ?? $res?->guest?->full_name ?? 'Guest',
                    'folio_id' => $folioId,
                ];
            });

        $recentOrders = PosOrder::with(['items', 'room'])
            ->where('tenant_id', $tenantId)
            ->where('outlet_type', 'grocery')
            ->latest()
            ->take(20)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'guest_name' => $order->guest_name ?? 'Walk-In Customer',
                'room_number' => $order->room?->room_number ?? null,
                'total_minor' => $order->total_minor,
                'payment_method' => $order->payment_method ?? 'cash',
                'created_at' => $order->created_at->toIso8601String(),
                'items' => $order->items->map(fn ($i) => [
                    'item_name' => $i->item_name,
                    'quantity' => $i->quantity,
                    'total_minor' => $i->total_minor,
                ])->all(),
            ]);

        $todayRevenueMinor = (int) PosOrder::where('tenant_id', $tenantId)
            ->where('outlet_type', 'grocery')
            ->whereDate('created_at', Carbon::today())
            ->whereIn('payment_status', ['paid', 'posted_to_room'])
            ->sum('total_minor');

        return Inertia::render('Grocery/POS', [
            'categories' => $categories,
            'items' => $items,
            'activeStays' => $activeStays,
            'recentOrders' => $recentOrders,
            'stats' => [
                'today_total_minor' => $todayRevenueMinor,
                'today_order_count' => PosOrder::where('tenant_id', $tenantId)
                    ->where('outlet_type', 'grocery')
                    ->whereDate('created_at', Carbon::today())
                    ->count(),
            ],
        ]);
    }

    public function storeItem(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pos_category_id' => 'required|exists:pos_categories,id',
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:50',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:30',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id;
        $property = $user->property ?? ($tenantId ? Property::where('tenant_id', $tenantId)->first() : null);

        $item = PosItem::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'pos_category_id' => $validated['pos_category_id'],
            'department' => 'grocery',
            'name' => $validated['name'],
            'code' => $validated['code'] ?: 'GRO-'.strtoupper(substr(uniqid(), -5)),
            'price_minor' => (int) round($validated['price'] * 100),
            'cost_price_minor' => ! empty($validated['cost_price']) ? (int) round($validated['cost_price'] * 100) : 0,
            'stock_quantity' => (int) $validated['stock_quantity'],
            'reorder_level' => ! empty($validated['reorder_level']) ? (int) $validated['reorder_level'] : 10,
            'unit' => $validated['unit'] ?: 'pcs',
            'is_available' => true,
        ]);

        if ($item->stock_quantity > 0) {
            StockMovement::create([
                'tenant_id' => $tenantId,
                'property_id' => $property?->id,
                'pos_item_id' => $item->id,
                'movement_type' => 'receive_stock',
                'quantity' => $item->stock_quantity,
                'unit_cost_minor' => $item->cost_price_minor,
                'reference_no' => 'INITIAL-ENTRY',
                'notes' => 'Initial stock registered into grocery catalog',
                'performed_by' => $user->id,
            ]);
        }

        return back()->with('success', "Grocery product '{$item->name}' added successfully!");
    }

    public function updateItem(Request $request, PosItem $item): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:50',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'reorder_level' => 'nullable|integer|min:0',
            'unit' => 'nullable|string|max:30',
            'is_available' => 'nullable|boolean',
        ]);

        $item->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $item->code,
            'price_minor' => (int) round($validated['price'] * 100),
            'cost_price_minor' => isset($validated['cost_price']) ? (int) round($validated['cost_price'] * 100) : $item->cost_price_minor,
            'reorder_level' => isset($validated['reorder_level']) ? (int) $validated['reorder_level'] : $item->reorder_level,
            'unit' => $validated['unit'] ?? $item->unit,
            'is_available' => $request->has('is_available') ? (bool) $request->input('is_available') : $item->is_available,
        ]);

        return back()->with('success', "Grocery item '{$item->name}' updated successfully!");
    }

    public function restock(Request $request, PosItem $item): RedirectResponse
    {
        $validated = $request->validate([
            'add_quantity' => 'required|integer|min:1',
            'unit_cost' => 'nullable|numeric|min:0',
            'reference_no' => 'nullable|string|max:60',
            'notes' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $qty = (int) $validated['add_quantity'];
        $unitCostMinor = isset($validated['unit_cost']) && $validated['unit_cost'] > 0
            ? (int) round($validated['unit_cost'] * 100)
            : $item->cost_price_minor;

        $item->increment('stock_quantity', $qty);
        if ($unitCostMinor > 0) {
            $item->update(['cost_price_minor' => $unitCostMinor]);
        }

        StockMovement::create([
            'tenant_id' => $item->tenant_id,
            'property_id' => $item->property_id,
            'pos_item_id' => $item->id,
            'movement_type' => 'receive_stock',
            'quantity' => $qty,
            'unit_cost_minor' => $unitCostMinor,
            'reference_no' => $validated['reference_no'] ?? ('RESTOCK-'.date('Ymd')),
            'notes' => $validated['notes'] ?? "Manager replenished +{$qty} {$item->unit}",
            'performed_by' => $user->id,
        ]);

        return back()->with('success', "Added +{$qty} {$item->unit} to {$item->name}. New stock balance: {$item->stock_quantity}.");
    }

    public function toggleAvailability(Request $request, PosItem $item): RedirectResponse
    {
        $item->update(['is_available' => ! $item->is_available]);

        $statusText = $item->is_available ? 'active & available' : 'disabled / hidden';

        return back()->with('success', "{$item->name} is now {$statusText}.");
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id;
        $property = $user->property ?? ($tenantId ? Property::where('tenant_id', $tenantId)->first() : null);

        if (! $tenantId) {
            return back()->withErrors(['name' => 'No tenant context for this category.']);
        }

        $maxOrder = PosCategory::where('tenant_id', $tenantId)
            ->where('department', 'grocery')
            ->max('sort_order') ?? 0;

        PosCategory::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'department' => 'grocery',
            'name' => $validated['name'],
            'icon' => $validated['icon'] ?? 'package',
            'sort_order' => $maxOrder + 1,
            'is_active' => true,
        ]);

        return back()->with('success', "Category '{$validated['name']}' created successfully.");
    }

    public function storeOrder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:cash,card,mpesa,room_folio',
            'folio_id' => 'nullable|exists:folios,id',
            'room_id' => 'nullable|exists:rooms,id',
            'guest_name' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:pos_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $property = $user->property;
        $tenantId = $user->tenant_id;

        if (! $tenantId) {
            return back()->withErrors(['items' => 'No tenant context for this sale.']);
        }

        $subtotal = 0;
        $orderLines = [];
        $stockErrors = [];

        // Validate every line against tenant-owned grocery catalog before mutating anything
        foreach ($validated['items'] as $itemData) {
            $item = PosItem::where('tenant_id', $tenantId)
                ->where('department', 'grocery')
                ->find($itemData['item_id']);
            if (! $item) {
                return back()->withErrors(['items' => "Item {$itemData['item_id']} is not a grocery product in this tenant."]);
            }
            if ((int) $item->stock_quantity < (int) $itemData['quantity']) {
                $stockErrors[] = "{$item->name}: only {$item->stock_quantity} in stock";
            }
        }

        if ($stockErrors !== []) {
            return back()->withErrors(['items' => implode('; ', $stockErrors)]);
        }

        if ($validated['payment_method'] === 'room_folio' && ! empty($validated['folio_id'])) {
            $folioCheck = Folio::where('tenant_id', $tenantId)->find($validated['folio_id']);
            if (! $folioCheck || in_array($folioCheck->status, ['settled', 'closed', 'cancelled'], true)) {
                return back()->withErrors(['folio_id' => 'Selected folio is not open for charges.']);
            }
        }

        DB::transaction(function () use ($validated, $user, $property, $tenantId, &$subtotal, &$orderLines) {
            foreach ($validated['items'] as $itemData) {
                $item = PosItem::where('tenant_id', $tenantId)
                    ->where('department', 'grocery')
                    ->lockForUpdate()
                    ->findOrFail($itemData['item_id']);

                $lineTotal = $item->price_minor * $itemData['quantity'];
                $subtotal += $lineTotal;

                // Deduct grocery stock
                $item->decrement('stock_quantity', $itemData['quantity']);

                // Record stock movement for retail sale
                StockMovement::create([
                    'tenant_id' => $tenantId,
                    'property_id' => $property?->id,
                    'pos_item_id' => $item->id,
                    'movement_type' => 'issue_department',
                    'quantity' => $itemData['quantity'],
                    'unit_cost_minor' => $item->cost_price_minor,
                    'department' => 'retail_grocery',
                    'reference_no' => 'SALE-'.date('Ymd-His'),
                    'notes' => "Retail counter sale ({$itemData['quantity']}x)",
                    'performed_by' => $user->id,
                ]);

                $orderLines[] = [
                    'pos_item_id' => $item->id,
                    'item_name' => $item->name,
                    'unit_price_minor' => $item->price_minor,
                    'quantity' => $itemData['quantity'],
                    'total_minor' => $lineTotal,
                ];
            }
        });

        $orderNumber = 'GRO-'.strtoupper(uniqid());
        $paymentStatus = $validated['payment_method'] === 'room_folio' ? 'posted_to_room' : 'paid';

        $order = PosOrder::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'user_id' => $user->id,
            'order_number' => $orderNumber,
            'outlet_type' => 'grocery',
            'order_type' => 'retail_counter',
            'guest_name' => $validated['guest_name'] ?? 'Walk-In Customer',
            'room_id' => $validated['room_id'] ?? null,
            'subtotal_minor' => $subtotal,
            'tax_minor' => 0,
            'total_minor' => $subtotal,
            'payment_status' => $paymentStatus,
            'payment_method' => $validated['payment_method'],
            'folio_id' => $validated['folio_id'] ?? null,
            'status' => 'served',
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($orderLines as $line) {
            $line['pos_order_id'] = $order->id;
            PosOrderItem::create($line);
        }

        if ($paymentStatus === 'posted_to_room') {
            app(LedgerService::class)->post(
                (string) $tenantId,
                $property?->id,
                'pos_order',
                (string) $order->id,
                "Grocery sale #{$orderNumber} charged to guest folio",
                [
                    ['code' => '1050', 'direction' => 'debit', 'amount_minor' => $order->total_minor],
                    ['code' => '4003', 'direction' => 'credit', 'amount_minor' => $order->total_minor],
                ],
            );
        } else {
            app(LedgerService::class)->post(
                (string) $tenantId,
                $property?->id,
                'pos_order',
                (string) $order->id,
                "Grocery sale #{$orderNumber} ({$validated['payment_method']})",
                [
                    ['code' => LedgerService::tenderCode($validated['payment_method']), 'direction' => 'debit', 'amount_minor' => $order->total_minor],
                    ['code' => '4003', 'direction' => 'credit', 'amount_minor' => $order->total_minor],
                ],
            );
        }

        // Post to guest room folio if room_folio chosen
        if ($validated['payment_method'] === 'room_folio' && ! empty($validated['folio_id'])) {
            $folio = Folio::where('tenant_id', $tenantId)->find($validated['folio_id']);
            if ($folio && ! in_array($folio->status, ['settled', 'closed', 'cancelled'], true)) {
                FolioLine::create([
                    'tenant_id' => $tenantId,
                    'folio_id' => $folio->id,
                    'business_date' => today()->toDateString(),
                    'line_type' => 'grocery',
                    'description' => "Grocery Minimart Sale #{$orderNumber} (".count($orderLines).' items)',
                    'amount_minor' => $subtotal,
                    'tax_minor' => 0,
                    'posted_by' => $user->id,
                ]);

                $folio->recalculateBalance();
            }
        }

        $tenant = Tenant::find($tenantId);

        return back()
            ->with('success', "Grocery sale #{$orderNumber} recorded successfully!")
            ->with('sale_receipt', [
                'hotelName' => $tenant?->name ?? ($property?->name ?? 'THE INNS'),
                'hotelAddress' => $property?->address ?? null,
                'hotelPhone' => $property?->phone ?? null,
                'receiptNumber' => $orderNumber,
                'receiptType' => 'POS RECEIPT',
                'dateTime' => now()->format('Y-m-d H:i:s'),
                'cashierName' => $user->name,
                'guestName' => $order->guest_name,
                'roomNumber' => $order->room?->room_number ?? null,
                'items' => collect($orderLines)->map(fn ($line) => [
                    'description' => $line['item_name'],
                    'quantity' => $line['quantity'],
                    'unit_price' => $line['unit_price_minor'],
                    'amount' => $line['total_minor'],
                ])->all(),
                'subtotal' => $subtotal,
                'grandTotal' => $order->total_minor,
                'paymentMethod' => $validated['payment_method'],
                'amountsAreMinor' => true,
                'footerText' => 'Thank you for shopping with us!',
            ]);
    }
}
