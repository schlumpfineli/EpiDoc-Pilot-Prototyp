<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Befinden;
use App\Models\CustomSymptomLabel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BefindenController extends Controller
{
    /**
     * Display a listing of the resource.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $query = Befinden::where('user_id', $user->id)
            ->orderBy('date', 'desc')
            ->orderBy('time_of_day');

        // Optional: Filter nach Datum
        if ($request->has('date')) {
            $query->whereDate('date', $request->date);
        }

        // Optional: Filter nach Datumsbereich
        if ($request->has('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        // Optional: Filter nach Kategorie
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $befindens = $query->get();

        return response()->json([
            'data' => $befindens,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'date' => ['required', 'date'],
                'category_id' => ['nullable', 'string'],
                'symptom_id' => ['required', 'string', 'max:255'],
                'symptom_label' => ['nullable', 'string', 'max:500'], // Anzeigename für eigene Symptome (Admin-Liste, anonym)
                'time_of_day' => ['required', 'string', 'in:morning,noon,evening'],
                'rating' => ['nullable', 'integer', 'min:0', 'max:10'],
                'questions' => ['nullable', 'array'],
                'observation' => ['nullable', 'string'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validierungsfehler',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $user = $request->user();

            // Prüfe, ob bereits ein Eintrag für diese Kombination existiert
            // Für Beobachtungen (observation) nur nach date und symptom_id suchen
            $query = Befinden::where('user_id', $user->id)
                ->where('date', $request->date)
                ->where('symptom_id', $request->symptom_id);
            
            if ($request->symptom_id === 'observation') {
                // Für Beobachtungen: nur nach date und symptom_id
            } else {
                // Für normale Einträge: auch nach category_id und time_of_day
                if ($request->category_id !== null) {
                    $query->where('category_id', $request->category_id);
                }
                $query->where('time_of_day', $request->time_of_day);
            }
            
            $existing = $query->first();

            $this->saveCustomSymptomLabelIfNeeded($request->symptom_id, $request->input('symptom_label'));

            if ($existing) {
                $validated = $validator->validated();
                unset($validated['symptom_label']);
                foreach ($validated as $key => $value) {
                    if ($value === null && $key !== 'rating' && $key !== 'observation' && $key !== 'questions') {
                        unset($validated[$key]);
                    }
                }
                $existing->update($validated);
                return response()->json([
                    'message' => 'Befinden-Eintrag aktualisiert',
                    'data' => $existing,
                ]);
            }

            $validated = $validator->validated();
            unset($validated['symptom_label']);
            $befinden = Befinden::create([
                'user_id' => $user->id,
                ...$validated,
            ]);

            return response()->json([
                'message' => 'Befinden-Eintrag erstellt',
                'data' => $befinden,
            ], 201);
        } catch (\Exception $e) {
            // Logge den Fehler für Debugging
            \Log::error('Befinden store error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
                'exception' => get_class($e),
            ]);

            // Prüfe auf spezifische Datenbank-Fehler
            $errorMessage = $e->getMessage();
            $isDatabaseError = str_contains($errorMessage, 'SQLSTATE') || 
                              str_contains($errorMessage, 'column') ||
                              str_contains($errorMessage, 'does not exist') ||
                              str_contains($errorMessage, 'null value');

            // In Production: Generische Fehlermeldung, aber mit Hinweis auf Migrations bei DB-Fehlern
            if (!config('app.debug')) {
                $message = 'Ein Fehler ist beim Speichern aufgetreten. Bitte versuchen Sie es später erneut.';
                if ($isDatabaseError) {
                    $message .= ' Möglicherweise müssen Datenbank-Migrationen ausgeführt werden.';
                }
                return response()->json([
                    'message' => 'Server Error',
                    'error' => $message,
                ], 500);
            }

            // In Development: Detaillierte Fehlermeldung
            return response()->json([
                'message' => 'Server Error',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'exception' => get_class($e),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        
        $befinden = Befinden::where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'data' => $befinden,
        ]);
    }

    /**
     * Update the specified resource in storage.
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        
        $befinden = Befinden::where('user_id', $user->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'date' => ['sometimes', 'date'],
            'category_id' => ['sometimes', 'nullable', 'string'],
            'symptom_id' => ['sometimes', 'string', 'max:255'],
            'symptom_label' => ['nullable', 'string', 'max:500'],
            'time_of_day' => ['sometimes', 'string', 'in:morning,noon,evening'],
            'rating' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:10'],
            'questions' => ['nullable', 'array'],
            'observation' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $this->saveCustomSymptomLabelIfNeeded($request->input('symptom_id', $befinden->symptom_id), $request->input('symptom_label'));

        $validated = $validator->validated();
        unset($validated['symptom_label']);
        $befinden->update($validated);

        return response()->json([
            'message' => 'Befinden-Eintrag aktualisiert',
            'data' => $befinden,
        ]);
    }

    /**
     * Remove the specified resource from storage.
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        
        $befinden = Befinden::where('user_id', $user->id)
            ->findOrFail($id);

        $befinden->delete();

        return response()->json([
            'message' => 'Befinden-Eintrag gelöscht',
        ]);
    }

    /**
     * Speichert Anzeigename für eigene Symptome (anonym für Admin-Liste).
     */
    private function saveCustomSymptomLabelIfNeeded(?string $symptomId, ?string $label): void
    {
        if (!$symptomId || !$label || !\Illuminate\Support\Facades\Schema::hasTable('custom_symptom_labels')) {
            return;
        }
        $known = config('befinden.known_symptom_ids', []);
        if (in_array($symptomId, $known, true)) {
            return;
        }
        CustomSymptomLabel::updateOrCreate(
            ['symptom_id' => $symptomId],
            ['label' => \Illuminate\Support\Str::limit($label, 500)]
        );
    }
}
