<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogApiRequests
{
    private function hashIp(Request $request): string
    {
        $ip = (string) $request->ip();
        $salt = (string) config('app.key', 'epidoc-pilot');

        return hash_hmac('sha256', $ip, $salt);
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        $response = $next($request);

        $duration = round((microtime(true) - $startTime) * 1000, 2);

        // Logge nur bei Fehlern oder langsamen Requests (>1 Sekunde)
        if ($response->getStatusCode() >= 400 || $duration > 1000) {
            Log::warning('API Request', [
                'method' => $request->method(),
                'path' => $request->path(),
                'status' => $response->getStatusCode(),
                'duration_ms' => $duration,
                'ip_hash' => $this->hashIp($request),
                'user_id' => $request->user()?->id,
            ]);
        }

        return $response;
    }
}

