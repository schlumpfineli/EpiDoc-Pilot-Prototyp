<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
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
            $adminPassword = config('app.admin_password');
            
            if (!$adminPassword) {
                return response()->view('admin.login', [
                    'error' => 'Admin-Zugang nicht konfiguriert. Bitte ADMIN_PASSWORD als Umgebungsvariable setzen.',
                ], 503);
            }
            
            if ($request->admin_password === $adminPassword) {
                session(['admin_authenticated' => true]);
                // Bei POST-Requests: Redirect zu GET, um POST-Data-Loss zu vermeiden
                if ($request->isMethod('POST')) {
                    return redirect($request->url())->with('success', 'Erfolgreich eingeloggt');
                }
                return redirect($request->url());
            }
            
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
