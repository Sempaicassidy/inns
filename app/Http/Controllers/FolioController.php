<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\Payment;
use App\Models\Property;
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
            'line_type' => 'required|in:room,restaurant,bar,laundry,tour,minibar,miscellaneous,adjustment',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0.01',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();
        $bDateRecord = BusinessDate::where('property_id', $property->id)->first();
        $businessDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        $amountMinor = (int) ($validated['amount'] * 100);
        $taxMinor = (int) ($amountMinor * 0.18 / 1.18); // 18% inclusive

        DB::transaction(function () use ($folio, $validated, $amountMinor, $taxMinor, $businessDate, $user) {
            FolioLine::create([
                'tenant_id' => $user->tenant_id,
                'folio_id' => $folio->id,
                'business_date' => $businessDate->toDateString(),
                'line_type' => $validated['line_type'],
                'description' => $validated['description'],
                'amount_minor' => $amountMinor,
                'tax_minor' => $taxMinor,
                'posted_by' => $user->id,
            ]);

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
        $property = $user->property ?? Property::first();
        $bDateRecord = BusinessDate::where('property_id', $property->id)->first();
        $businessDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        $amountMinor = (int) ($validated['amount'] * 100);

        DB::transaction(function () use ($folio, $validated, $amountMinor, $businessDate, $user) {
            Payment::create([
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

            $folio->recalculateBalance();
        });

        return back()->with('success', 'Payment recorded successfully!');
    }
}
