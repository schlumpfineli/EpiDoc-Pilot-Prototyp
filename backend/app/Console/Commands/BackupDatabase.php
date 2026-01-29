<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class BackupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:backup {--path= : Spezifischer Pfad für das Backup}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Erstellt ein Backup der Datenbank vor Updates';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if (!$database) {
            $this->error('Keine Datenbank konfiguriert!');
            return Command::FAILURE;
        }

        // Backup-Verzeichnis erstellen
        $backupDir = $this->option('path') 
            ? $this->option('path') 
            : database_path('backups');

        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        // Backup-Dateiname mit Timestamp
        $timestamp = Carbon::now()->format('Y-m-d_H-i-s');
        $extension = pathinfo($database, PATHINFO_EXTENSION) ?: 'sqlite';
        $filename = "backup_{$timestamp}.{$extension}";
        $backupPath = $backupDir . '/' . $filename;

        try {
            // SQLite Backup
            if ($connection === 'sqlite') {
                if (!File::exists($database)) {
                    $this->error("Datenbankdatei nicht gefunden: {$database}");
                    return Command::FAILURE;
                }

                File::copy($database, $backupPath);
                $this->info("✓ Backup erstellt: {$backupPath}");
            } 
            // MySQL/MariaDB Backup
            elseif (in_array($connection, ['mysql', 'mariadb'])) {
                $host = config("database.connections.{$connection}.host");
                $port = config("database.connections.{$connection}.port");
                $username = config("database.connections.{$connection}.username");
                $password = config("database.connections.{$connection}.password");
                $dbName = config("database.connections.{$connection}.database");

                $command = sprintf(
                    'mysqldump -h %s -P %s -u %s -p%s %s > %s',
                    escapeshellarg($host),
                    escapeshellarg($port),
                    escapeshellarg($username),
                    escapeshellarg($password),
                    escapeshellarg($dbName),
                    escapeshellarg($backupPath)
                );

                exec($command, $output, $returnVar);

                if ($returnVar !== 0) {
                    $this->error('Fehler beim Erstellen des MySQL-Backups!');
                    return Command::FAILURE;
                }

                $this->info("✓ Backup erstellt: {$backupPath}");
            } 
            // PostgreSQL Backup
            elseif ($connection === 'pgsql') {
                $host = config("database.connections.{$connection}.host");
                $port = config("database.connections.{$connection}.port");
                $username = config("database.connections.{$connection}.username");
                $password = config("database.connections.{$connection}.password");
                $dbName = config("database.connections.{$connection}.database");

                putenv("PGPASSWORD={$password}");
                $command = sprintf(
                    'pg_dump -h %s -p %s -U %s %s > %s',
                    escapeshellarg($host),
                    escapeshellarg($port),
                    escapeshellarg($username),
                    escapeshellarg($dbName),
                    escapeshellarg($backupPath)
                );

                exec($command, $output, $returnVar);

                if ($returnVar !== 0) {
                    $this->error('Fehler beim Erstellen des PostgreSQL-Backups!');
                    return Command::FAILURE;
                }

                $this->info("✓ Backup erstellt: {$backupPath}");
            } else {
                $this->error("Backup für Datenbanktyp '{$connection}' nicht unterstützt!");
                return Command::FAILURE;
            }

            // Alte Backup-DATEIEN löschen (älter als 30 Tage)
            // WICHTIG: Dies betrifft nur die Backup-Dateien, nicht die Datenbankeinträge!
            $this->cleanOldBackups($backupDir);

            $this->info("✓ Backup erfolgreich abgeschlossen!");
            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Fehler beim Erstellen des Backups: " . $e->getMessage());
            return Command::FAILURE;
        }
    }

    /**
     * Löscht alte Backup-DATEIEN (älter als 30 Tage)
     * 
     * WICHTIG: Dies löscht NUR die Backup-Dateien im backups-Ordner,
     * NICHT die eigentlichen Daten in der Datenbank!
     * Alle Datenbankeinträge (Anfälle, Befindens, etc.) bleiben vollständig erhalten.
     */
    private function cleanOldBackups(string $backupDir): void
    {
        $files = File::files($backupDir);
        $cutoffDate = Carbon::now()->subDays(30);

        foreach ($files as $file) {
            // Nur Dateien mit "backup_" Präfix löschen, um sicherzustellen, dass nur Backups betroffen sind
            if (str_starts_with($file->getFilename(), 'backup_') && 
                Carbon::createFromTimestamp($file->getMTime())->lt($cutoffDate)) {
                File::delete($file->getPathname());
                $this->line("  Alte Backup-Datei gelöscht: {$file->getFilename()}");
            }
        }
    }
}

