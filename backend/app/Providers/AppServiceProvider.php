<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Event;
use Illuminate\Database\Events\MigrationStarted;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Commands registrieren
        $this->commands([
            \App\Console\Commands\BackupDatabase::class,
            \App\Console\Commands\MigrateWithBackup::class,
        ]);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Automatisches Backup vor Migrationen (als Fallback)
        // WICHTIG: Verwenden Sie immer 'php artisan migrate:safe' für maximale Sicherheit!
        // 
        // Hinweis: MigrationStarted Event existiert möglicherweise nicht in allen Laravel-Versionen
        // Daher verwenden wir einen alternativen Ansatz über Command-Hooks
    }
}
