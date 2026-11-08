<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TenantResetPasswordNotification extends Notification
{
    use Queueable;

    public string $token;

    /**
     * Create a new notification instance.
     */
    public function __construct(#[\SensitiveParameter] string $token)
    {
        $this->token = $token;
    }

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

        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        $expire = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

        return (new MailMessage)
            ->subject("[{$hotelName}] Password Reset Request / Urejeshaji wa Nenosiri")
            ->greeting("Habari {$notifiable->name},")
            ->line("Ujumbe huu unatumwa kwako kutoka **{$hotelName}** kwa sababu kumekuwa na ombi la kurejesha nenosiri (password recovery) la akaunti yako ya mfumo.")
            ->line("Taarifa za akaunti yako ya kazi:")
            ->line("• **Hotel / Property:** {$hotelName}")
            ->line("• **Username:** {$username}")
            ->line("• **Recovery Phone:** {$phone}")
            ->action("Weka Nenosiri Jipya ({$hotelName})", $url)
            ->line("Kiungo (link) hiki cha kurejesha nenosiri kitakwisha muda wake baada ya dakika {$expire}.")
            ->line("Ikiwa hukuomba kubadilisha nenosiri, hakuna hatua nyingine inayohitajika; akaunti yako iko salama.")
            ->salutation("Uongozi wa {$hotelName}");
    }
}

