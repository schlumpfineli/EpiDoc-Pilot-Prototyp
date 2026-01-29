<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class AllowExpiredTokens
{
    /**
     * Handle an incoming request.
     * Erlaubt abgelaufene Tokens für den Token-Refresh-Endpoint (max. 168 Stunden = 7 Tage nach Ablauf).
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Nur für Token-Refresh-Endpoint
        if (!$request->is('api/token/refresh')) {
            return $next($request);
        }

        $token = $request->bearerToken();
        
        if (!$token) {
            return response()->json([
                'message' => 'Kein Token vorhanden',
            ], 401);
        }

        // Finde das Token in der Datenbank
        $tokenRecord = PersonalAccessToken::findToken($token);
        
        if (!$tokenRecord) {
            return response()->json([
                'message' => 'Token nicht gefunden',
            ], 401);
        }

        // Prüfe, ob Token noch in der Gnadenfrist ist (max. 168 Stunden = 7 Tage nach Ablauf)
        $now = now();
        $expiresAt = $tokenRecord->expires_at;
        
        if ($expiresAt && $now->gt($expiresAt)) {
            $hoursSinceExpiry = $now->diffInHours($expiresAt);
            
            // Wenn Token länger als 168 Stunden (7 Tage) abgelaufen ist, lehne ab
            if ($hoursSinceExpiry > 168) {
                return response()->json([
                    'message' => 'Token zu lange abgelaufen. Bitte melden Sie sich erneut an.',
                ], 401);
            }
        }

        // Token ist noch in der Gnadenfrist oder noch gültig
        // Setze den User im Request, damit der Controller darauf zugreifen kann
        $request->setUserResolver(function () use ($tokenRecord) {
            return $tokenRecord->tokenable;
        });

        return $next($request);
    }
}

