<?php

namespace App\Http\Controllers;

use App\Models\Guest;
use App\Models\Property;
use App\Models\WhatsAppLog;
use App\Models\WhatsAppSetting;
use App\Services\WhatsAppService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::first();

        $setting = WhatsAppSetting::where('tenant_id', $user->tenant_id)->first();

        $logs = WhatsAppLog::where('tenant_id', $user->tenant_id)
            ->latest()
            ->take(30)
            ->get();

        $recentGuests = Guest::where('tenant_id', $user->tenant_id)
            ->latest()
            ->take(15)
            ->get(['id', 'first_name', 'last_name', 'phone', 'email']);

        $stats = [
            'total_sent' => WhatsAppLog::where('tenant_id', $user->tenant_id)->count(),
            'delivered_count' => WhatsAppLog::where('tenant_id', $user->tenant_id)->whereIn('status', ['delivered', 'sent'])->count(),
            'failed_count' => WhatsAppLog::where('tenant_id', $user->tenant_id)->where('status', 'failed')->count(),
        ];

        return Inertia::render('WhatsApp/Index', [
            'setting' => $setting,
            'logs' => $logs,
            'recentGuests' => $recentGuests,
            'stats' => $stats,
        ]);
    }

    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'phone_number_id' => 'nullable|string|max:100',
            'business_account_id' => 'nullable|string|max:100',
            'access_token' => 'nullable|string',
            'sender_phone_number' => 'nullable|string|max:30',
            'send_on_reservation_confirmed' => 'boolean',
            'send_on_checkin' => 'boolean',
            'send_on_checkout_invoice' => 'boolean',
            'send_on_housekeeping_ready' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::first();

        WhatsAppSetting::updateOrCreate(
            ['tenant_id' => $user->tenant_id],
            array_merge($validated, [
                'property_id' => $property->id,
                'provider' => 'cloud_api',
            ])
        );

        return redirect()->back()->with('success', 'WhatsApp Cloud API settings saved successfully.');
    }

    public function sendManualMessage(Request $request, WhatsAppService $whatsAppService): RedirectResponse
    {
        $validated = $request->validate([
            'recipient_phone' => 'required|string|max:30',
            'recipient_name' => 'nullable|string|max:100',
            'message' => 'nullable|string',
            'message_body' => 'nullable|string',
        ]);

        $messageContent = $validated['message'] ?? $validated['message_body'] ?? 'Hello from THE INNS';
        $recipientName = $validated['recipient_name'] ?? 'Guest';

        $user = $request->user();
        $property = $user->property ?? Property::first();

        $whatsAppService->sendMessage(
            $validated['recipient_phone'],
            $recipientName,
            'custom_message',
            $messageContent,
            null,
            $property?->id,
            $user->tenant_id
        );

        return redirect()->back()->with('success', "WhatsApp message sent to {$recipientName}.");
    }
}
