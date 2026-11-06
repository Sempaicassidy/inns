<?php

namespace App\Services;

use App\Models\FolioLine;
use App\Models\ManagerNotificationSetting;
use App\Models\Payment;
use App\Models\PosOrder;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\Stay;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class ManagerNotificationService
{
    public function __construct(
        protected SwalaSmsService $smsService,
        protected WhatsAppService $whatsAppService
    ) {}

    /**
     * Get or create active settings for a tenant/property
     */
    public function getSettings(string $tenantId, ?string $propertyId = null): ManagerNotificationSetting
    {
        $setting = ManagerNotificationSetting::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where(fn ($sub) => $sub->where('property_id', $propertyId)->orWhereNull('property_id')))
            ->first();

        if (! $setting) {
            $setting = ManagerNotificationSetting::create([
                'tenant_id' => $tenantId,
                'property_id' => $propertyId,
                'manager_name' => 'General Manager',
                'phone_number' => null,
                'email' => null,
                'report_time' => '12:30',
                'send_via_sms' => true,
                'send_via_whatsapp' => true,
                'send_via_email' => true,
                'notify_on_reservation' => true,
                'notify_daily_report' => true,
                'is_active' => true,
            ]);
        }

        return $setting;
    }

    /**
     * Send Real-Time Alert to Manager when a Room is Reserved / Booked
     */
    public function notifyReservationCreated(Reservation $reservation): array
    {
        $results = [
            'sms' => false,
            'whatsapp' => false,
            'email' => false,
            'errors' => [],
        ];

        try {
            $setting = ManagerNotificationSetting::where('tenant_id', $reservation->tenant_id)
                ->where('is_active', true)
                ->where('notify_on_reservation', true)
                ->first();

            if (! $setting) {
                return $results;
            }

            $property = $reservation->property ?? Property::find($reservation->property_id);
            $propertyName = $property?->name ?? 'Hotel Property';

            $tenant = $reservation->tenant ?? ($reservation->tenant_id ? Tenant::find($reservation->tenant_id) : null);
            $brandName = $tenant?->settings['sender_id'] ?? $tenant?->settings['system_name'] ?? $tenant?->name ?? $propertyName;
            $systemName = $tenant?->settings['system_name'] ?? $tenant?->name ?? 'THE INNS';

            // Gather reservation details
            $guest = $reservation->guest;
            $guestName = $guest ? trim(($guest->first_name ?? '').' '.($guest->last_name ?? '')) : 'Guest';
            $guestPhone = $guest?->phone ?? 'N/A';

            $firstRoom = $reservation->reservationRooms()->with(['room', 'roomType'])->first();
            $roomNumber = $firstRoom?->room?->room_number ?? 'Auto-Assigned';
            $roomTypeName = $firstRoom?->roomType?->name ?? 'Standard Room';

            $checkIn = Carbon::parse($reservation->check_in)->format('d/m/Y');
            $checkOut = Carbon::parse($reservation->check_out)->format('d/m/Y');
            $nights = max(1, Carbon::parse($reservation->check_in)->diffInDays(Carbon::parse($reservation->check_out)));

            $totalAmount = number_format(($reservation->total_minor ?? 0) / 100);
            $depositAmount = number_format(($reservation->deposit_minor ?? 0) / 100);
            $receptionist = $reservation->receptionist_name ?? 'Staff';

            // 1. WhatsApp Message (Formatted with emojis in English)
            $waMessage = "🏨 *{$brandName} - NEW RESERVATION ALERT*\n"
                ."━━━━━━━━━━━━━━━━━━━━\n"
                ."📍 *Property:* {$propertyName}\n"
                ."👤 *Guest:* {$guestName} ({$guestPhone})\n"
                ."🚪 *Room:* Room #{$roomNumber} ({$roomTypeName})\n"
                ."📅 *Schedule:* {$checkIn} ➔ {$checkOut} ({$nights} Night" . ($nights > 1 ? 's' : '') . ")\n"
                ."👥 *Occupancy:* {$reservation->adults} Adult" . ($reservation->adults > 1 ? 's' : '') . ($reservation->children > 0 ? ", {$reservation->children} Child" . ($reservation->children > 1 ? 'ren' : '') : "") . "\n"
                ."💰 *Total Rate:* TZS {$totalAmount}\n"
                ."💵 *Advance Deposit:* TZS {$depositAmount}\n"
                ."💳 *Payment Method:* " . strtoupper($reservation->payment_method ?? 'Cash') . "\n"
                ."🔖 *Reference No:* {$reservation->ref_no}\n"
                ."👨‍💼 *Front Desk Agent:* {$receptionist}\n"
                ."━━━━━━━━━━━━━━━━━━━━\n"
                ."_Automated Notification recorded by {$systemName}._";

            // 2. SMS Message (Compact English plain text)
            $smsMessage = "{$brandName} Alert: New Booking {$propertyName}!\n"
                ."Guest: {$guestName}\n"
                ."Room: #{$roomNumber} ({$roomTypeName})\n"
                ."Dates: {$checkIn}-{$checkOut} ({$nights}N)\n"
                ."Total: TZS {$totalAmount} (Dep: TZS {$depositAmount})\n"
                ."Ref: {$reservation->ref_no}";

            // 3. Email Content (HTML in English)
            $emailSubject = "🏨 [{$brandName}] New Booking: Room #{$roomNumber} - {$guestName} ({$propertyName})";
            $emailHtml = $this->buildReservationEmailHtml([
                'brandName' => $brandName,
                'systemName' => $systemName,
                'propertyName' => $propertyName,
                'guestName' => $guestName,
                'guestPhone' => $guestPhone,
                'roomNumber' => $roomNumber,
                'roomTypeName' => $roomTypeName,
                'checkIn' => $checkIn,
                'checkOut' => $checkOut,
                'nights' => $nights,
                'adults' => $reservation->adults,
                'children' => $reservation->children ?? 0,
                'totalAmount' => $totalAmount,
                'depositAmount' => $depositAmount,
                'paymentMethod' => strtoupper($reservation->payment_method ?? 'Cash'),
                'refNo' => $reservation->ref_no,
                'receptionist' => $receptionist,
                'status' => $reservation->status,
            ]);

            // Resolve all configured phone numbers and email addresses
            $allPhones = $setting->getAllPhoneNumbers();
            $allEmails = $setting->getAllEmails();

            // Dispatch via WhatsApp to all configured phones
            if ($setting->send_via_whatsapp && ! empty($allPhones)) {
                foreach ($allPhones as $phone) {
                    try {
                        $this->whatsAppService->sendMessage(
                            recipientPhone: $phone,
                            recipientName: $setting->manager_name ?: 'General Manager',
                            messageType: 'manager_reservation_alert',
                            messageBody: $waMessage,
                            propertyId: $property?->id,
                            tenantId: $reservation->tenant_id
                        );
                        $results['whatsapp'] = true;
                    } catch (Throwable $e) {
                        $results['errors'][] = "WhatsApp ($phone): " . $e->getMessage();
                        Log::error("Failed to send manager WhatsApp reservation alert to {$phone}: " . $e->getMessage());
                    }
                }
            }

            // Dispatch via SMS to all configured phones
            if ($setting->send_via_sms && ! empty($allPhones)) {
                foreach ($allPhones as $phone) {
                    try {
                        $smsRes = $this->smsService->sendSms($phone, $smsMessage);
                        if ($smsRes['success'] ?? true) {
                            $results['sms'] = true;
                        }
                    } catch (Throwable $e) {
                        $results['errors'][] = "SMS ($phone): " . $e->getMessage();
                        Log::error("Failed to send manager SMS reservation alert to {$phone}: " . $e->getMessage());
                    }
                }
            }

            // Dispatch via Email to all configured emails
            if ($setting->send_via_email && ! empty($allEmails)) {
                try {
                    Mail::html($emailHtml, function ($message) use ($allEmails, $setting, $emailSubject) {
                        $message->to($allEmails)
                            ->subject($emailSubject);
                    });
                    $results['email'] = true;
                } catch (Throwable $e) {
                    $results['errors'][] = 'Email: ' . $e->getMessage();
                    Log::error('Failed to send manager email reservation alert: ' . $e->getMessage());
                }
            }
        } catch (Throwable $e) {
            $results['errors'][] = 'General: ' . $e->getMessage();
            Log::error('Error in notifyReservationCreated: ' . $e->getMessage());
        }

        return $results;
    }

    /**
     * Aggregate Live Daily Performance Data for Morning / Scheduled Daily Report
     */
    public function aggregateDailyReportData(string $tenantId, ?string $propertyId = null, ?Carbon $targetDate = null): array
    {
        $date = $targetDate ?? Carbon::today();
        $dateString = $date->toDateString();
        $nowFormatted = Carbon::now()->format('d/m/Y H:i');

        $property = $propertyId ? Property::find($propertyId) : Property::where('tenant_id', $tenantId)->first();
        $propertyName = $property?->name ?? 'THE INNS Property';

        // 1. Rooms Occupancy Statistics
        $roomsQuery = Room::where('tenant_id', $tenantId);
        if ($propertyId) {
            $roomsQuery->where('property_id', $propertyId);
        }
        $totalRooms = $roomsQuery->count();
        $occupiedRooms = (clone $roomsQuery)->where('status_occupancy', 'occupied')->count();
        $availableRooms = (clone $roomsQuery)->where('status_occupancy', 'vacant')->where('status_hk', 'clean')->count();
        $dirtyRooms = (clone $roomsQuery)->where('status_hk', 'dirty')->count();
        $maintenanceRooms = (clone $roomsQuery)->where('status_occupancy', 'maintenance')->count();

        $occupancyRate = $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0;

        // In-House & Reservations for today
        $reservationsToday = Reservation::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->whereDate('created_at', $dateString)
            ->count();

        $arrivalsExpected = Reservation::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->whereDate('check_in', $dateString)
            ->count();

        $departuresExpected = Reservation::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->whereDate('check_out', $dateString)
            ->count();

        // 2. Financial Collections - Room Accommodation Today
        $roomPaymentsTodayMinor = (int) Payment::where('tenant_id', $tenantId)
            ->whereDate('created_at', $dateString)
            ->where('status', 'confirmed')
            ->sum('amount_minor');

        // 3. Restaurant POS Sales Today
        $restaurantOrdersToday = PosOrder::where('tenant_id', $tenantId)
            ->where('outlet_type', 'restaurant')
            ->whereDate('created_at', $dateString);

        $restaurantOrdersCount = (clone $restaurantOrdersToday)->count();
        $restaurantRevenueMinor = (int) (clone $restaurantOrdersToday)
            ->whereIn('payment_status', ['paid', 'posted_to_room'])
            ->sum('total_minor');

        // 4. Grocery Minimart POS Sales Today
        $groceryOrdersToday = PosOrder::where('tenant_id', $tenantId)
            ->where('outlet_type', 'grocery')
            ->whereDate('created_at', $dateString);

        $groceryOrdersCount = (clone $groceryOrdersToday)->count();
        $groceryRevenueMinor = (int) (clone $groceryOrdersToday)
            ->whereIn('payment_status', ['paid', 'posted_to_room'])
            ->sum('total_minor');

        // 5. Total Daily Revenue (Rooms + Restaurant + Grocery)
        $totalDailyGrossRevenueMinor = $roomPaymentsTodayMinor + $restaurantRevenueMinor + $groceryRevenueMinor;

        // Payment Methods Breakdown for today
        $paymentsByMethod = Payment::where('tenant_id', $tenantId)
            ->whereDate('created_at', $dateString)
            ->where('status', 'confirmed')
            ->selectRaw('payment_method, sum(amount_minor) as total_amount')
            ->groupBy('payment_method')
            ->pluck('total_amount', 'payment_method')
            ->toArray();

        return [
            'tenantId' => $tenantId,
            'propertyId' => $propertyId,
            'propertyName' => $propertyName,
            'reportDate' => $date->format('d/m/Y'),
            'generatedAt' => $nowFormatted,
            'rooms' => [
                'total' => $totalRooms,
                'occupied' => $occupiedRooms,
                'available' => $availableRooms,
                'dirty' => $dirtyRooms,
                'maintenance' => $maintenanceRooms,
                'occupancyRate' => $occupancyRate,
                'reservationsToday' => $reservationsToday,
                'arrivalsExpected' => $arrivalsExpected,
                'departuresExpected' => $departuresExpected,
            ],
            'restaurant' => [
                'ordersCount' => $restaurantOrdersCount,
                'revenueMinor' => $restaurantRevenueMinor,
                'revenueFormatted' => number_format($restaurantRevenueMinor / 100),
            ],
            'grocery' => [
                'ordersCount' => $groceryOrdersCount,
                'revenueMinor' => $groceryRevenueMinor,
                'revenueFormatted' => number_format($groceryRevenueMinor / 100),
            ],
            'revenue' => [
                'roomMinor' => $roomPaymentsTodayMinor,
                'roomFormatted' => number_format($roomPaymentsTodayMinor / 100),
                'restaurantMinor' => $restaurantRevenueMinor,
                'restaurantFormatted' => number_format($restaurantRevenueMinor / 100),
                'groceryMinor' => $groceryRevenueMinor,
                'groceryFormatted' => number_format($groceryRevenueMinor / 100),
                'totalGrossMinor' => $totalDailyGrossRevenueMinor,
                'totalGrossFormatted' => number_format($totalDailyGrossRevenueMinor / 100),
                'byMethod' => $paymentsByMethod,
            ],
        ];
    }

    /**
     * Send Morning / Scheduled Daily Report to Manager via SMS, WhatsApp, and Email
     */
    public function sendDailySummaryReport(ManagerNotificationSetting $setting, bool $isTest = false): array
    {
        $results = [
            'sms' => false,
            'whatsapp' => false,
            'email' => false,
            'errors' => [],
        ];

        try {
            $data = $this->aggregateDailyReportData($setting->tenant_id, $setting->property_id);
            $propName = $data['propertyName'];
            $repDate = $data['reportDate'];
            $genTime = $data['generatedAt'];

            $tenant = Tenant::find($setting->tenant_id);
            $brandName = $tenant?->settings['sender_id'] ?? $tenant?->settings['system_name'] ?? $tenant?->name ?? $propName;
            $systemName = $tenant?->settings['system_name'] ?? $tenant?->name ?? 'THE INNS';

            $testPrefix = $isTest ? "🧪 [TEST REPORT DISPATCH]\n" : "";

            // --- 1. WHATSAPP FORMATTED MESSAGE (English) ---
            $waMessage = "{$testPrefix}🌅 *{$brandName} - DAILY EXECUTIVE FLASH REPORT*\n"
                ."━━━━━━━━━━━━━━━━━━━━\n"
                ."🏨 *Property:* {$propName}\n"
                ."📅 *Date:* {$repDate} ({$genTime})\n"
                ."👤 *Manager:* {$setting->manager_name}\n"
                ."━━━━━━━━━━━━━━━━━━━━\n"
                ."🛏️ *ROOMS & OCCUPANCY:*\n"
                ." • Total Rooms: *{$data['rooms']['total']}*\n"
                ." • Occupied: *{$data['rooms']['occupied']}* ({$data['rooms']['occupancyRate']}% Occupancy)\n"
                ." • Available & Clean: *{$data['rooms']['available']}*\n"
                ." • Dirty / In Turnover: *{$data['rooms']['dirty']}*\n"
                ." • Bookings Created Today: *{$data['rooms']['reservationsToday']}*\n"
                ." • Expected Arrivals: *{$data['rooms']['arrivalsExpected']}* | Departures: *{$data['rooms']['departuresExpected']}*\n\n"
                ."🍽️ *RESTAURANT & BAR POS:*\n"
                ." • Total Orders: *{$data['restaurant']['ordersCount']}*\n"
                ." • Net Sales: *TZS {$data['restaurant']['revenueFormatted']}*\n\n"
                ."🛒 *GROCERY MINIMART POS:*\n"
                ." • Total Transactions: *{$data['grocery']['ordersCount']}*\n"
                ." • Net Sales: *TZS {$data['grocery']['revenueFormatted']}*\n\n"
                ."💰 *DAILY REVENUE COLLECTIONS:*\n"
                ." • Room Payments: TZS {$data['revenue']['roomFormatted']}\n"
                ." • Restaurant Sales: TZS {$data['revenue']['restaurantFormatted']}\n"
                ." • Grocery Sales: TZS {$data['revenue']['groceryFormatted']}\n"
                ." • *TOTAL GROSS REVENUE: TZS {$data['revenue']['totalGrossFormatted']}*\n"
                ."━━━━━━━━━━━━━━━━━━━━\n"
                ."_Automated Scheduled Executive Report by {$systemName}._";

            // --- 2. SMS COMPACT FORMAT (English) ---
            $smsMessage = "{$testPrefix}{$brandName} Daily Report ({$repDate}) - {$propName}:\n"
                ."Rooms: {$data['rooms']['occupied']}/{$data['rooms']['total']} Occ ({$data['rooms']['occupancyRate']}%)\n"
                ."Restaurant: TZS {$data['restaurant']['revenueFormatted']} ({$data['restaurant']['ordersCount']} Orders)\n"
                ."Grocery: TZS {$data['grocery']['revenueFormatted']}\n"
                ."Gross Rev: TZS {$data['revenue']['totalGrossFormatted']}\n"
                ."Time: {$genTime}";

            // --- 3. HTML EMAIL FORMAT (English) ---
            $emailSubject = ($isTest ? "[TEST] " : "") . "🌅 [{$brandName}] Daily Executive Report: {$propName} - {$repDate} (Total: TZS {$data['revenue']['totalGrossFormatted']})";
            $emailHtml = $this->buildDailyReportEmailHtml($data, $setting, $isTest, $brandName, $systemName);

            // Resolve all configured phone numbers and email addresses
            $allPhones = $setting->getAllPhoneNumbers();
            $allEmails = $setting->getAllEmails();

            // Send via WhatsApp to all phones
            if ($setting->send_via_whatsapp && ! empty($allPhones)) {
                foreach ($allPhones as $phone) {
                    try {
                        $this->whatsAppService->sendMessage(
                            recipientPhone: $phone,
                            recipientName: $setting->manager_name ?: 'General Manager',
                            messageType: 'manager_daily_summary_report',
                            messageBody: $waMessage,
                            propertyId: $setting->property_id,
                            tenantId: $setting->tenant_id
                        );
                        $results['whatsapp'] = true;
                    } catch (Throwable $e) {
                        $results['errors'][] = "WhatsApp ($phone): " . $e->getMessage();
                        Log::error("Daily report WhatsApp failed for {$phone}: " . $e->getMessage());
                    }
                }
            }

            // Send via SMS to all phones
            if ($setting->send_via_sms && ! empty($allPhones)) {
                foreach ($allPhones as $phone) {
                    try {
                        $smsRes = $this->smsService->sendSms($phone, $smsMessage);
                        if ($smsRes['success'] ?? true) {
                            $results['sms'] = true;
                        }
                    } catch (Throwable $e) {
                        $results['errors'][] = "SMS ($phone): " . $e->getMessage();
                        Log::error("Daily report SMS failed for {$phone}: " . $e->getMessage());
                    }
                }
            }

            // Send via Email to all emails
            if ($setting->send_via_email && ! empty($allEmails)) {
                try {
                    Mail::html($emailHtml, function ($message) use ($allEmails, $setting, $emailSubject) {
                        $message->to($allEmails)
                            ->subject($emailSubject);
                    });
                    $results['email'] = true;
                } catch (Throwable $e) {
                    $results['errors'][] = 'Email: ' . $e->getMessage();
                    Log::error('Daily report Email failed: ' . $e->getMessage());
                }
            }

            // Update timestamp only if it is real automated delivery
            if (! $isTest) {
                $setting->update([
                    'last_daily_report_sent_at' => now(),
                    'last_daily_report_date' => now()->toDateString(),
                ]);
            }
        } catch (Throwable $e) {
            $results['errors'][] = 'General: ' . $e->getMessage();
            Log::error('Error in sendDailySummaryReport: ' . $e->getMessage());
        }

        return $results;
    }

    /**
     * Build High Quality HTML Email for Reservation Alert (English)
     */
    protected function buildReservationEmailHtml(array $p): string
    {
        $brand = htmlspecialchars($p['brandName'] ?? 'Hotel Property');
        $system = htmlspecialchars($p['systemName'] ?? 'THE INNS');

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{$brand} - New Booking Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border-top: 5px solid #D4AF37;">
        
        <!-- Header -->
        <div style="background-color: #1E3A5F; padding: 24px; text-align: center; color: #ffffff;">
            <div style="font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #D4AF37;">{$brand}</div>
            <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">{$p['propertyName']} • {$system}</div>
            <h1 style="font-size: 20px; font-weight: 800; margin: 16px 0 4px 0; color: #ffffff;">New Reservation Alert</h1>
            <p style="font-size: 12px; color: #cbd5e1; margin: 0;">Ref: <strong>{$p['refNo']}</strong> | Status: <strong>{$p['status']}</strong></p>
        </div>

        <!-- Body -->
        <div style="padding: 24px;">
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #16a34a;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1e3a5f;">👤 Guest Information</h3>
                <table style="width: 100%; font-size: 13px; line-height: 1.6;">
                    <tr><td style="color: #64748b; width: 40%;">Full Name:</td><td><strong>{$p['guestName']}</strong></td></tr>
                    <tr><td style="color: #64748b;">Phone:</td><td>{$p['guestPhone']}</td></tr>
                    <tr><td style="color: #64748b;">Party Size:</td><td>{$p['adults']} Adult(s), {$p['children']} Child(ren)</td></tr>
                </table>
            </div>

            <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #D4AF37;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; color: #1e3a5f;">🚪 Room & Itinerary</h3>
                <table style="width: 100%; font-size: 13px; line-height: 1.6;">
                    <tr><td style="color: #64748b; width: 40%;">Assigned Room:</td><td><strong style="color: #1E3A5F; font-size: 14px;">Room #{$p['roomNumber']}</strong> ({$p['roomTypeName']})</td></tr>
                    <tr><td style="color: #64748b;">Check-in Date:</td><td>{$p['checkIn']}</td></tr>
                    <tr><td style="color: #64748b;">Check-out Date:</td><td>{$p['checkOut']}</td></tr>
                    <tr><td style="color: #64748b;">Duration of Stay:</td><td><strong>{$p['nights']} Night(s)</strong></td></tr>
                    <tr><td style="color: #64748b;">Booked By:</td><td>{$p['receptionist']}</td></tr>
                </table>
            </div>

            <!-- Financial Summary Box -->
            <div style="background: linear-gradient(135deg, #1E3A5F, #0f172a); border-radius: 12px; padding: 18px; color: #ffffff; text-align: center;">
                <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Total Accommodation Charges</div>
                <div style="font-size: 26px; font-weight: 800; color: #D4AF37; margin: 6px 0;">TZS {$p['totalAmount']}</div>
                <div style="font-size: 12px; color: #e2e8f0;">Advance Deposit Received: <strong style="color: #4ade80;">TZS {$p['depositAmount']}</strong> ({$p['paymentMethod']})</div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            {$brand} • Managed via {$system}
        </div>
    </div>
</body>
</html>
HTML;
    }

    /**
     * Build High Quality HTML Email for Daily Morning/Scheduled Report (English)
     */
    protected function buildDailyReportEmailHtml(array $data, ManagerNotificationSetting $setting, bool $isTest, string $brandName = 'Hotel Property', string $systemName = 'THE INNS'): string
    {
        $testBanner = $isTest ? '<div style="background: #fef08a; color: #854d0e; padding: 10px; font-weight: bold; text-align: center; font-size: 12px;">⚠️ THIS IS A TEST DISPATCH</div>' : '';
        $brand = htmlspecialchars($brandName);
        $system = htmlspecialchars($systemName);

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{$brand} - Daily Summary Executive Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 25px rgba(0,0,0,0.07); border-top: 5px solid #D4AF37;">
        {$testBanner}
        
        <!-- Header -->
        <div style="background-color: #1E3A5F; padding: 26px; text-align: center; color: #ffffff;">
            <div style="font-size: 24px; font-weight: 900; letter-spacing: 1px; color: #D4AF37;">{$brand}</div>
            <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">{$data['propertyName']} • {$system}</div>
            <h1 style="font-size: 22px; font-weight: 800; margin: 16px 0 4px 0; color: #ffffff;">Daily Executive Flash Report</h1>
            <p style="font-size: 12px; color: #cbd5e1; margin: 0;">Date: <strong>{$data['reportDate']}</strong> | Generated At: <strong>{$data['generatedAt']}</strong></p>
        </div>

        <div style="padding: 24px;">
            <p style="font-size: 13px; color: #475569; margin-top: 0;">Hello <strong>{$setting->manager_name}</strong>, here is the executive operational summary for your property:</p>

            <!-- KPI Cards Grid -->
            <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 20px;">
                <tr>
                    <td style="width: 33.3%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Occupancy</div>
                        <div style="font-size: 22px; font-weight: 900; color: #1E3A5F; margin: 4px 0;">{$data['rooms']['occupancyRate']}%</div>
                        <div style="font-size: 11px; color: #16a34a; font-weight: 600;">{$data['rooms']['occupied']} / {$data['rooms']['total']} Rooms</div>
                    </td>
                    <td style="width: 33.3%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Restaurant POS</div>
                        <div style="font-size: 18px; font-weight: 900; color: #1E3A5F; margin: 4px 0;">TZS {$data['restaurant']['revenueFormatted']}</div>
                        <div style="font-size: 11px; color: #64748b;">{$data['restaurant']['ordersCount']} Orders Today</div>
                    </td>
                    <td style="width: 33.3%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; text-align: center;">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Grocery Minimart</div>
                        <div style="font-size: 18px; font-weight: 900; color: #1E3A5F; margin: 4px 0;">TZS {$data['grocery']['revenueFormatted']}</div>
                        <div style="font-size: 11px; color: #64748b;">{$data['grocery']['ordersCount']} Sales Today</div>
                    </td>
                </tr>
            </table>

            <!-- Total Revenue Banner -->
            <div style="background: linear-gradient(135deg, #1E3A5F, #0f172a); border-radius: 14px; padding: 20px; color: #ffffff; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(30,58,95,0.2);">
                <div style="font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total Gross Revenue Collections To Date</div>
                <div style="font-size: 30px; font-weight: 900; color: #D4AF37; margin: 6px 0;">TZS {$data['revenue']['totalGrossFormatted']}</div>
                <div style="font-size: 12px; color: #cbd5e1;">Rooms: TZS {$data['revenue']['roomFormatted']} • Restaurant: TZS {$data['revenue']['restaurantFormatted']} • Grocery: TZS {$data['revenue']['groceryFormatted']}</div>
            </div>

            <!-- Detailed Breakdown -->
            <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #1e3a5f;">📋 Departmental Performance Breakdown</h3>
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Available Rooms (Clean & Ready):</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #16a34a;">{$data['rooms']['available']}</td></tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Rooms in Turnover (Dirty):</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #d97706;">{$data['rooms']['dirty']}</td></tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Expected Arrivals Today:</td><td style="padding: 8px 0; text-align: right; font-weight: 700;">{$data['rooms']['arrivalsExpected']}</td></tr>
                    <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 8px 0; color: #64748b;">Expected Departures Today:</td><td style="padding: 8px 0; text-align: right; font-weight: 700;">{$data['rooms']['departuresExpected']}</td></tr>
                    <tr><td style="padding: 8px 0; color: #64748b;">New Reservations Booked Today:</td><td style="padding: 8px 0; text-align: right; font-weight: 700; color: #1E3A5F;">{$data['rooms']['reservationsToday']}</td></tr>
                </table>
            </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
            {$brand} • Generated by {$system}
        </div>
    </div>
</body>
</html>
HTML;
    }
}
