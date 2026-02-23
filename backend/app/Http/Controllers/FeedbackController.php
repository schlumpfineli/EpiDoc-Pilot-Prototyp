<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class FeedbackController extends Controller
{
    /**
     * Store a newly created feedback.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => ['required', Rule::in(['bug', 'improvement', 'other'])],
            'message' => ['required', 'string', 'min:10', 'max:2000'],
            'page_url' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Trimme die Nachricht und prüfe erneut die Länge
        $trimmedMessage = trim($request->message);
        if (mb_strlen($trimmedMessage, 'UTF-8') < 10) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => [
                    'message' => ['Die Nachricht muss mindestens 10 Zeichen lang sein (ohne Leerzeichen).'],
                ],
            ], 422);
        }

        try {
            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'message' => 'Nicht authentifiziert',
                ], 401);
            }

            // Begrenze user_agent auf max. 500 Zeichen (entspricht der Spaltenlänge)
            $userAgent = $request->header('User-Agent');
            if ($userAgent && strlen($userAgent) > 500) {
                $userAgent = substr($userAgent, 0, 500);
            }

            // Begrenze page_url auf max. 500 Zeichen
            $pageUrl = $request->page_url;
            if ($pageUrl && strlen($pageUrl) > 500) {
                $pageUrl = substr($pageUrl, 0, 500);
            }

            // Prüfe, ob die feedback-Tabelle existiert (mit Fehlerbehandlung)
            // Wenn die Prüfung fehlschlägt, versuchen wir trotzdem zu speichern
            // Der Datenbankfehler wird dann im catch-Block behandelt
            try {
                if (!Schema::hasTable('feedback')) {
                    Log::error('Feedback table does not exist');
                    return response()->json([
                        'message' => 'Feedback-System nicht verfügbar',
                        'error' => 'Die Feedback-Tabelle existiert nicht. Bitte Migration ausführen.',
                    ], 503);
                }
            } catch (\Exception $schemaException) {
                Log::warning('Could not check feedback table existence, attempting to save anyway', [
                    'error' => $schemaException->getMessage(),
                ]);
                // Weiter mit dem Speichern - wenn die Tabelle wirklich nicht existiert,
                // wird der Datenbankfehler im catch-Block behandelt
            }

            $feedback = Feedback::create([
                'user_id' => $user->id,
                'type' => $request->type,
                'message' => $trimmedMessage,
                'page_url' => $pageUrl,
                'user_agent' => $userAgent,
            ]);

            return response()->json([
                'message' => 'Feedback erfolgreich gesendet. Vielen Dank!',
                'data' => $feedback,
            ], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Feedback creation database error', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'message' => 'Fehler beim Speichern des Feedbacks',
                'error' => config('app.debug') ? $e->getMessage() : 'Datenbankfehler beim Speichern',
            ], 500);
        } catch (\Exception $e) {
            Log::error('Feedback creation error', [
                'error' => $e->getMessage(),
                'class' => get_class($e),
                'user_id' => $request->user()?->id,
            ]);

            return response()->json([
                'message' => 'Fehler beim Speichern des Feedbacks',
                'error' => config('app.debug') ? $e->getMessage() : 'Ein Fehler ist aufgetreten',
            ], 500);
        }
    }

    /**
     * Simple HTML view for feedback (for quick viewing)
     * Protected by AdminAuth middleware
     */
    public function view(Request $request): \Illuminate\Contracts\View\View
    {
        $query = Feedback::with('user')
            ->orderBy('created_at', 'desc');

        // Filter by type if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Calculate statistics for all feedback (before pagination)
        $totalCount = Feedback::count();
        $bugCount = Feedback::where('type', 'bug')->count();
        $improvementCount = Feedback::where('type', 'improvement')->count();
        $otherCount = Feedback::where('type', 'other')->count();

        $feedback = $query->paginate(50);

        return view('feedback.index', compact('feedback', 'totalCount', 'bugCount', 'improvementCount', 'otherCount'));
    }
}
