<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Tenant;
use App\Services\LedgerService;
use App\Services\TraVfdService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class FolioController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status');
        $search = $request->input('search');

        $folios = Folio::with(['reservation.guest', 'stay.room', 'lines', 'payments'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, function ($q, $search) {
                $q->where('folio_number', 'like', "%{$search}%")
                    ->orWhereHas('reservation.guest', function ($gq) use ($search) {
                        $gq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Folios/Index', [
            'folios' => $folios,
            'filters' => [
                'status' => $status ?? '',
                'search' => $search ?? '',
            ],
        ]);
    }

    public function show(Folio $folio): Response
    {
        $folio->load([
            'reservation.guest',
            'reservation.company',
            'stay.room.roomType',
            'lines.postedBy',
            'payments.receiver',
        ]);

        return Inertia::render('Folios/Show', [
            'folio' => $folio,
        ]);
    }

    public function addCharge(Request $request, Folio $folio): RedirectResponse
    {
        $validated = $request->validate([
            'line_type' => 'required|in:room,restaurant,bar,laundry,tour,minibar,miscellaneous,adjustment,grocery',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = $request->user();
        $bDateRecord = BusinessDate::where('property_id', $folio->property_id)->first();
        $businessDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        $amountMinor = (int) ($validated['amount'] * 100);
        $vatRate = $this->vatRate($folio->property);
        $taxMinor = (int) ($amountMinor * $vatRate / (1 + $vatRate)); // VAT inclusive

        DB::transaction(function () use ($folio, $validated, $amountMinor, $taxMinor, $businessDate, $user) {
            $line = FolioLine::create([
                'tenant_id' => $user->tenant_id,
                'folio_id' => $folio->id,
                'business_date' => $businessDate->toDateString(),
                'line_type' => $validated['line_type'],
                'description' => $validated['description'],
                'amount_minor' => $amountMinor,
                'tax_minor' => $taxMinor,
                'posted_by' => $user->id,
            ]);

            app(LedgerService::class)->post(
                (string) $user->tenant_id,
                $folio->property_id,
                'folio_charge',
                (string) $line->id,
                "Folio charge: {$validated['description']}",
                [
                    ['code' => '1050', 'direction' => 'debit', 'amount_minor' => $amountMinor],
                    ['code' => LedgerService::revenueCode($validated['line_type']), 'direction' => 'credit', 'amount_minor' => $amountMinor],
                ],
                $businessDate->toDateString(),
            );

            $folio->recalculateBalance();
        });

        return back()->with('success', 'Charge posted to folio successfully!');
    }

    public function addPayment(Request $request, Folio $folio): RedirectResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:cash,mpesa,tigopesa,airtelmoney,halopesa,card,bank_transfer,city_ledger',
            'amount' => 'required|numeric|min:0.01',
            'provider' => 'nullable|string|max:100',
            'provider_ref' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();
        $bDateRecord = BusinessDate::where('property_id', $folio->property_id)->first();
        $businessDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        $amountMinor = (int) ($validated['amount'] * 100);

        // Settled/closed folios must not accept new payments
        if (in_array($folio->status, ['settled', 'closed', 'cancelled'], true)) {
            return back()->with('error', 'This folio is already settled and cannot accept new payments.');
        }

        DB::transaction(function () use ($folio, $validated, $amountMinor, $businessDate, $user) {
            $payment = Payment::create([
                'tenant_id' => $user->tenant_id,
                'folio_id' => $folio->id,
                'business_date' => $businessDate->toDateString(),
                'payment_method' => $validated['payment_method'],
                'provider' => $validated['provider'] ?? null,
                'provider_ref' => $validated['provider_ref'] ?? null,
                'amount_minor' => $amountMinor,
                'currency' => $folio->currency,
                'status' => 'confirmed',
                'received_by' => $user->id,
                'notes' => $validated['notes'] ?? null,
            ]);

            app(LedgerService::class)->post(
                (string) $user->tenant_id,
                $folio->property_id,
                'folio_payment',
                (string) $payment->id,
                "Guest payment ({$validated['payment_method']})",
                [
                    ['code' => LedgerService::tenderCode($validated['payment_method']), 'direction' => 'debit', 'amount_minor' => $amountMinor],
                    ['code' => '1050', 'direction' => 'credit', 'amount_minor' => $amountMinor],
                ],
                $businessDate->toDateString(),
            );

            // Record fiscal document for TRA/VFD (submits only when configured)
            $tenant = Tenant::find($user->tenant_id);
            if ($tenant) {
                app(TraVfdService::class)->recordInvoice(
                    $tenant,
                    'folio_payment',
                    (string) $payment->id,
                    [
                        'tin' => $tenant->settings['tin'] ?? null,
                        'vrn' => $tenant->settings['vrn'] ?? null,
                        'seller_name' => $tenant->name,
                        'lines' => [[
                            'description' => 'Guest folio payment',
                            'quantity' => 1,
                            'unit_price_minor' => $amountMinor,
                            'total_minor' => $amountMinor,
                        ]],
                        'totals' => ['total_minor' => $amountMinor, 'currency' => $folio->currency],
                    ],
                    $folio->property_id,
                );
            }

            $folio->recalculateBalance();
        });

        return back()->with('success', 'Payment recorded successfully!');
    }

    /**
     * VAT rate as a decimal (e.g. 0.18). Reads property tax_config override,
     * falling back to the standard Tanzanian rate of 18%.
     */
    private function vatRate(?Property $property): float
    {
        $percent = $property?->tax_config['vat_rate_percent'] ?? null;

        if (is_numeric($percent) && (float) $percent > 0) {
            return (float) $percent / 100;
        }

        return 0.18;
    }
}
