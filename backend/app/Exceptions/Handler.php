<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Auth\AuthenticationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Symfony\Component\HttpFoundation\Response
     *
     * @throws \Throwable
     */
    public function render($request, Throwable $e)
    {
        // Nur für API-Requests JSON-Responses zurückgeben
        if ($request->is('api/*')) {
            return $this->handleApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Handle API exceptions and return consistent JSON responses.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Throwable  $e
     * @return \Illuminate\Http\JsonResponse
     */
    protected function handleApiException($request, Throwable $e)
    {
        // Validation Exception
        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $e->errors(),
            ], 422);
        }

        // Model Not Found Exception
        if ($e instanceof ModelNotFoundException) {
            return response()->json([
                'message' => 'Ressource nicht gefunden',
                'error' => 'Die angeforderte Ressource existiert nicht.',
            ], 404);
        }

        // Not Found HTTP Exception
        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'message' => 'Endpoint nicht gefunden',
                'error' => 'Der angeforderte Endpoint existiert nicht.',
            ], 404);
        }

        // Method Not Allowed Exception
        if ($e instanceof MethodNotAllowedHttpException) {
            return response()->json([
                'message' => 'Methode nicht erlaubt',
                'error' => 'Die HTTP-Methode ist für diesen Endpoint nicht erlaubt.',
            ], 405);
        }

        // Authentication Exception
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'message' => 'Nicht authentifiziert',
                'error' => 'Sie müssen sich anmelden, um auf diese Ressource zuzugreifen.',
            ], 401);
        }

        // Für Produktion: Generische Fehlermeldung
        if (!config('app.debug')) {
            return response()->json([
                'message' => 'Ein Fehler ist aufgetreten',
                'error' => 'Bitte versuchen Sie es später erneut.',
            ], 500);
        }

        // Für Entwicklung: Detaillierte Fehlermeldung
        return response()->json([
            'message' => 'Ein Fehler ist aufgetreten',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ], 500);
    }
}

