<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MedicationController extends Controller
{
    /**
     * Alle Medikamente des aktuellen Benutzers abrufen.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->medications();

        // Optional: nur aktive oder nur abgesetzte
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        $medications = $query->orderBy('active', 'desc')
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $medications]);
    }

    /**
     * Einzelnes Medikament anzeigen.
     */
    public function show(Request $request, Medication $medication): JsonResponse
    {
        if ($medication->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Nicht autorisiert'], 403);
        }

        return response()->json(['data' => $medication]);
    }

    /**
     * Neues Medikament erstellen.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'dose' => ['nullable', 'string', 'max:255'],
            'frequency' => ['nullable', 'string', 'max:255'],
            'time_of_day' => ['nullable', 'array'],
            'time_of_day.*' => ['string', 'in:morning,noon,evening,night'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'prescribed_since' => ['nullable', 'date'],
            'active' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['user_id'] = $request->user()->id;

        $medication = Medication::create($data);

        return response()->json([
            'message' => 'Medikament gespeichert',
            'data' => $medication,
        ], 201);
    }

    /**
     * Medikament aktualisieren.
     */
    public function update(Request $request, Medication $medication): JsonResponse
    {
        if ($medication->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Nicht autorisiert'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:255'],
            'dose' => ['nullable', 'string', 'max:255'],
            'frequency' => ['nullable', 'string', 'max:255'],
            'time_of_day' => ['nullable', 'array'],
            'time_of_day.*' => ['string', 'in:morning,noon,evening,night'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'prescribed_since' => ['nullable', 'date'],
            'active' => ['nullable', 'boolean'],
            'discontinued_at' => ['nullable', 'date'],
            'discontinuation_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $medication->update($validator->validated());

        return response()->json([
            'message' => 'Medikament aktualisiert',
            'data' => $medication,
        ]);
    }

    /**
     * Medikament löschen.
     */
    public function destroy(Request $request, Medication $medication): JsonResponse
    {
        if ($medication->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Nicht autorisiert'], 403);
        }

        $medication->delete();

        return response()->json(['message' => 'Medikament gelöscht']);
    }
}
