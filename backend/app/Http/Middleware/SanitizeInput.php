<?php

namespace App\Http\Middleware;

use App\Helpers\SanitizationHelper;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Handle an incoming request.
     * Bereinigt alle String-Eingaben vor der Verarbeitung.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Bereinige alle Eingaben außer Passwörtern und Tokens
        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH')) {
            $input = $request->all();
            $sanitized = SanitizationHelper::sanitizeRequestData($input);
            $request->merge($sanitized);
        }

        return $next($request);
    }
}

