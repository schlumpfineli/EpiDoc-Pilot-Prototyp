<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /**
     * Pilot: User-Objekt für API ohne Klartext-Name, nur display_name (User-ID).
     */
    private function userToApiResponse(User $user): array
    {
        $only = ['id', 'email', 'role', 'created_at', 'updated_at'];
        $base = $user->only($only);
        $base['display_name'] = $user->display_name;
        return $base;
    }

    /**
     * Registrierung: E-Mail Pflicht, kein Klartext-Name. Anzeige nur als User-ID.
     */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['patient', 'relative'])],
            'password' => ['required', 'string', 'min:8', new StrongPassword()],
        ]);

        $user = User::create([
            'name' => 'User',
            'email' => $data['email'],
            'role' => $data['role'],
            'password' => Hash::make($data['password']),
        ]);
        $user->update(['name' => 'User-' . $user->id]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $this->userToApiResponse($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Login: prüft Credentials und gibt Userdaten zurück (ohne Klartext-Name).
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
            'user' => $this->userToApiResponse($user),
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
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
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

        $validated = $validator->validated();

        // Konvertiere 'disease' (einfacher String vom Frontend) in 'diagnoses' (JSON-Array in DB)
        if (array_key_exists('disease', $validated)) {
            $diseaseValue = $validated['disease'];
            unset($validated['disease']);
            if ($diseaseValue) {
                $validated['diagnoses'] = [['type' => $diseaseValue, 'diagnosis_date' => null, 'comment' => null]];
            } else {
                $validated['diagnoses'] = null;
            }
        }

        $user->update($validated);

        $response = $user->only([
            'id', 'email', 'role', 'diagnoses',
            'doctors', 'clinics', 'pharmacies', 'emergency_contact',
            'created_at', 'updated_at'
        ]);
        $response['display_name'] = $user->display_name;
        // Rückwärtskompatibilität: 'disease' als einfachen String zurückgeben
        $diagnoses = $user->diagnoses;
        $response['disease'] = is_array($diagnoses) && count($diagnoses) > 0 ? ($diagnoses[0]['type'] ?? null) : null;

        return response()->json([
            'message' => 'Profil aktualisiert',
            'user' => $response,
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
            'new_password' => ['required', 'string', 'min:8', new StrongPassword()],
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
     * Logout: Aktuelles Token serverseitig invalidieren.
     */
    public function logout(Request $request): JsonResponse
    {
        // Lösche nur das aktuelle Token (nicht alle Geräte)
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Erfolgreich abgemeldet',
        ]);
    }

    /**
     * Delete user account (erfordert Passwort-Bestätigung).
     */
    public function deleteAccount(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Passwort ist erforderlich, um das Konto zu löschen.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Prüfe Passwort
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Falsches Passwort. Konto wurde nicht gelöscht.',
            ], 422);
        }

        // Lösche alle Token des Benutzers
        $user->tokens()->delete();

        // Lösche den Benutzer (Cascade wird automatisch alle zugehörigen Daten löschen)
        $user->delete();

        return response()->json([
            'message' => 'Konto erfolgreich gelöscht',
        ]);
    }

    /**
     * Passwort vergessen: E-Mail mit Reset-Link (Pilot: Link auf Frontend).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink(['email' => $data['email']]);

        if ($status !== Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.',
            ]);
        }

        return response()->json([
            'message' => 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen des Passworts gesendet.',
        ]);
    }

    /**
     * Passwort zurücksetzen mit Token aus E-Mail.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed', new StrongPassword()],
        ], [
            'password.confirmed' => 'Die Passwort-Bestätigung stimmt nicht überein.',
        ]);

        $status = Password::reset(
            [
                'email' => $data['email'],
                'password' => $data['password'],
                'password_confirmation' => $data['password'],
                'token' => $data['token'],
            ],
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen Link an.',
                'errors' => ['token' => ['Der Link ist ungültig oder abgelaufen.']],
            ], 422);
        }

        return response()->json([
            'message' => 'Passwort wurde erfolgreich zurückgesetzt.',
        ]);
    }
}

