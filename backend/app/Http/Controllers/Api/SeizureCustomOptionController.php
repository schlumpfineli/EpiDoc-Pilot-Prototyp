<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SeizureCustomOption;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SeizureCustomOptionController extends Controller
{
    /** Maximale Anzahl eigener Einträge pro Art – schützt die Auswahlliste vor Überlänge */
    private const MAX_PER_KIND = 50;

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->groupedOptions($request->user()->id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kind' => ['required', Rule::in(SeizureCustomOption::KINDS)],
            'labels' => ['required', 'array', 'min:1', 'max:20'],
            'labels.*' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()->id;
        $kind = $validator->validated()['kind'];

        $labels = collect($validator->validated()['labels'])
            ->map(fn (?string $label) => trim((string) $label))
            ->filter(fn (string $label) => $label !== '')
            ->unique(fn (string $label) => mb_strtolower($label))
            ->values();

        if ($labels->isEmpty()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => [
                    'labels' => ['Bitte gib mindestens einen Eintrag an.'],
                ],
            ], 422);
        }

        $existing = SeizureCustomOption::where('user_id', $userId)
            ->where('kind', $kind)
            ->pluck('label');

        $taken = $existing->map(fn (string $label) => mb_strtolower($label))->all();
        $remaining = self::MAX_PER_KIND - $existing->count();

        $newLabels = $labels
            ->reject(fn (string $label) => in_array(mb_strtolower($label), $taken, true))
            ->take(max(0, $remaining));

        foreach ($newLabels as $label) {
            SeizureCustomOption::firstOrCreate([
                'user_id' => $userId,
                'kind' => $kind,
                'label' => $label,
            ]);
        }

        return response()->json([
            'message' => 'Auswahlliste aktualisiert',
            'data' => $this->groupedOptions($userId),
        ], 201);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $userId = $request->user()->id;

        $option = SeizureCustomOption::where('user_id', $userId)->findOrFail($id);
        $option->delete();

        return response()->json([
            'message' => 'Eintrag aus der Auswahlliste entfernt',
            'data' => $this->groupedOptions($userId),
        ]);
    }

    /**
     * Nach Art gruppiert, neueste Einträge zuerst. Innerhalb einer Eingabe
     * (gleicher Zeitstempel) bleibt die eingegebene Reihenfolge erhalten.
     *
     * @return array{after_effects: list<array{id: int, label: string}>, triggers: list<array{id: int, label: string}>}
     */
    private function groupedOptions(int $userId): array
    {
        $options = SeizureCustomOption::where('user_id', $userId)
            ->orderByDesc('created_at')
            ->orderBy('id')
            ->get();

        $byKind = fn (string $kind) => $options
            ->where('kind', $kind)
            ->map(fn (SeizureCustomOption $option) => [
                'id' => $option->id,
                'label' => $option->label,
            ])
            ->values()
            ->all();

        return [
            'after_effects' => $byKind(SeizureCustomOption::KIND_AFTER_EFFECT),
            'triggers' => $byKind(SeizureCustomOption::KIND_TRIGGER),
        ];
    }
}
