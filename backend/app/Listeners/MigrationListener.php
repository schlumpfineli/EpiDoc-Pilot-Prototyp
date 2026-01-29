<?php

namespace App\Listeners;

use Illuminate\Database\Events\MigrationStarted;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class MigrationListener
{
    /**
     * Handle the event.
     */
    public function handle(MigrationStarted $event): void
    {
        // Erstelle automatisch ein Backup vor jeder Migration
        // Nur wenn nicht bereits durch migrate:safe aufgerufen
        if (!app()->runningInConsole() || !request()->server('argv')) {
            return;
        }

        $argv = request()->server('argv', []);
        $command = $argv[1] ?? '';

        // Überspringe, wenn bereits durch migrate:safe aufgerufen
        if ($command === 'migrate:safe') {
            return;
        }

        // Überspringe, wenn db:backup selbst aufgerufen wird
        if ($command === 'db:backup') {
            return;
        }

        // Nur bei migrate-Befehlen
        if (str_starts_with($command, 'migrate')) {
            Log::info('Migration erkannt - erstelle automatisches Backup...');
            
            try {
                Artisan::call('db:backup', [], null);
                Log::info('Automatisches Backup vor Migration erfolgreich erstellt');
            } catch (\Exception $e) {
                Log::error('Fehler beim automatischen Backup vor Migration: ' . $e->getMessage());
                // Wir werfen die Exception nicht, um die Migration nicht zu blockieren
                // Aber wir loggen den Fehler
            }
        }
    }
}

