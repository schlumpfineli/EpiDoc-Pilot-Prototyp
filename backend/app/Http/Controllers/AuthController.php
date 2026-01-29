<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Registrierung: Validierung, Hash und Rückgabe der Userdaten (ohne Passwort).
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['patient', 'relative'])],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
            'token' => $token,
        ], 201);
    }

    /**
     * Login: prüft Credentials und gibt Userdaten zurück.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Ungültige Zugangsdaten.',
            ], 422);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']),
            'token' => $token,
        ]);
    }

    /**
     * Update user profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'disease' => ['nullable', 'string', 'max:255'],
            'doctors' => ['nullable', 'array'],
            'doctors.*.name' => ['required_with:doctors', 'string', 'max:255'],
            'doctors.*.phone' => ['nullable', 'string', 'max:255'],
            'doctors.*.email' => ['nullable', 'email', 'max:255'],
            'clinics' => ['nullable', 'array'],
            'clinics.*.name' => ['required_with:clinics', 'string', 'max:255'],
            'clinics.*.phone' => ['nullable', 'string', 'max:255'],
            'clinics.*.address' => ['nullable', 'string', 'max:500'],
            'pharmacies' => ['nullable', 'array'],
            'pharmacies.*.name' => ['required_with:pharmacies', 'string', 'max:255'],
            'pharmacies.*.phone' => ['nullable', 'string', 'max:255'],
            'pharmacies.*.address' => ['nullable', 'string', 'max:500'],
            'emergency_contact' => ['nullable', 'array'],
            'emergency_contact.name' => ['required_with:emergency_contact', 'string', 'max:255'],
            'emergency_contact.phone' => ['required_with:emergency_contact', 'string', 'max:255'],
            'emergency_contact.relationship' => ['nullable', 'string', 'max:255'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user->update($validator->validated());

        return response()->json([
            'message' => 'Profil aktualisiert',
            'user' => $user->only([
                'id', 'name', 'email', 'role', 'disease', 
                'doctors', 'clinics', 'pharmacies', 'emergency_contact',
                'created_at', 'updated_at'
            ]),
        ]);
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8'],
            'new_password_confirmation' => ['required', 'string', 'same:new_password'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Prüfe aktuelles Passwort
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Aktuelles Passwort ist falsch',
            ], 422);
        }

        // Aktualisiere Passwort
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json([
            'message' => 'Passwort erfolgreich geändert',
        ]);
    }

    /**
     * Delete user account.
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        // Lösche alle Token des Benutzers
        $user->tokens()->delete();

        // Lösche den Benutzer (Cascade wird automatisch alle zugehörigen Daten löschen)
        $user->delete();

        return response()->json([
            'message' => 'Konto erfolgreich gelöscht',
        ]);
    }
}

