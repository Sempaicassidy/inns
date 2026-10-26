<?php

namespace App\Http\Controllers;

use App\Models\BusinessDate;
use App\Models\Folio;
use App\Models\FolioLine;
use App\Models\NightAudit;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Stay;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class NightAuditController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();
        $bDateRecord = BusinessDate::where('property_id', $property->id)->first();
        $currentDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        // 1. Pending departures that haven't checked out yet
        $pendingDepartures = Reservation::with(['guest', 'reservationRooms.room'])
            ->whereDate('check_out', '<=', $currentDate->toDateString())
            ->where('status', 'checked_in')
            ->get();

        // 2. In-house stays to be charged tonight
        $inHouseStays = Stay::with(['guest', 'room.roomType', 'reservationRoom.reservation'])
            ->whereNull('checked_out_at')
            ->get();

        // 3. Past Night Audits History
        $auditHistory = NightAudit::with('performer')
            ->where('property_id', $property->id)
            ->latest('business_date')
            ->take(10)
            ->get();

        $alreadyAuditedToday = NightAudit::where('property_id', $property->id)
            ->whereDate('business_date', $currentDate->toDateString())
            ->exists();

        return Inertia::render('NightAudit/Index', [
            'businessDate' => $currentDate->toDateString(),
            'pendingDepartures' => $pendingDepartures,
            'inHouseStays' => $inHouseStays,
            'auditHistory' => $auditHistory,
            'alreadyAuditedToday' => $alreadyAuditedToday,
        ]);
    }

    public function runAudit(Request $request): RedirectResponse
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();
        $bDateRecord = BusinessDate::where('property_id', $property->id)->first();
        $currentDate = $bDateRecord ? Carbon::parse($bDateRecord->current_business_date) : Carbon::today();

        DB::transaction(function () use ($property, $currentDate, $user, $bDateRecord) {
            // In-house stays
            $inHouseStays = Stay::with(['reservationRoom.reservation', 'room'])->whereNull('checked_out_at')->get();

            $totalRoomRevenue = 0;

            foreach ($inHouseStays as $stay) {
                $resRoom = $stay->reservationRoom;
                if (! $resRoom) {
                    continue;
                }

                $rateMinor = $resRoom->rate_price_minor;
                $taxMinor = (int) ($rateMinor * 0.18 / 1.18);
                $idempotencyKey = "audit_{$stay->id}_{$currentDate->toDateString()}_room";

                // Ensure folio exists
                $folio = Folio::where('stay_id', $stay->id)->first()
                    ?? Folio::where('reservation_id', $stay->reservationRoom->reservation_id)->first();

                if ($folio) {
                    // Check if already posted for this date & stay
                    $alreadyPosted = FolioLine::where('folio_id', $folio->id)
                        ->where('idempotency_key', $idempotencyKey)
                        ->exists();

                    if (! $alreadyPosted) {
                        FolioLine::create([
                            'tenant_id' => $user->tenant_id,
                            'folio_id' => $folio->id,
                            'business_date' => $currentDate->toDateString(),
                            'line_type' => 'room',
                            'description' => "Night Audit Room Charge - Room {$stay->room->room_number}",
                            'amount_minor' => $rateMinor,
                            'tax_minor' => $taxMinor,
                            'idempotency_key' => $idempotencyKey,
                            'posted_by' => $user->id,
                        ]);

                        $folio->recalculateBalance();
                        $totalRoomRevenue += $rateMinor;
                    }
                }
            }

            // Calculate total payments collected today
            $totalPayments = Payment::where('property_id', $property->id)
                ->whereDate('business_date', $currentDate->toDateString())
                ->where('status', 'confirmed')
                ->sum('amount_minor');

            $occupiedCount = $inHouseStays->count();
            $availableCount = Room::where('is_active', true)->whereNotIn('status_hk', ['out_of_order', 'out_of_service'])->count();

            // Record Night Audit summary
            NightAudit::updateOrCreate(
                [
                    'tenant_id' => $user->tenant_id,
                    'property_id' => $property->id,
                    'business_date' => $currentDate->toDateString(),
                ],
                [
                    'status' => 'completed',
                    'rooms_occupied' => $occupiedCount,
                    'rooms_available' => $availableCount,
                    'total_room_revenue_minor' => $totalRoomRevenue,
                    'total_payments_collected_minor' => $totalPayments,
                    'performed_by' => $user->id,
                    'audit_summary' => [
                        'posted_rooms_count' => $occupiedCount,
                        'run_time' => now()->toDateTimeString(),
                    ],
                ]
            );

            // Advance Business Date to D+1
            $nextDate = $currentDate->copy()->addDay();
            if ($bDateRecord) {
                $bDateRecord->update([
                    'current_business_date' => $nextDate->toDateString(),
                    'status' => 'open',
                ]);
            }
        });

        return redirect()->route('night-audit.index')->with('success', 'Night Audit completed successfully! Business date has advanced.');
    }
}
