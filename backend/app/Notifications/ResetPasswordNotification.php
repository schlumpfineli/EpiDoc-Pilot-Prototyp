<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword as ResetPasswordBase;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Lang;

/**
 * Pilot: Reset-Link zeigt auf Frontend-URL (z. B. Vercel),
 * damit der Benutzer dort das Passwort zurücksetzen kann.
 */
class ResetPasswordNotification extends ResetPasswordBase
{
    /**
     * Get the reset URL for the given notifiable.
     */
    protected function resetUrl(mixed $notifiable): string
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');
        $token = $this->token;
        $email = $notifiable->getEmailForPasswordReset();

        return $frontendUrl . '/reset-password?' . http_build_query([
            'token' => $token,
            'email' => $email,
        ]);
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail(mixed $notifiable): MailMessage
    {
        $url = $this->resetUrl($notifiable);

        return (new MailMessage)
            ->subject(Lang::get('Passwort zurücksetzen'))
            ->line(Lang::get('Sie erhalten diese E-Mail, weil wir eine Anfrage zum Zurücksetzen des Passworts für Ihr Konto erhalten haben.'))
            ->action(Lang::get('Passwort zurücksetzen'), $url)
            ->line(Lang::get('Dieser Link ist :count Minuten gültig.', ['count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire')]))
            ->line(Lang::get('Wenn Sie keine Passwort-Zurücksetzung angefordert haben, können Sie diese E-Mail ignorieren.'));
    }
}
