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

        $verificationUrl = $this->verificationUrl($notifiable);
        $expire = Config::get('auth.verification.expire', 60);

        $hasSpecificHotel = ($hotelName !== $systemName);
        $propertyLabel = $hasSpecificHotel ? 'Hotel / Property' : 'Platform';

        $mail = (new MailMessage)
            ->from(config('mail.from.address', 'info@haulaenterprises.co.tz'), $hotelName)
            ->subject("[{$hotelName}] Account Activation")
            ->greeting("Hello {$notifiable->name},");

        if ($hasSpecificHotel) {
            $mail->line("Welcome to **{$hotelName}** ({$systemName})! Your employee account has been successfully registered.")
                ->line("Account login and activation details:")
                ->line("- **{$propertyLabel}:** {$hotelName}")
                ->line("- **Platform:** {$systemName}")
                ->line("- **Username:** {$username}")
                ->line("- **Contact Phone:** {$phone}");
        } else {
            $mail->line("Welcome to **{$systemName}**! Your employee account has been successfully registered.")
                ->line("Account login and activation details:")
                ->line("- **{$propertyLabel}:** {$systemName}")
                ->line("- **Username:** {$username}")
                ->line("- **Contact Phone:** {$phone}");
        }

        return $mail
            ->line("Before accessing your workspace, please verify your email address by clicking the button below to activate your account:")
            ->action("Activate My Account ({$hotelName})", $verificationUrl)
            ->line("This verification link will remain active for {$expire} minutes.")
            ->line("If you were not registered by the management of {$hotelName}, please contact system administration.")
            ->salutation("Management at {$hotelName}");
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

