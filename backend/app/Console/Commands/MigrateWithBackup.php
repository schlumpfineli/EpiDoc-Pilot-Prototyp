<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class MigrateWithBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrate:safe 
                            {--force : Force the operation to run when in production}
                            {--path= : The path to the migrations files to be executed}
                            {--realpath : Indicate any provided migration file paths are pre-resolved absolute paths}
                            {--pretend : Dump the SQL queries that would be run}
                            {--step : Force the migrations to run so they can be rolled back individually}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Führt Migrationen mit automatischem Backup aus';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔄 Starte sichere Migration mit automatischem Backup...');
        $this->newLine();

        // Schritt 1: Backup erstellen
        $this->info('📦 Schritt 1: Erstelle Datenbank-Backup...');
        $backupResult = Artisan::call('db:backup');
        
        if ($backupResult !== 0) {
            $this->error('❌ Backup fehlgeschlagen! Migration wird abgebrochen.');
            $this->error('💡 Bitte beheben Sie das Backup-Problem und versuchen Sie es erneut.');
            return Command::FAILURE;
        }

        $this->info('✅ Backup erfolgreich erstellt');
        $this->newLine();

        // Schritt 2: Migration ausführen
        $this->info('🚀 Schritt 2: Führe Migrationen aus...');
        
        $migrateOptions = [];
        if ($this->option('force')) {
            $migrateOptions['--force'] = true;
        }
        if ($this->option('path')) {
            $migrateOptions['--path'] = $this->option('path');
        }
        if ($this->option('realpath')) {
            $migrateOptions['--realpath'] = true;
        }
        if ($this->option('pretend')) {
            $migrateOptions['--pretend'] = true;
        }
        if ($this->option('step')) {
            $migrateOptions['--step'] = true;
        }

        $migrateResult = Artisan::call('migrate', $migrateOptions);
        
        // Output der Migration anzeigen
        $this->line(Artisan::output());

        if ($migrateResult !== 0) {
            $this->error('❌ Migration fehlgeschlagen!');
            $this->warn('💡 Das Backup wurde erstellt und kann zur Wiederherstellung verwendet werden.');
            $this->newLine();
            $this->info('📋 Verfügbare Backups:');
            $this->line('   ' . database_path('backups'));
            return Command::FAILURE;
        }

        $this->newLine();
        $this->info('✅ Migration erfolgreich abgeschlossen!');
        $this->info('💾 Backup gespeichert in: ' . database_path('backups'));
        
        return Command::SUCCESS;
    }
}

