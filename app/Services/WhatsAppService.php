<?php

namespace App\Services;

use App\Models\Folio;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Stay;
use App\Models\Tenant;
use App\Models\WhatsAppLog;
use App\Models\WhatsAppSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    /**
     * Send a raw or templated WhatsApp message
     */
    public function sendMessage(
        string $recipientPhone,
        string $recipientName,
        string $messageType,
        string $messageBody,
        ?string $templateName = null,
        ?string $propertyId = null,
        ?string $tenantId = null
    ): WhatsAppLog {
        // Normalize phone number (strip whitespace, ensure international format)
        $cleanPhone = preg_replace('/[^0-9]/', '', $recipientPhone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '255'.substr($cleanPhone, 1);
        }

        $tenantId = $tenantId
            ?? auth()->user()?->tenant_id
            ?? ($propertyId ? Property::find($propertyId)?->tenant_id : null)
            ?? Tenant::first()?->id;

        $setting = WhatsAppSetting::where('tenant_id', $tenantId)
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->first();

        $status = 'sent';
        $externalId = 'wamid.'.uniqid();
        $errorMsg = null;

        // If active Meta Cloud API credentials exist, make HTTP request
        if ($setting && $setting->is_active && $setting->phone_number_id && $setting->access_token) {
            try {
                $endpoint = "https://graph.facebook.com/v19.0/{$setting->phone_number_id}/messages";
                $response = Http::withToken($setting->access_token)
                    ->post($endpoint, [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $cleanPhone,
                        'type' => 'text',
                        'text' => [
                            'preview_url' => false,
                            'body' => $messageBody,
                        ],
                    ]);

                if ($response->successful()) {
                    $resData = $response->json();
                    $externalId = $resData['messages'][0]['id'] ?? $externalId;
                    $status = 'delivered';
                } else {
                    $status = 'failed';
                    $errorMsg = $response->body();
                    Log::warning("WhatsApp API Error: {$errorMsg}");
                }
            } catch (\Exception $e) {
                $status = 'failed';
                $errorMsg = $e->getMessage();
            }
        }

        // Always record delivery log for audit trail & transparency
        return WhatsAppLog::create([
            'tenant_id' => $tenantId,
            'property_id' => $propertyId,
            'recipient_phone' => $cleanPhone,
            'recipient_name' => $recipientName,
            'message_type' => $messageType,
            'message_body' => $messageBody,
            'template_name' => $templateName,
            'status' => $status,
            'external_message_id' => $externalId,
            'error_message' => $errorMsg,
        ]);
    }

    /**
     * Send Booking Confirmation to Guest
     */
    public function sendBookingConfirmation(Reservation $reservation): WhatsAppLog
    {
        $guest = $reservation->guest;
        $property = $reservation->property;
        $tenant = $reservation->tenant ?? ($reservation->tenant_id ? Tenant::find($reservation->tenant_id) : $property?->tenant);
        $hotelName = $tenant?->settings['sender_id'] ?? $tenant?->name ?? $property?->name ?? 'THE INNS';
        $currency = $tenant?->settings['currency'] ?? $property?->currency ?? 'TZS';
        $checkIn = $reservation->check_in_date->format('d M Y');
        $checkOut = $reservation->check_out_date->format('d M Y');

        $body = "🏨 *{$hotelName}*\n"
            ."Habari {$guest->full_name},\n\n"
            ."Hifadhi yako ya chumba imethibitishwa kikamilifu!\n"
            ."📌 *Booking Ref:* #{$reservation->code}\n"
            ."📅 *Kuingia (Check-in):* {$checkIn} (14:00)\n"
            ."📅 *Kutoka (Check-out):* {$checkOut} (11:00)\n\n"
            .'Tunakutakia mapumziko mema. Kwa maelezo zaidi au usafiri wa uwanja wa ndege, tuandikie hapa!';

        return $this->sendMessage(
            $guest->phone ?? '+255712000000',
            $guest->full_name,
            'booking_confirmation',
            $body,
            'hotel_booking_confirmed',
            $reservation->property_id
        );
    }

    /**
     * Send Check-in Welcome Note & Wi-Fi details
     */
    public function sendCheckInWelcome(Stay $stay): WhatsAppLog
    {
        $reservation = $stay->reservation;
        $guest = $reservation?->guest;
        $room = $stay->room;
        $property = $room?->property;
        $tenant = $property?->tenant ?? ($reservation?->tenant_id ? Tenant::find($reservation->tenant_id) : null);
        $hotelName = $tenant?->settings['sender_id'] ?? $tenant?->name ?? $property?->name ?? 'THE INNS';
        $wifiSsid = $tenant?->settings['wifi_ssid'] ?? 'THE-INNS-GUEST';
        $wifiPassword = $tenant?->settings['wifi_password'] ?? 'welcome2026';

        $body = "✨ *Karibu Sana {$hotelName}!*\n\n"
            ."Habari {$guest?->full_name},\n"
            ."Umekamilisha usajili kwenye *Chumba {$room?->room_number}*.\n\n"
            ."📶 *Wi-Fi Network:* {$wifiSsid}\n"
            ."🔑 *Password:* {$wifiPassword}\n"
            ."🍳 *Breakfast Time:* 06:30 - 10:30 AM (Main Restaurant)\n"
            ."📞 *Room Service / Reception:* Piga 0 au piga simu hii.\n\n"
            .'Furahia ukaaji wako!';

        return $this->sendMessage(
            $guest?->phone ?? '+255712000000',
            $guest?->full_name ?? 'Mgeni',
            'welcome_checkin',
            $body,
            'hotel_welcome_stay',
            $property?->id
        );
    }

    /**
     * Send Digital Folio & Invoice link upon check-out
     */
    public function sendFolioInvoice(Folio $folio): WhatsAppLog
    {
        $guest = $folio->guest;
        $property = $folio->property;
        $tenant = $property?->tenant ?? ($folio->tenant_id ? Tenant::find($folio->tenant_id) : null);
        $hotelName = $tenant?->settings['sender_id'] ?? $tenant?->name ?? $property?->name ?? 'THE INNS';
        $currency = $tenant?->settings['currency'] ?? $property?->currency ?? 'TZS';
        $total = number_format($folio->balance_minor / 100, 2);

        $body = "🧾 *{$hotelName} - Stakabadhi ya Malipo*\n\n"
            ."Habari {$guest?->full_name},\n"
            ."Asante sana kwa kuchagua kukaa nasi.\n"
            ."📄 *Folio Ref:* #{$folio->folio_number}\n"
            ."💵 *Kiasi Kamili:* {$currency} {$total}\n"
            ."Hali ya Malipo: *Imelipwa (Settled)*\n\n"
            .'Tunakutakia safari njema na tunatarajia kukukaribisha tena hivi karibuni!';

        return $this->sendMessage(
            $guest?->phone ?? '+255712000000',
            $guest?->full_name ?? 'Mgeni',
            'folio_invoice',
            $body,
            'hotel_folio_receipt',
            $property?->id
        );
    }
}
