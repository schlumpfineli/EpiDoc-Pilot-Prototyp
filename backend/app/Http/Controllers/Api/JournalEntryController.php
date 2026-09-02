<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class JournalEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entries = JournalEntry::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $entries,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'body' => ['required', 'string', 'min:1', 'max:10000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $body = trim($validator->validated()['body']);
        if ($body === '') {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => [
                    'body' => ['Bitte schreibe etwas, bevor du speicherst.'],
                ],
            ], 422);
        }

        $entry = JournalEntry::create([
            'user_id' => $request->user()->id,
            'body' => $body,
        ]);

        return response()->json([
            'message' => 'Eintrag gespeichert',
            'data' => $entry,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $entry = JournalEntry::where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json([
            'data' => $entry,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $entry = JournalEntry::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'body' => ['required', 'string', 'min:1', 'max:10000'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $body = trim($validator->validated()['body']);
        if ($body === '') {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => [
                    'body' => ['Bitte schreibe etwas, bevor du speicherst.'],
                ],
            ], 422);
        }

        $entry->update(['body' => $body]);

        return response()->json([
            'message' => 'Eintrag aktualisiert',
            'data' => $entry,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $entry = JournalEntry::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $entry->delete();

        return response()->json([
            'message' => 'Eintrag gelöscht',
        ]);
    }
}
