<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\UsageLog;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class TrackUsage
{
    /**
     * Handle an incoming request.
     * 
     * Protokolliert anonymisierte API-Aufrufe für Analytics.
     * Keine User-IDs werden gespeichert - vollständig anonymisiert.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Nur API-Routen tracken, aber bestimmte Endpunkte ignorieren
        if ($request->is('api/*') && !$request->is('api/admin/*')) {
            $endpoint = $request->path();
            
            // Ignoriere Feedback, Login, Register und User-Endpunkte komplett
            if (!$this->shouldIgnoreEndpoint($endpoint)) {
                try {
                    $method = $request->method();
                    $statusCode = $response->getStatusCode();

                    // Extrahiere Funktionsname aus Endpoint
                    $functionName = $this->extractFunctionName($endpoint);

                    // Nur tracken, wenn Funktionsname vorhanden ist
                    if ($functionName !== null) {
                        try {
                            // Prüfe, ob die Tabelle existiert, bevor wir versuchen zu schreiben
                            // Verwende try-catch, da Schema::hasTable() auch fehlschlagen kann
                            $tableExists = false;
                            try {
                                $tableExists = Schema::hasTable('usage_logs');
                            } catch (\Exception $schemaException) {
                                // Schema-Prüfung fehlgeschlagen - ignoriere
                                $tableExists = false;
                            }

                            if ($tableExists) {
                                UsageLog::create([
                                    'endpoint' => $endpoint,
                                    'method' => $method,
                                    'status_code' => $statusCode,
                                    'function_name' => $functionName,
                                    'date' => now()->toDateString(),
                                ]);
                            }
                        } catch (\Exception $dbException) {
                            // Fehler beim Erstellen des Logs - ignoriere stillschweigend
                            // Dies sollte niemals die Hauptanfrage blockieren
                        }
                    }
                } catch (\Exception $e) {
                    // Fehler beim Tracking sollten die Anfrage nicht blockieren
                    // Logge stillschweigend (optional: Log::error)
                }
            }
        }

        return $response;
    }

    /**
     * Prüft, ob ein Endpunkt komplett ignoriert werden soll
     */
    private function shouldIgnoreEndpoint(string $endpoint): bool
    {
        $ignoredPaths = [
            'api/feedback',
            'api/login',
            'api/register',
            'api/user',
        ];

        foreach ($ignoredPaths as $ignoredPath) {
            if (strpos($endpoint, $ignoredPath) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Extrahiert Funktionsname aus API-Endpoint
     */
    private function extractFunctionName(string $endpoint): ?string
    {
        // Entferne '/api/' Präfix
        $path = str_replace('api/', '', $endpoint);
        
        // Entferne führenden Slash
        $path = ltrim($path, '/');
        
        // Extrahiere ersten Teil (z.B. 'befinden', 'seizures', 'medications')
        $parts = explode('/', $path);
        $functionName = $parts[0] ?? null;
        
        // Ignoriere bestimmte Endpunkte
        $ignored = ['user', 'login', 'register', 'feedback'];
        if (in_array($functionName, $ignored)) {
            return null;
        }
        
        return $functionName;
    }
}

