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
use App\Services\LedgerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
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
        $user = $request->user();
        $tenantId = $user->tenant_id;
        $property = $this->resolveActiveProperty($request);

        $validated = $request->validate([
            'order_type' => 'required|in:dine_in,room_delivery,takeaway',
            'table_number' => 'nullable|string|max:20',
            'room_id' => [
                'nullable',
                Rule::exists('rooms', 'id')->where('tenant_id', $tenantId)->where('property_id', $property?->id),
            ],
            'stay_id' => [
                'nullable',
                Rule::exists('stays', 'id')->where('tenant_id', $tenantId),
            ],
            'folio_id' => [
                'nullable',
                Rule::exists('folios', 'id')->where('tenant_id', $tenantId),
            ],
            'guest_name' => 'nullable|string|max:100',
            'payment_method' => 'required|in:cash,card,mpesa,room_folio',
            'items' => 'required|array|min:1',
            'items.*.item_id' => [
                'required',
                Rule::exists('pos_items', 'id')->where('tenant_id', $tenantId)->where('department', 'restaurant'),
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

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

        $order = DB::transaction(function () use ($validated, $user, $tenantId, $property, $orderLines, $subtotal, $tax, $total, $orderNumber, $paymentStatus) {
            $order = PosOrder::create([
                'tenant_id' => $tenantId,
                'property_id' => $property?->id,
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
                $folio = Folio::where('tenant_id', $tenantId)->find($validated['folio_id']);
                if ($folio) {
                    FolioLine::create([
                        'tenant_id' => $tenantId,
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

            // Room-charge orders post to AR; paid orders post to the tender account
            if ($paymentStatus === 'posted_to_room') {
                app(LedgerService::class)->post(
                    (string) $tenantId,
                    $property?->id,
                    'pos_order',
                    (string) $order->id,
                    "POS order #{$orderNumber} charged to guest folio",
                    [
                        ['code' => '1050', 'direction' => 'debit', 'amount_minor' => $total],
                        ['code' => '4002', 'direction' => 'credit', 'amount_minor' => $total],
                    ],
                );
            } else {
                app(LedgerService::class)->post(
                    (string) $tenantId,
                    $property?->id,
                    'pos_order',
                    (string) $order->id,
                    "POS order #{$orderNumber} ({$validated['payment_method']})",
                    [
                        ['code' => LedgerService::tenderCode($validated['payment_method']), 'direction' => 'debit', 'amount_minor' => $total],
                        ['code' => '4002', 'direction' => 'credit', 'amount_minor' => $total],
                    ],
                );
            }

            return $order;
        });

        return redirect()->back()->with('success', "Order #{$orderNumber} created successfully.");
    }
}
