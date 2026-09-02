<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function user_can_register_with_valid_data()
    {
        $response = $this->postJson('/api/register', $this->registerPayload());

        $response->assertStatus(201)
            ->assertJsonStructure([
                'user' => ['id', 'display_name', 'email', 'role', 'created_at', 'updated_at'],
                'token',
            ])
            ->assertJson([
                'user' => [
                    'email' => 'test@example.com',
                    'role' => 'patient',
                ],
            ]);

        $user = User::where('email', 'test@example.com')->first();
        $this->assertNotNull($user);
        $response->assertJson(['user' => ['display_name' => 'User-' . $user->id]]);

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'role' => 'patient',
        ]);

        $this->assertTrue(Hash::check('Password123', $user->password));
        $this->assertNotNull($user->privacy_accepted_at);
        $this->assertNotNull($user->health_data_consent_at);
    }

    /** @test */
    public function user_cannot_register_with_invalid_email()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'email' => 'invalid-email',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function user_cannot_register_with_duplicate_email()
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/register', $this->registerPayload([
            'email' => 'existing@example.com',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function user_cannot_register_with_short_password()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'password' => 'short',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function user_cannot_register_with_password_without_uppercase()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'password' => 'password123',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function user_cannot_register_with_password_without_lowercase()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'password' => 'PASSWORD123',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function user_cannot_register_with_password_without_number()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'password' => 'Password',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function user_can_register_with_strong_password()
    {
        $response = $this->postJson('/api/register', $this->registerPayload());

        $response->assertStatus(201)
            ->assertJsonStructure([
                'user' => ['id', 'display_name', 'email', 'role'],
                'token',
            ]);
    }

    /** @test */
    public function user_cannot_register_with_invalid_role()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'role' => 'invalid_role',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['role']);
    }

    /** @test */
    public function user_cannot_register_without_privacy_consent()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'privacy_accepted' => false,
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['privacy_accepted']);
    }

    /** @test */
    public function user_cannot_register_without_health_data_consent()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'health_data_consent' => false,
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['health_data_consent']);
    }

    /** @test */
    public function user_can_login_with_valid_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'display_name', 'email', 'role', 'created_at', 'updated_at'],
                'token',
            ])
            ->assertJson([
                'user' => [
                    'email' => 'test@example.com',
                ],
            ]);
    }

    /** @test */
    public function user_cannot_login_with_invalid_email()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Ungültige Zugangsdaten.',
            ]);
    }

    /** @test */
    public function user_cannot_login_with_invalid_password()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('Password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'WrongPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Ungültige Zugangsdaten.',
            ]);
    }

    /** @test */
    public function authenticated_user_can_update_profile()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->putJson('/api/user/profile', [
            'disease' => 'Epilepsie',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'Profil aktualisiert')
            ->assertJsonPath('user.disease', 'Epilepsie');

        if (Schema::hasColumn('users', 'disease')) {
            $this->assertDatabaseHas('users', [
                'id' => $user->id,
                'disease' => 'Epilepsie',
            ]);
        } elseif (Schema::hasColumn('users', 'diagnoses')) {
            $user->refresh();
            $diagnoses = $user->getAttribute('diagnoses');
            $this->assertIsArray($diagnoses);
            $this->assertSame('Epilepsie', $diagnoses[0]['type'] ?? null);
        }
    }

    /** @test */
    public function strict_mode_blocks_contact_profile_fields()
    {
        $this->createAuthenticatedUser();

        $response = $this->putJson('/api/user/profile', [
            'phone' => '+41 12 345 67 89',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    /** @test */
    public function strict_mode_hides_contact_fields_in_user_response()
    {
        $user = User::factory()->create([
            'email' => 'privacy@example.com',
            'role' => 'patient',
            'doctors' => [['name' => 'Dr. Muster', 'phone' => '0000']],
            'clinics' => [['name' => 'Klinik A', 'address' => 'Adresse']],
            'pharmacies' => [['name' => 'Apotheke A', 'phone' => '0000']],
            'emergency_contact' => ['name' => 'Kontakt', 'phone' => '1111'],
        ]);

        $token = $user->createToken('test-token')->plainTextToken;
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonMissingPath('user.doctors')
            ->assertJsonMissingPath('user.clinics')
            ->assertJsonMissingPath('user.pharmacies')
            ->assertJsonMissingPath('user.emergency_contact');

        $this->assertSame('privacy@example.com', $response->json('user.email'));
    }

    /** @test */
    public function strict_mode_blocks_name_in_registration()
    {
        $response = $this->postJson('/api/register', $this->registerPayload([
            'name' => 'Klara Name',
            'email' => 'strict-register@example.com',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /** @test */
    public function user_can_change_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123'),
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/user/password', [
                'current_password' => 'OldPassword123',
                'new_password' => 'NewPassword123',
                'new_password_confirmation' => 'NewPassword123',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Passwort erfolgreich geändert',
            ]);

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123', $user->password));
    }

    /** @test */
    public function user_cannot_change_password_with_wrong_current_password()
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123'),
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/user/password', [
                'current_password' => 'WrongPassword123',
                'new_password' => 'NewPassword123',
                'new_password_confirmation' => 'NewPassword123',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Aktuelles Passwort ist falsch',
            ]);
    }

    /** @test */
    public function user_can_request_password_reset()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $response = $this->postJson('/api/password/forgot', [
            'email' => 'test@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);

        // In Development-Modus kann ein Token zurückgegeben werden
        // (nicht in allen Fällen, daher optional prüfen)

        // Token sollte in der Datenbank gespeichert sein
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'test@example.com',
        ]);
    }

    /** @test */
    public function password_reset_returns_success_even_if_email_does_not_exist()
    {
        // Aus Sicherheitsgründen geben wir keine Information, ob die E-Mail existiert
        $response = $this->postJson('/api/password/forgot', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);
    }

    /** @test */
    public function user_can_reset_password_with_valid_token()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => Hash::make('OldPassword123'),
        ]);

        // Erstelle Reset-Token
        $token = \Illuminate\Support\Str::random(60);
        DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/password/reset', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);

        $user->refresh();
        $this->assertTrue(Hash::check('NewPassword123', $user->password));

        // Token sollte nach Verwendung gelöscht sein
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'test@example.com',
        ]);
    }

    /** @test */
    public function user_cannot_reset_password_with_invalid_token()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        // Erstelle einen Reset-Token in der Datenbank, aber mit falschem Token
        $token = \Illuminate\Support\Str::random(60);
        DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => Hash::make('different-token'), // Anderer Token als der, den wir verwenden
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/password/reset', [
            'email' => 'test@example.com',
            'token' => $token, // Token, der nicht mit dem in der DB übereinstimmt
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        // Ungültiger Token führt zu Fehlermeldung (422)
        $response->assertStatus(422);
        // Die Validierung kann entweder Token- oder Passwort-Fehler zurückgeben, daher prüfen wir nur Status 422
    }

    /** @test */
    public function user_cannot_reset_password_with_non_existent_reset_token()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        // Kein Reset-Token in der Datenbank

        $response = $this->postJson('/api/password/reset', [
            'email' => 'test@example.com',
            'token' => 'some-token',
            'password' => 'NewPassword123',
            'password_confirmation' => 'NewPassword123',
        ]);

        $response->assertStatus(422);
        // Die Validierung kann entweder Token- oder Passwort-Fehler zurückgeben, daher prüfen wir nur Status 422
    }

    /** @test */
    public function user_cannot_reset_password_with_mismatched_passwords()
    {
        $user = User::factory()->create(['email' => 'test@example.com']);

        $token = \Illuminate\Support\Str::random(60);
        DB::table('password_reset_tokens')->insert([
            'email' => 'test@example.com',
            'token' => Hash::make($token),
            'created_at' => now(),
        ]);

        $response = $this->postJson('/api/password/reset', [
            'email' => 'test@example.com',
            'token' => $token,
            'password' => 'NewPassword123',
            'password_confirmation' => 'DifferentPassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_protected_routes()
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    /** @test */
    public function authenticated_user_can_access_user_endpoint()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'display_name',
                    'email',
                    'role',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                ],
            ]);
    }
}

