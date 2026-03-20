<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    private function normalizeSecret(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        // Toleriert versehentliche Quotes/Whitespace aus ENV-UI Copy&Paste.
        return trim($value, " \t\n\r\0\x0B\"'");
    }

    private function readEnvValue(string $key): ?string
    {
        $serverValue = $_SERVER[$key] ?? null;
        if (is_string($serverValue) && $this->normalizeSecret($serverValue) !== '') {
            return $this->normalizeSecret($serverValue);
        }

        $envValue = $_ENV[$key] ?? null;
        if (is_string($envValue) && $this->normalizeSecret($envValue) !== '') {
            return $this->normalizeSecret($envValue);
        }

        $runtime = getenv($key);
        if (is_string($runtime) && $this->normalizeSecret($runtime) !== '') {
            return $this->normalizeSecret($runtime);
        }

        return null;
    }

    private function resolveAdminPassword(): array
    {
        $runtime = $this->readEnvValue('ADMIN_PASSWORD');
        if ($runtime !== null) {
            return ['value' => $runtime, 'source' => 'runtime_env_admin_password'];
        }

        // Fallback für versehentlich falsche Legacy-Schreibweise.
        $legacy = $this->readEnvValue('Admin_Password');
        if ($legacy !== null) {
            return ['value' => $legacy, 'source' => 'runtime_env_legacy_admin_password'];
        }

        return [
            'value' => $this->normalizeSecret((string) config('app.admin_password', '')),
            'source' => 'config_app_admin_password',
        ];
    }

    /**
     * Handle an incoming request.
     * 
     * Für Prototyp: Einfache Passwort-Abfrage über Session
     * In Produktion: Richtige Admin-Rollen und Authentifizierung implementieren
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Prüfe, ob Admin bereits eingeloggt ist
        if (session('admin_authenticated')) {
            return $next($request);
        }

        // Wenn Passwort gesendet wurde, prüfe es
        if ($request->has('admin_password')) {
            $adminResolution = $this->resolveAdminPassword();
            $adminPassword = $adminResolution['value'];
            $adminPasswordSource = $adminResolution['source'];
            $providedPassword = $this->normalizeSecret((string) $request->input('admin_password', ''));
            
            if (!$adminPassword) {
                return response()->view('admin.login', [
                    'error' => 'Admin-Zugang nicht konfiguriert. Bitte ADMIN_PASSWORD als Umgebungsvariable setzen.',
                ], 503);
            }

            $isValid = false;
            $isHashedPassword =
                str_starts_with($adminPassword, '$2a$') ||
                str_starts_with($adminPassword, '$2b$') ||
                str_starts_with($adminPassword, '$2y$') ||
                str_starts_with($adminPassword, '$argon2i$') ||
                str_starts_with($adminPassword, '$argon2id$');

            if ($isHashedPassword) {
                $isValid = Hash::check($providedPassword, $adminPassword);
            } else {
                $isValid = hash_equals($adminPassword, $providedPassword);
            }

            if ($isValid) {
                session(['admin_authenticated' => true]);
                // Bei POST-Requests: Redirect zu GET, um POST-Data-Loss zu vermeiden
                if ($request->isMethod('POST')) {
                    return redirect($request->url())->with('success', 'Erfolgreich eingeloggt');
                }
                return redirect($request->url());
            }

            Log::warning('Admin login failed', [
                'password_source' => $adminPasswordSource,
                'configured_length' => strlen($adminPassword),
                'provided_length' => strlen($providedPassword),
                'configured_prefix' => substr($adminPassword, 0, 8),
                'is_hashed_password' => $isHashedPassword,
                'url' => $request->path(),
            ]);
            
            return redirect($request->url())->with('error', 'Falsches Passwort');
        }

        // Für POST-Requests ohne Passwort: Zeige Login-Formular (nicht redirect)
        // Dies verhindert 405-Fehler bei abgelaufenen Sessions
        if ($request->isMethod('POST')) {
            // Für API-ähnliche POST-Requests: JSON-Response
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Nicht authentifiziert',
                    'error' => 'Bitte melden Sie sich als Admin an',
                ], 401);
            }
            // Für normale POST-Requests: Zeige Login-Formular
            return response()->view('admin.login', [
                'error' => 'Bitte melden Sie sich als Admin an',
            ]);
        }

        // Zeige Login-Formular für GET-Requests
        return response()->view('admin.login', [
            'error' => session('error'),
        ]);
    }
}
