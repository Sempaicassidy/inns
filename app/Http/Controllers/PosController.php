<?php

namespace App\Http\Controllers;

use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\PosCategory;
use App\Models\PosItem;
use App\Models\PosOrder;
use App\Models\PosOrderItem;
use App\Models\Property;
use App\Models\Room;
use App\Models\Stay;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();

        $categories = PosCategory::with(['items' => function ($q) {
            $q->where('department', 'restaurant')->where('is_available', true);
        }])
            ->where('tenant_id', $user->tenant_id)
            ->where('department', 'restaurant')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $items = PosItem::with('category')
            ->where('tenant_id', $user->tenant_id)
            ->where('department', 'restaurant')
            ->where('is_available', true)
            ->get();

        // In-house stays with open folios for room-posting
        $activeStays = Stay::with(['room.roomType', 'guest', 'folio', 'reservationRoom.reservation.folios', 'reservationRoom.reservation.guest'])
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
                    'room_id' => $stay->room_id,
                    'guest_name' => $stay->guest?->full_name ?? $res?->guest?->full_name ?? 'Guest',
                    'folio_id' => $folioId,
                ];
            });

        $recentOrders = PosOrder::with(['items', 'room', 'server'])
            ->where('tenant_id', $user->tenant_id)
            ->where('outlet_type', 'restaurant')
            ->latest()
            ->take(20)
            ->get();

        $todayTotalMinor = PosOrder::where('tenant_id', $user->tenant_id)
            ->where('outlet_type', 'restaurant')
            ->whereDate('created_at', today())
            ->sum('total_minor');

        $todayOrderCount = PosOrder::where('tenant_id', $user->tenant_id)
            ->where('outlet_type', 'restaurant')
            ->whereDate('created_at', today())
            ->count();

        return Inertia::render('Pos/Index', [
            'categories' => $categories,
            'items' => $items,
            'activeStays' => $activeStays,
            'recentOrders' => $recentOrders,
            'stats' => [
                'today_total_minor' => $todayTotalMinor,
                'today_order_count' => $todayOrderCount,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'order_type' => 'required|in:dine_in,room_delivery,takeaway',
            'table_number' => 'nullable|string|max:20',
            'room_id' => 'nullable|exists:rooms,id',
            'stay_id' => 'nullable|exists:stays,id',
            'folio_id' => 'nullable|exists:folios,id',
            'guest_name' => 'nullable|string|max:100',
            'payment_method' => 'required|in:cash,card,mpesa,room_folio',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|exists:pos_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();

        // Calculate subtotal and lines
        $subtotal = 0;
        $orderLines = [];

        foreach ($validated['items'] as $itemData) {
            $item = PosItem::find($itemData['item_id']);
            if (! $item) {
                continue;
            }
            $lineTotal = $item->price_minor * $itemData['quantity'];
            $subtotal += $lineTotal;

            $orderLines[] = [
                'pos_item_id' => $item->id,
                'item_name' => $item->name,
                'unit_price_minor' => $item->price_minor,
                'quantity' => $itemData['quantity'],
                'total_minor' => $lineTotal,
            ];
        }

        $tax = (int) round($subtotal * 0.18); // 18% VAT
        $total = $subtotal + $tax;

        $orderNumber = 'POS-'.strtoupper(uniqid());

        $paymentStatus = $validated['payment_method'] === 'room_folio' ? 'posted_to_room' : 'paid';

        $order = PosOrder::create([
            'tenant_id' => $user->tenant_id,
            'property_id' => $property->id,
            'user_id' => $user->id,
            'order_number' => $orderNumber,
            'outlet_type' => 'restaurant',
            'order_type' => $validated['order_type'],
            'table_number' => $validated['table_number'] ?? null,
            'room_id' => $validated['room_id'] ?? null,
            'stay_id' => $validated['stay_id'] ?? null,
            'guest_name' => $validated['guest_name'] ?? 'Walk-in Guest',
            'subtotal_minor' => $subtotal,
            'tax_minor' => $tax,
            'total_minor' => $total,
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

        // If posted to guest room folio, attach FolioLine!
        if ($validated['payment_method'] === 'room_folio' && ! empty($validated['folio_id'])) {
            $folio = Folio::find($validated['folio_id']);
            if ($folio) {
                FolioLine::create([
                    'tenant_id' => $user->tenant_id,
                    'folio_id' => $folio->id,
                    'business_date' => today()->toDateString(),
                    'line_type' => 'restaurant',
                    'description' => "Restaurant Order #{$orderNumber} (".count($orderLines).' items)',
                    'amount_minor' => $total,
                    'tax_minor' => $tax,
                    'posted_by' => $user->id,
                ]);

                $folio->recalculateBalance();
            }
        }

        return redirect()->back()->with('success', "Order #{$orderNumber} created successfully.");
    }
}
