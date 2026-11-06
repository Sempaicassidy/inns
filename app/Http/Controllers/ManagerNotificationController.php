<?php

namespace App\Http\Controllers;

use App\Models\ManagerNotificationSetting;
use App\Models\Property;
use App\Models\Reservation;
use App\Services\ManagerNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ManagerNotificationController extends Controller
{
    public function __construct(
        protected ManagerNotificationService $notificationService
    ) {}

    /**
     * Show manager notification settings & live test panel
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $property = $user->property ?? Property::where('tenant_id', $user->tenant_id)->first();

        $setting = $this->notificationService->getSettings($user->tenant_id, $property?->id);
        $previewData = $this->notificationService->aggregateDailyReportData($user->tenant_id, $property?->id);

        return Inertia::render('Reports/ManagerNotifications', [
            'setting' => $setting,
            'previewData' => $previewData,
            'property' => $property,
        ]);
    }

    /**
     * Save or update manager notification settings
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'manager_name' => 'required|string|max:100',
            'phone_number' => 'nullable|string|max:255',
            'additional_phones' => 'nullable',
            'email' => 'nullable|string|max:255',
            'additional_emails' => 'nullable',
            'recipients' => 'nullable|array',
            'report_time' => ['required', 'string', 'regex:/^(?:2[0-3]|[01][0-9]):[0-5][0-9]$/'],
            'send_via_sms' => 'boolean',
            'send_via_whatsapp' => 'boolean',
            'send_via_email' => 'boolean',
            'notify_on_reservation' => 'boolean',
            'notify_daily_report' => 'boolean',
            'is_active' => 'boolean',
        ], [
            'report_time.regex' => 'Report time must be formatted as 24-hour HH:MM (e.g. 12:30 or 06:30)',
        ]);

        $user = $request->user();
        $property = $user->property ?? Property::where('tenant_id', $user->tenant_id)->first();

        $setting = $this->notificationService->getSettings($user->tenant_id, $property?->id);
        $setting->update($validated);

        $phonesCount = count($setting->getAllPhoneNumbers());
        $emailsCount = count($setting->getAllEmails());

        return redirect()->back()->with('success', "Manager notification recipients updated! Dispatches will reach {$phonesCount} phone number(s) (SMS/WhatsApp) and {$emailsCount} email address(es).");
    }

    /**
     * Send instant test daily summary report
     */
    public function sendTestReport(Request $request): RedirectResponse
    {
        $user = $request->user();
        $property = $user->property ?? Property::where('tenant_id', $user->tenant_id)->first();

        $setting = $this->notificationService->getSettings($user->tenant_id, $property?->id);

        if (empty($setting->getAllPhoneNumbers()) && empty($setting->getAllEmails())) {
            return redirect()->back()->with('error', 'Please configure at least one valid Phone Number or Email address before dispatching a test.');
        }

        $res = $this->notificationService->sendDailySummaryReport($setting, isTest: true);

        $channels = [];
        if ($res['whatsapp']) $channels[] = 'WhatsApp';
        if ($res['sms']) $channels[] = 'SMS';
        if ($res['email']) $channels[] = 'Email';

        if (! empty($channels)) {
            $msg = 'Test daily executive flash report dispatched successfully via: ' . implode(', ', $channels) . '.';
            return redirect()->back()->with('success', $msg);
        }

        $errMsg = ! empty($res['errors']) ? implode(', ', $res['errors']) : 'No active delivery channel succeeded. Please verify gateway credentials.';
        return redirect()->back()->with('error', 'Test dispatch failed: ' . $errMsg);
    }

    /**
     * Send instant test room reservation alert
     */
    public function sendTestReservationAlert(Request $request): RedirectResponse
    {
        $user = $request->user();
        $property = $user->property ?? Property::where('tenant_id', $user->tenant_id)->first();

        $setting = $this->notificationService->getSettings($user->tenant_id, $property?->id);

        if (empty($setting->getAllPhoneNumbers()) && empty($setting->getAllEmails())) {
            return redirect()->back()->with('error', 'Please configure at least one valid Phone Number or Email address before dispatching a test.');
        }

        // Fetch latest reservation or mock one
        $latestRes = Reservation::where('tenant_id', $user->tenant_id)->latest()->first();

        if ($latestRes) {
            $res = $this->notificationService->notifyReservationCreated($latestRes);
        } else {
            return redirect()->back()->with('error', 'No existing reservation records found in this property to simulate.');
        }

        $channels = [];
        if ($res['whatsapp']) $channels[] = 'WhatsApp';
        if ($res['sms']) $channels[] = 'SMS';
        if ($res['email']) $channels[] = 'Email';

        if (! empty($channels)) {
            return redirect()->back()->with('success', 'Test room reservation alert dispatched successfully via: ' . implode(', ', $channels) . '!');
        }

        return redirect()->back()->with('error', 'Test dispatch failed. Please verify recipient phone or email.');
    }
}
