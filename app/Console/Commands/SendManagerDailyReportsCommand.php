<?php

namespace App\Console\Commands;

use App\Models\ManagerNotificationSetting;
use App\Services\ManagerNotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendManagerDailyReportsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inns:send-manager-daily-reports {--force : Force sending report regardless of scheduled time} {--tenant= : Specific Tenant UUID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automated dispatch of daily summary reports (Rooms, Restaurant, Grocery, Revenue) to Hotel Managers via SMS, WhatsApp, and Email at their scheduled time';

    /**
     * Execute the console command.
     */
    public function handle(ManagerNotificationService $notificationService): int
    {
        $force = (bool) $this->option('force');
        $tenantId = $this->option('tenant');

        $now = Carbon::now();
        $currentTime = $now->format('H:i');
        $todayDate = $now->toDateString();

        $this->info("Checking manager notification schedules at {$currentTime} ({$todayDate})...");

        $query = ManagerNotificationSetting::where('is_active', true)
            ->where('notify_daily_report', true);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $settings = $query->get();

        if ($settings->isEmpty()) {
            $this->comment('No active manager notification settings found.');
            return Command::SUCCESS;
        }

        $sentCount = 0;

        foreach ($settings as $setting) {
            // Check if current time matches scheduled report_time or if force is true
            // Also ensure we haven't already dispatched today's report
            $scheduledTime = trim($setting->report_time ?: '12:30');
            $alreadySentToday = $setting->last_daily_report_date === $todayDate;

            $shouldSend = $force || ($currentTime === $scheduledTime && ! $alreadySentToday);

            // Allow +/- 2 minutes window if cron runs every few minutes
            if (! $shouldSend && ! $alreadySentToday && ! $force) {
                try {
                    $schedTimeObj = Carbon::createFromFormat('H:i', $scheduledTime);
                    $currentTimeObj = Carbon::createFromFormat('H:i', $currentTime);
                    if (abs($currentTimeObj->diffInMinutes($schedTimeObj, false)) <= 2) {
                        $shouldSend = true;
                    }
                } catch (\Throwable $e) {
                }
            }

            if ($shouldSend) {
                $this->info("Sending daily summary report to Manager [{$setting->manager_name}] (Scheduled: {$scheduledTime}, Current: {$currentTime})...");
                
                $res = $notificationService->sendDailySummaryReport($setting, isTest: false);

                $channels = [];
                if ($res['whatsapp']) $channels[] = 'WhatsApp';
                if ($res['sms']) $channels[] = 'SMS';
                if ($res['email']) $channels[] = 'Email';

                $channelStr = ! empty($channels) ? implode(', ', $channels) : 'None';
                $this->info("Dispatched to [{$setting->manager_name}] via: {$channelStr}");

                if (! empty($res['errors'])) {
                    $this->warn("Noted warnings: " . implode('; ', $res['errors']));
                }

                $sentCount++;
            }
        }

        $this->info("Total reports dispatched: {$sentCount}");

        return Command::SUCCESS;
    }
}

