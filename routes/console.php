<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Automated Scheduled Manager Daily Summary Report (Checked every minute against manager set time e.g. 12:30)
Schedule::command('inns:send-manager-daily-reports')->everyMinute();
