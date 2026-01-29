<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Handle an incoming request.
     * 
     * Setzt wichtige Security Headers für Produktion
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // X-Frame-Options: Verhindert Clickjacking
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN', false);

        // X-Content-Type-Options: Verhindert MIME-Sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff', false);

        // X-XSS-Protection: Browser XSS-Filter aktivieren
        $response->headers->set('X-XSS-Protection', '1; mode=block', false);

        // Referrer-Policy: Kontrolliert, welche Referrer-Informationen gesendet werden
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin', false);

        // Permissions-Policy: Kontrolliert Browser-Features
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()', false);

        // Strict-Transport-Security (HSTS) - nur wenn HTTPS
        if ($request->secure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload',
                false
            );
        }

        // Content-Security-Policy (CSP) - Basis-Konfiguration
        // Anpassen je nach Bedarf
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        $appUrl = env('APP_URL', 'http://localhost:8000');
        
        // Bereinige URLs (entferne ungültige Zeichen)
        $frontendUrl = trim($frontendUrl);
        $appUrl = trim($appUrl);
        
        // Entferne schließende Klammern oder andere ungültige Zeichen am Ende
        $frontendUrl = rtrim($frontendUrl, ']');
        $appUrl = rtrim($appUrl, ']');
        
        // Validiere, dass es eine gültige URL ist
        $allowedOrigins = [];
        if (filter_var($frontendUrl, FILTER_VALIDATE_URL)) {
            $allowedOrigins[] = $frontendUrl;
        }
        if (filter_var($appUrl, FILTER_VALIDATE_URL) && $appUrl !== $frontendUrl) {
            $allowedOrigins[] = $appUrl;
        }
        
        $connectSrc = !empty($allowedOrigins) ? ' ' . implode(' ', $allowedOrigins) : '';
        
        $csp = "default-src 'self'; " .
               "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " . // unsafe-inline/eval für React/Next.js
               "style-src 'self' 'unsafe-inline'; " .
               "img-src 'self' data: https:; " .
               "font-src 'self' data:; " .
               "connect-src 'self'" . $connectSrc . "; " .
               "frame-ancestors 'self';";

        $response->headers->set('Content-Security-Policy', $csp, false);

        return $response;
    }
}
