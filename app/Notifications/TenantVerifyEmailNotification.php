<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class TenantVerifyEmailNotification extends Notification
{
    use Queueable;

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $hotelName = $notifiable->hotel_name ?? config('app.name', 'Hotel Management');
        $username = $notifiable->username ?? $notifiable->email;
        $phone = $notifiable->phone ?? 'Not specified';

        $verificationUrl = $this->verificationUrl($notifiable);
        $expire = Config::get('auth.verification.expire', 60);

        return (new MailMessage)
            ->subject("[{$hotelName}] Uanzishwaji wa Akaunti / Account Activation")
            ->greeting("Habari {$notifiable->name},")
            ->line("Hongera na karibu kwenye mfumo wa **{$hotelName}**! Akaunti yako ya kazi imesajiliwa kikamilifu.")
            ->line("Taarifa za kuingia na kuwezesha akaunti:")
            ->line("• **Hotel / Property:** {$hotelName}")
            ->line("• **Username ya Kuingilia:** {$username}")
            ->line("• **Simu ya Mawasiliano:** {$phone}")
            ->line("Kabla ya kuanza kufanya kazi kwenye mfumo, tafadhali thibitisha barua pepe yako kwa kubonyeza kitufe hapa chini ili kuwezesha (activate) akaunti yako:")
            ->action("Washa Akaunti Yangu ({$hotelName})", $verificationUrl)
            ->line("Kiungo hiki cha uthibitishaji kitakuwa hai kwa dakika {$expire}.")
            ->line("Ikiwa hukuwa umesajiliwa na uongozi wa {$hotelName}, tafadhali wasiliana na ofisi ya usimamizi.")
            ->salutation("Uongozi wa {$hotelName}");
    }

    /**
     * Get the verification URL for the given notifiable.
     */
    protected function verificationUrl(object $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }
}

