<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class AdminMigrationController extends Controller
{
    /**
     * Zeigt die Migration-Seite
     * TEMPORÄR - Nur für Pilot-Phase, danach entfernen!
     */
    public function index(Request $request)
    {
        $migrationStatus = $this->checkMigrationStatus();
        
        return view('admin.migrate', [
            'migrationStatus' => $migrationStatus,
        ]);
    }

    /**
     * Führt Migrationen aus
     * TEMPORÄR - Nur für Pilot-Phase, danach entfernen!
     */
    public function run(Request $request)
    {
        try {
            Log::info('Admin migration started via web interface');
            
            // Führe Migration aus
            Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();
            
            Log::info('Admin migration completed', ['output' => $output]);
            
            return response()->json([
                'success' => true,
                'message' => 'Migrationen erfolgreich ausgeführt',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin migration failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Fehler bei der Migration',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Prüft den Status der Migrationen
     */
    private function checkMigrationStatus(): array
    {
        $status = [
            'feedback_table_exists' => false,
            'usage_logs_table_exists' => false,
        ];

        try {
            $status['feedback_table_exists'] = Schema::hasTable('feedback');
        } catch (\Exception $e) {
            // Ignoriere Fehler
        }

        try {
            $status['usage_logs_table_exists'] = Schema::hasTable('usage_logs');
        } catch (\Exception $e) {
            // Ignoriere Fehler
        }

        return $status;
    }
}

