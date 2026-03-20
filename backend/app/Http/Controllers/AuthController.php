<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Rules\StrongPassword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    private const CONTACT_PROFILE_FIELDS = [
        'phone',
        'address',
        'doctors',
        'clinics',
        'pharmacies',
        'emergency_contact',
    ];

    private function strictAnonymityEnabled(): bool
    {
        $value = env('PILOT_STRICT_ANONYMITY', true);
        if (is_bool($value)) {
            return $value;
        }

        return filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true;
    }

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

    private function userHasColumn(string $column): bool
    {
        try {
            return Schema::hasColumn('users', $column);
        } catch (\Throwable) {
            return false;
        }
    }

    private function userToProfileResponse(User $user): array
    {
        $fields = ['id', 'email', 'role', 'diagnoses', 'created_at', 'updated_at'];

        if (!$this->strictAnonymityEnabled()) {
            $fields = array_merge($fields, self::CONTACT_PROFILE_FIELDS);
        }

        $data = $user->only($fields);
        $diagnoses = $user->diagnoses;
        $data['disease'] = is_array($diagnoses) && count($diagnoses) > 0 ? ($diagnoses[0]['type'] ?? null) : null;
        $data['display_name'] = $user->display_name;

        return $data;
    }

    /**
     * Registrierung: E-Mail Pflicht, kein Klartext-Name. Anzeige nur als User-ID.
     */
    public function register(Request $request): JsonResponse
    {
        $rules = [
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', Rule::in(['patient', 'relative'])],
            'password' => ['required', 'string', 'min:8', new StrongPassword()],
        ];

        if ($this->strictAnonymityEnabled()) {
            $rules['name'] = ['prohibited'];
        } else {
            $rules['name'] = ['nullable', 'string', 'max:255'];
        }

        $data = $request->validate($rules);

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
        $strictMode = $this->strictAnonymityEnabled();

        $rules = [
            'email' => ['sometimes', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'disease' => ['nullable', 'string', 'max:255'],
            'diagnoses' => ['nullable', 'array'],
            'diagnoses.*.type' => ['required_with:diagnoses', 'string', 'max:255'],
        ];

        if ($strictMode) {
            foreach (self::CONTACT_PROFILE_FIELDS as $field) {
                $rules[$field] = ['prohibited'];
            }
        } else {
            $rules = array_merge($rules, [
                'phone' => ['nullable', 'string', 'max:255'],
                'address' => ['nullable', 'string', 'max:500'],
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
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Wenn 'diagnoses' direkt als Array gesendet wird, dieses verwenden
        if (array_key_exists('diagnoses', $validated)) {
            unset($validated['disease']);
            $diagnosesArr = $validated['diagnoses'];
            if (is_array($diagnosesArr) && count($diagnosesArr) > 0) {
                $validated['diagnoses'] = array_values(array_filter(
                    array_map(fn($d) => [
                        'type' => $d['type'] ?? '',
                        'diagnosis_date' => $d['diagnosis_date'] ?? null,
                        'comment' => $d['comment'] ?? null,
                    ], $diagnosesArr),
                    fn($d) => !empty(trim($d['type']))
                ));
                if (empty($validated['diagnoses'])) {
                    $validated['diagnoses'] = null;
                }
            } else {
                $validated['diagnoses'] = null;
            }
        }
        // Rückwärtskompatibilität: 'disease' als einfachen String konvertieren
        elseif (array_key_exists('disease', $validated)) {
            $diseaseValue = $validated['disease'];
            unset($validated['disease']);
            if ($diseaseValue) {
                $validated['diagnoses'] = [['type' => $diseaseValue, 'diagnosis_date' => null, 'comment' => null]];
            } else {
                $validated['diagnoses'] = null;
            }
        }

        if ($strictMode) {
            foreach (self::CONTACT_PROFILE_FIELDS as $field) {
                if ($this->userHasColumn($field)) {
                    $validated[$field] = null;
                }
            }
        }

        $user->update($validated);

        $response = $this->userToProfileResponse($user);

        return response()->json([
            'message' => 'Profil aktualisiert',
            'user' => $response,
        ]);
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json(['user' => $this->userToProfileResponse($user)]);
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

