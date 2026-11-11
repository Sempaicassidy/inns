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
            ?? ($propertyId ? Property::find($propertyId)?->tenant_id : null);

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

        $body = "*{$hotelName}*\n"
            ."Hello {$guest->full_name},\n\n"
            ."Your room reservation is confirmed!\n"
            ."*Booking Ref:* #{$reservation->code}\n"
            ."*Check-in:* {$checkIn} (14:00)\n"
            ."*Check-out:* {$checkOut} (11:00)\n\n"
            .'We look forward to welcoming you. Reply here if you need airport transfer or assistance!';

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

        $body = "*Welcome to {$hotelName}*\n\n"
            ."Hello {$guest?->full_name},\n"
            ."Your check-in for *Room {$room?->room_number}* is complete.\n\n"
            ."*Wi-Fi Network:* {$wifiSsid}\n"
            ."*Password:* {$wifiPassword}\n"
            ."*Breakfast Hours:* 06:30 - 10:30 AM (Main Restaurant)\n"
            ."*Reception / Room Service:* Dial 0 or reply here.\n\n"
            .'Enjoy your stay!';

        return $this->sendMessage(
            $guest?->phone ?? '+255712000000',
            $guest?->full_name ?? 'Guest',
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

        $body = "*{$hotelName} - Official Receipt*\n\n"
            ."Hello {$guest?->full_name},\n"
            ."Thank you for staying with us.\n"
            ."*Folio Ref:* #{$folio->folio_number}\n"
            ."*Total Amount:* {$currency} {$total}\n"
            ."Payment Status: *Settled*\n\n"
            .'We wish you safe travels and look forward to welcoming you back soon!';

        return $this->sendMessage(
            $guest?->phone ?? '+255712000000',
            $guest?->full_name ?? 'Guest',
            'folio_invoice',
            $body,
            'hotel_folio_receipt',
            $property?->id
        );
    }
}
