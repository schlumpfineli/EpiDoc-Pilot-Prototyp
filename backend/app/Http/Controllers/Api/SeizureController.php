<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Seizure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SeizureController extends Controller
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
        
        $query = Seizure::where('user_id', $user->id)
            ->orderBy('date', 'desc');

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

        $seizures = $query->get();

        return response()->json([
            'data' => $seizures,
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
        $validator = Validator::make($request->all(), [
            'date' => ['required', 'date'],
            'type' => ['nullable', 'array'],
            'type.*' => ['string', 'max:255'],
            'custom_type' => ['nullable', 'string', 'max:255'],
            'felt_before' => ['nullable', 'string', 'max:1000'],
            'felt_symptoms' => ['nullable', 'string', 'max:1000'],
            'seizure_count' => ['required', 'integer', 'min:1'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:0', 'max:59'],
            'after_effects' => ['nullable', 'array'],
            'after_effects.*' => ['string', 'max:255'],
            'custom_after_effects' => ['nullable', 'string', 'max:500'],
            'triggers' => ['nullable', 'array'],
            'triggers.*' => ['string', 'max:255'],
            'custom_triggers' => ['nullable', 'string', 'max:500'],
            'emergency_med' => ['required', 'boolean'],
            'emergency_med_name' => ['nullable', 'required_if:emergency_med,true', 'string', 'max:255'],
            'video_path' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        $seizure = Seizure::create([
            'user_id' => $user->id,
            ...$validator->validated(),
        ]);

        return response()->json([
            'message' => 'Anfall-Eintrag erstellt',
            'data' => $seizure,
        ], 201);
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
        
        $seizure = Seizure::where('user_id', $user->id)
            ->findOrFail($id);

        return response()->json([
            'data' => $seizure,
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
        
        $seizure = Seizure::where('user_id', $user->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'date' => ['sometimes', 'date'],
            'type' => ['nullable', 'array'],
            'type.*' => ['string', 'max:255'],
            'custom_type' => ['nullable', 'string', 'max:255'],
            'felt_before' => ['nullable', 'string', 'max:1000'],
            'felt_symptoms' => ['nullable', 'string', 'max:1000'],
            'seizure_count' => ['sometimes', 'integer', 'min:1'],
            'duration_minutes' => ['nullable', 'integer', 'min:0'],
            'duration_seconds' => ['nullable', 'integer', 'min:0', 'max:59'],
            'after_effects' => ['nullable', 'array'],
            'after_effects.*' => ['string', 'max:255'],
            'custom_after_effects' => ['nullable', 'string', 'max:500'],
            'triggers' => ['nullable', 'array'],
            'triggers.*' => ['string', 'max:255'],
            'custom_triggers' => ['nullable', 'string', 'max:500'],
            'emergency_med' => ['sometimes', 'boolean'],
            'emergency_med_name' => ['nullable', 'required_if:emergency_med,true', 'string', 'max:255'],
            'video_path' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $seizure->update($validator->validated());

        return response()->json([
            'message' => 'Anfall-Eintrag aktualisiert',
            'data' => $seizure,
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
        
        $seizure = Seizure::where('user_id', $user->id)
            ->findOrFail($id);

        $seizure->delete();

        return response()->json([
            'message' => 'Anfall-Eintrag gelöscht',
        ]);
    }
}
