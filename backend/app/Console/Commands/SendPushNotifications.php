<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\PushSubscription;
use Illuminate\Console\Command;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class SendPushNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'push:send {type=befinden : Type of notification (befinden)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send push notifications for daily check-ins (Befinden)';

    /**
     * Zeiten für Befinden-Erinnerungen (3x täglich)
     */
    private array $befindenTimes = [
        '09:00',
        '14:00',
        '19:00',
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->argument('type');
        $currentHour = (int) now()->format('H');
        $currentMinute = (int) now()->format('i');
        $currentTime = sprintf('%02d:%02d', $currentHour, $currentMinute);

        $this->info("Checking for notifications at {$currentTime}...");

        if ($type === 'befinden') {
            $this->sendBefindenReminders($currentTime);
        }

        return Command::SUCCESS;
    }

    /**
     * Sende Befinden-Erinnerungen
     */
    private function sendBefindenReminders(string $currentTime): void
    {
        if (!in_array($currentTime, $this->befindenTimes)) {
            $this->info("No befinden reminder scheduled for {$currentTime}");
            return;
        }

        $this->info("Sending befinden reminders for {$currentTime}...");

        // Hole alle Benutzer mit Push-Subscriptions
        $users = User::whereHas('pushSubscriptions')
            ->get();

        $sentCount = 0;
        foreach ($users as $user) {
            // Prüfe ob Befinden-Erinnerungen in den Einstellungen aktiviert sind
            $emailNotifications = $user->email_notifications ?? [];
            if (!($emailNotifications['seizure_reminders'] ?? true)) {
                continue;
            }

            // Prüfe ob heute bereits ein Befinden-Eintrag existiert
            $todayEntry = $user->befindens()
                ->whereDate('date', today())
                ->exists();

            if ($todayEntry) {
                continue; // Bereits eingetragen
            }

            $this->sendPushNotification(
                $user->pushSubscriptions,
                "Wie fühlen Sie sich heute?",
                "Vergessen Sie nicht, Ihr tägliches Befinden einzutragen.",
                '/diary'
            );

            $sentCount++;
        }

        $this->info("Sent {$sentCount} befinden reminder(s)");
    }

    /**
     * Sende Push-Benachrichtigung an alle Subscriptions eines Benutzers
     */
    private function sendPushNotification(
        $subscriptions,
        string $title,
        string $body,
        string $url = '/'
    ): void {
        $vapid = [
            'VAPID' => [
                'subject' => env('VAPID_SUBJECT', 'mailto:support@epidoc.ch'),
                'publicKey' => env('VAPID_PUBLIC_KEY'),
                'privateKey' => env('VAPID_PRIVATE_KEY'),
            ],
        ];

        if (!$vapid['VAPID']['publicKey'] || !$vapid['VAPID']['privateKey']) {
            $this->error('VAPID keys not configured. Please set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env');
            return;
        }

        $webPush = new WebPush($vapid);

        foreach ($subscriptions as $subscription) {
            try {
                $pushSubscription = Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding ?? 'aesgcm',
                ]);

                $webPush->queueNotification(
                    $pushSubscription,
                    json_encode([
                        'title' => $title,
                        'body' => $body,
                        'icon' => '/logo.png',
                        'data' => [
                            'url' => $url,
                        ],
                    ])
                );
            } catch (\Exception $e) {
                $this->error("Error queuing notification for subscription {$subscription->id}: " . $e->getMessage());
            }
        }

        // Sende alle Benachrichtigungen
        foreach ($webPush->flush() as $report) {
            $endpoint = $report->getRequest()->getUri()->__toString();

            if (!$report->isSuccess()) {
                // Entferne ungültige Subscriptions
                $this->warn("Removing invalid subscription: {$endpoint}");
                PushSubscription::where('endpoint', $endpoint)->delete();
            }
        }
    }
}
