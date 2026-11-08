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
        $systemName = config('app.name', 'THE INNS');

        // Resolve respective hotel name or fallback to system name 'THE INNS'
        $hotelName = $notifiable->hotel_name ?? null;
        if (empty($hotelName) || strtolower(trim($hotelName)) === 'hotel management') {
            $hotelName = $notifiable->property?->name
                ?: ($notifiable->tenant?->name ?: $systemName);
        }

        if (empty($hotelName) || strtolower(trim($hotelName)) === 'hotel management') {
            $hotelName = $systemName;
        }

        $username = $notifiable->username ?? $notifiable->email;
        $phone = $notifiable->phone ?? 'Not specified';

        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        $expire = config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 60);

        $hasSpecificHotel = ($hotelName !== $systemName);
        $propertyLabel = $hasSpecificHotel ? 'Hotel / Property' : 'Platform';

        return (new MailMessage)
            ->from(config('mail.from.address', 'info@haulaenterprises.co.tz'), $hotelName)
            ->subject("[{$hotelName}] Password Reset Request")
            ->greeting("Hello {$notifiable->name},")
            ->line("You are receiving this email from **{$hotelName}** because a password reset request was received for your system account.")
            ->line("Account information:")
            ->line("- **{$propertyLabel}:** {$hotelName}")
            ->line("- **Username:** {$username}")
            ->line("- **Recovery Phone:** {$phone}")
            ->action("Reset Password ({$hotelName})", $url)
            ->line("This password reset link will expire in {$expire} minutes.")
            ->line("If you did not request a password reset, no further action is required; your account remains secure.")
            ->salutation("Management at {$hotelName}");
    }
}

