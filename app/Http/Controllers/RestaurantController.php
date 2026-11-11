<?php

namespace App\Http\Controllers;

use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\Property;
use App\Models\Stay;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RestaurantController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id;

        // Ensure default restaurant categories exist
        $restaurantCategories = PosCategory::where('tenant_id', $tenantId)
            ->where('department', 'restaurant')
            ->orderBy('sort_order')
            ->get();

        if ($restaurantCategories->isEmpty()) {
            $catBreakfast = PosCategory::create([
                'tenant_id' => $tenantId,
                'property_id' => $property?->id,
                'department' => 'restaurant',
                'name' => 'Breakfast & Bakery',
                'icon' => 'coffee',
                'sort_order' => 1,
                'is_active' => true,
            ]);

            $catMains = PosCategory::create([
                'tenant_id' => $tenantId,
                'property_id' => $property?->id,
                'department' => 'restaurant',
                'name' => 'Main Dining & Grills',
                'icon' => 'utensils',
                'sort_order' => 2,
                'is_active' => true,
            ]);

            $catDrinks = PosCategory::create([
                'tenant_id' => $tenantId,
                'property_id' => $property?->id,
                'department' => 'restaurant',
                'name' => 'Cocktails & Beverages',
                'icon' => 'glass',
                'sort_order' => 3,
                'is_active' => true,
            ]);

            $restaurantCategories = collect([$catBreakfast, $catMains, $catDrinks]);
        }

        $restaurantCategoryIds = $restaurantCategories->pluck('id')->toArray();

        // Restaurant Menu Items
        $items = PosItem::with('category')
            ->where('tenant_id', $tenantId)
            ->where('department', 'restaurant')
            ->orderBy('name')
            ->get()
            ->map(function ($item) {
                $cost = (int) ($item->cost_price_minor ?? 0);
                $price = (int) $item->price_minor;
                $marginPct = $price > 0 ? round((($price - $cost) / $price) * 100, 1) : 0;

                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'code' => $item->code ?? 'MNU-'.substr($item->id, 0, 5),
                    'pos_category_id' => $item->pos_category_id,
                    'category_name' => $item->category?->name ?? 'Main Dining',
                    'price_minor' => $price,
                    'cost_price_minor' => $cost,
                    'is_available' => (bool) $item->is_available,
                    'unit' => $item->unit ?? 'portion',
                    'margin_pct' => $marginPct,
                ];
            });

        // Summary Metrics (Strictly Restaurant)
        $todayOrders = PosOrder::where('tenant_id', $tenantId)
            ->where('outlet_type', 'restaurant')
            ->whereDate('created_at', Carbon::today())
            ->get();

        $todaySalesMinor = (int) $todayOrders->whereIn('payment_status', ['paid', 'posted_to_room'])->sum('total_minor');
        $todayOrdersCount = $todayOrders->count();

        $monthSalesMinor = (int) PosOrder::where('tenant_id', $tenantId)
            ->where('outlet_type', 'restaurant')
            ->whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->whereIn('payment_status', ['paid', 'posted_to_room'])
            ->sum('total_minor');

        $activeOrdersCount = PosOrder::where('tenant_id', $tenantId)
            ->where('outlet_type', 'restaurant')
            ->whereIn('status', ['pending', 'preparing'])
            ->count();

        $totalMenuItems = $items->count();
        $unavailableCount = $items->where('is_available', false)->count();

        // Recent Restaurant Orders
        $recentOrders = PosOrder::with(['items', 'room', 'user'])
            ->where('tenant_id', $tenantId)
            ->where('outlet_type', 'restaurant')
            ->latest()
            ->take(25)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'order_type' => $order->order_type,
                    'table_number' => $order->table_number ?? '—',
                    'room_number' => $order->room?->room_number ?? '—',
                    'guest_name' => $order->guest_name ?? 'Walk-In Guest',
                    'server_name' => $order->user?->name ?? 'Waitstaff',
                    'subtotal_minor' => $order->subtotal_minor,
                    'tax_minor' => $order->tax_minor,
                    'total_minor' => $order->total_minor,
                    'payment_status' => $order->payment_status,
                    'payment_method' => $order->payment_method ?? 'cash',
                    'status' => $order->status,
                    'notes' => $order->notes,
                    'items_count' => $order->items->count(),
                    'items_summary' => $order->items->map(fn ($i) => "{$i->quantity}x {$i->item_name}")->join(', '),
                    'created_at' => $order->created_at->format('d M Y, H:i'),
                ];
            });

        // Top Selling Dishes in Restaurant
        $topSelling = PosOrderItem::whereHas('order', function ($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId)->where('outlet_type', 'restaurant');
        })
            ->selectRaw('item_name, sum(quantity) as total_qty, sum(total_minor) as total_rev')
            ->groupBy('item_name')
            ->orderByDesc('total_qty')
            ->take(8)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->item_name,
                'quantity' => (int) $r->total_qty,
                'revenue_minor' => (int) $r->total_rev,
            ]);

        // Active Stays for Room Service / Dining Charges
        $activeStays = Stay::with(['room', 'guest', 'folio', 'reservationRoom.reservation.folios', 'reservationRoom.reservation.guest'])
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

        return Inertia::render('Restaurant/Index', [
            'metrics' => [
                'today_sales_minor' => $todaySalesMinor,
                'month_sales_minor' => $monthSalesMinor,
                'today_orders_count' => $todayOrdersCount,
                'active_orders_count' => $activeOrdersCount,
                'total_menu_items' => $totalMenuItems,
                'unavailable_count' => $unavailableCount,
            ],
            'categories' => $restaurantCategories,
            'items' => $items,
            'recentOrders' => $recentOrders,
            'topSelling' => $topSelling,
            'activeStays' => $activeStays,
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
            'unit' => 'nullable|string|max:30',
            'description' => 'nullable|string|max:500',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id;

        PosItem::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'pos_category_id' => $validated['pos_category_id'],
            'department' => 'restaurant',
            'name' => $validated['name'],
            'code' => $validated['code'] ?? 'RST-'.strtoupper(substr(uniqid(), -5)),
            'price_minor' => (int) round($validated['price'] * 100),
            'cost_price_minor' => isset($validated['cost_price']) ? (int) round($validated['cost_price'] * 100) : 0,
            'unit' => $validated['unit'] ?? 'portion',
            'description' => $validated['description'] ?? null,
            'is_available' => true,
        ]);

        return redirect()->back()->with('success', 'Restaurant menu item added successfully.');
    }

    public function updateItem(Request $request, PosItem $item): RedirectResponse
    {
        $validated = $request->validate([
            'pos_category_id' => 'required|exists:pos_categories,id',
            'name' => 'required|string|max:150',
            'code' => 'nullable|string|max:50',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'unit' => 'nullable|string|max:30',
            'description' => 'nullable|string|max:500',
        ]);

        $item->update([
            'pos_category_id' => $validated['pos_category_id'],
            'name' => $validated['name'],
            'code' => $validated['code'] ?? $item->code,
            'price_minor' => (int) round($validated['price'] * 100),
            'cost_price_minor' => isset($validated['cost_price']) ? (int) round($validated['cost_price'] * 100) : $item->cost_price_minor,
            'unit' => $validated['unit'] ?? $item->unit,
            'description' => $validated['description'] ?? $item->description,
        ]);

        return redirect()->back()->with('success', 'Restaurant menu item updated successfully.');
    }

    public function toggleAvailability(PosItem $item): RedirectResponse
    {
        $item->is_available = ! $item->is_available;
        $item->save();

        $statusLabel = $item->is_available ? 'marked as Available' : 'marked as 86 / Out of Stock';

        return redirect()->back()->with('success', "Item {$item->name} {$statusLabel}.");
    }

    public function updateOrderStatus(Request $request, PosOrder $order): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,served,cancelled',
        ]);

        $order->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', "Order #{$order->order_number} status updated to {$validated['status']}.");
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'icon' => 'nullable|string|max:50',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();
        $tenantId = $user->tenant_id ?? $property?->tenant_id;

        $maxOrder = PosCategory::where('tenant_id', $tenantId)->where('department', 'restaurant')->max('sort_order') ?? 0;

        PosCategory::create([
            'tenant_id' => $tenantId,
            'property_id' => $property?->id,
            'department' => 'restaurant',
            'name' => $validated['name'],
            'icon' => $validated['icon'] ?? 'utensils',
            'sort_order' => $maxOrder + 1,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', 'Restaurant category created successfully.');
    }
}
