<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\LogApiRequests::class,
            \App\Http\Middleware\TrackUsage::class,
            \App\Http\Middleware\SanitizeInput::class,
        ]);

        // Security Headers für alle Responses
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);
        
        // Für API-Routen keine Redirects bei unauthentifizierten Anfragen
        $middleware->redirectGuestsTo(function ($request) {
            // Für API-Requests keine Redirects, Exception wird vom Handler behandelt
            if ($request->is('api/*')) {
                return null;
            }
            // Für Web-Routes standard Redirect (falls nötig)
            return '/login';
        });
    })
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule): void {
        // Push-Benachrichtigungen sind im Pilot deaktiviert.
        // Für zukünftige Versionen:
        // $schedule->command('push:send befinden')->dailyAt('09:00');
        // $schedule->command('push:send befinden')->dailyAt('14:00');
        // $schedule->command('push:send befinden')->dailyAt('19:00');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // API Exception Handling wird in App\Exceptions\Handler behandelt
    })->create();
