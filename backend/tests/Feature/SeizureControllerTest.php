<?php

namespace Tests\Feature;

use App\Models\Seizure;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeizureControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function authenticated_user_can_create_seizure()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/seizures', [
            'date' => '2025-01-15',
            'type' => ['tonic-clonic'],
            'seizure_count' => 1,
            'duration_minutes' => 5,
            'duration_seconds' => 30,
            'felt_before' => 'Test warning',
            'felt_symptoms' => 'Test symptoms',
            'after_effects' => ['confusion', 'tiredness'],
            'triggers' => ['stress'],
            'emergency_med' => true,
            'emergency_med_name' => 'Test Medication',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'user_id',
                    'date',
                    'type',
                    'seizure_count',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'user_id',
                    'date',
                    'seizure_count',
                ],
            ])
            ->assertJson([
                'message' => 'Anfall-Eintrag erstellt',
                'data' => [
                    'user_id' => $user->id,
                    'seizure_count' => 1,
                ],
            ]);
        
        // Prüfe Datum separat (Carbon wird als ISO-String serialisiert)
        $responseData = $response->json('data');
        $this->assertStringContainsString('2025-01-15', $responseData['date']);

        $this->assertDatabaseHas('seizures', [
            'user_id' => $user->id,
            'seizure_count' => 1,
        ]);
        
        // Prüfe Datum separat
        $seizure = Seizure::where('user_id', $user->id)->first();
        $this->assertEquals('2025-01-15', $seizure->date->format('Y-m-d'));
    }

    /** @test */
    public function user_cannot_create_seizure_without_date()
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/seizures', [
            'seizure_count' => 1,
            'emergency_med' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['date']);
    }

    /** @test */
    public function user_cannot_create_seizure_without_seizure_count()
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/seizures', [
            'date' => '2025-01-15',
            'emergency_med' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['seizure_count']);
    }

    /** @test */
    public function user_cannot_create_seizure_with_invalid_seizure_count()
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/seizures', [
            'date' => '2025-01-15',
            'seizure_count' => 0, // Muss mindestens 1 sein
            'emergency_med' => false,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['seizure_count']);
    }

    /** @test */
    public function user_cannot_create_seizure_with_emergency_med_without_name()
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/seizures', [
            'date' => '2025-01-15',
            'seizure_count' => 1,
            'emergency_med' => true,
            // emergency_med_name fehlt
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['emergency_med_name']);
    }

    /** @test */
    public function authenticated_user_can_list_their_seizures()
    {
        $user = $this->createAuthenticatedUser();
        
        // Erstelle einige Seizures für diesen User
        Seizure::factory()->count(3)->create(['user_id' => $user->id]);
        
        // Erstelle Seizures für einen anderen User (sollten nicht erscheinen)
        $otherUser = User::factory()->create();
        Seizure::factory()->count(2)->create(['user_id' => $otherUser->id]);

        $response = $this->getJson('/api/seizures');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'user_id',
                        'date',
                        'seizure_count',
                        'created_at',
                        'updated_at',
                    ],
                ],
            ]);

        // Sollte nur die Seizures des authentifizierten Users zurückgeben
        $this->assertCount(3, $response->json('data'));
        foreach ($response->json('data') as $seizure) {
            $this->assertEquals($user->id, $seizure['user_id']);
        }
    }

    /** @test */
    public function authenticated_user_can_filter_seizures_by_date()
    {
        $user = $this->createAuthenticatedUser();
        
        Seizure::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
        ]);
        
        Seizure::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-20',
        ]);

        $response = $this->getJson('/api/seizures?date=2025-01-15');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertStringContainsString('2025-01-15', $response->json('data.0.date'));
    }

    /** @test */
    public function authenticated_user_can_filter_seizures_by_date_range()
    {
        $user = $this->createAuthenticatedUser();
        
        Seizure::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-10',
        ]);
        
        Seizure::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
        ]);
        
        Seizure::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-25',
        ]);

        $response = $this->getJson('/api/seizures?start_date=2025-01-12&end_date=2025-01-20');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertStringContainsString('2025-01-15', $response->json('data.0.date'));
    }

    /** @test */
    public function authenticated_user_can_view_single_seizure()
    {
        $user = $this->createAuthenticatedUser();
        
        $seizure = Seizure::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
            'seizure_count' => 2,
        ]);

        $response = $this->getJson("/api/seizures/{$seizure->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'user_id',
                    'date',
                    'seizure_count',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'user_id',
                    'date',
                    'seizure_count',
                ],
            ]);
        
        // Prüfe spezifische Werte separat
        $responseData = $response->json('data');
        $this->assertEquals($seizure->id, $responseData['id']);
        $this->assertEquals($user->id, $responseData['user_id']);
        $this->assertEquals('2025-01-15', substr($responseData['date'], 0, 10)); // Nur Datum ohne Zeit
        $this->assertEquals(2, $responseData['seizure_count']);
    }

    /** @test */
    public function user_cannot_view_other_users_seizure()
    {
        $user = $this->createAuthenticatedUser();
        $otherUser = User::factory()->create();
        
        $seizure = Seizure::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->getJson("/api/seizures/{$seizure->id}");

        $response->assertStatus(404);
    }

    /** @test */
    public function authenticated_user_can_update_their_seizure()
    {
        $user = $this->createAuthenticatedUser();
        
        $seizure = Seizure::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
            'seizure_count' => 1,
        ]);

        $response = $this->putJson("/api/seizures/{$seizure->id}", [
            'date' => '2025-01-16',
            'seizure_count' => 2,
            'duration_minutes' => 10,
            'emergency_med' => false,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Anfall-Eintrag aktualisiert',
            ])
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'user_id',
                    'date',
                    'seizure_count',
                ],
            ]);

        $this->assertDatabaseHas('seizures', [
            'id' => $seizure->id,
            'seizure_count' => 2,
            'duration_minutes' => 10,
        ]);
        
        // Prüfe Datum separat
        $seizure->refresh();
        $this->assertEquals('2025-01-16', $seizure->date->format('Y-m-d'));
    }

    /** @test */
    public function user_cannot_update_other_users_seizure()
    {
        $user = $this->createAuthenticatedUser();
        $otherUser = User::factory()->create();
        
        $seizure = Seizure::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->putJson("/api/seizures/{$seizure->id}", [
            'seizure_count' => 2,
            'emergency_med' => false,
        ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function authenticated_user_can_delete_their_seizure()
    {
        $user = $this->createAuthenticatedUser();
        
        $seizure = Seizure::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->deleteJson("/api/seizures/{$seizure->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Anfall-Eintrag gelöscht',
            ]);

        $this->assertDatabaseMissing('seizures', [
            'id' => $seizure->id,
        ]);
    }

    /** @test */
    public function user_cannot_delete_other_users_seizure()
    {
        $user = $this->createAuthenticatedUser();
        $otherUser = User::factory()->create();
        
        $seizure = Seizure::factory()->create([
            'user_id' => $otherUser->id,
        ]);

        $response = $this->deleteJson("/api/seizures/{$seizure->id}");

        $response->assertStatus(404);

        // Seizure sollte noch existieren
        $this->assertDatabaseHas('seizures', [
            'id' => $seizure->id,
        ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_seizures()
    {
        $response = $this->getJson('/api/seizures');

        $response->assertStatus(401);
    }
}

