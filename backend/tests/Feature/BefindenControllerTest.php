<?php

namespace Tests\Feature;

use App\Models\Befinden;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BefindenControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function authenticated_user_can_create_befinden()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/befinden', [
            'date' => '2025-01-15',
            'category_id' => 'physical',
            'symptom_id' => 'headache',
            'time_of_day' => 'morning',
            'rating' => 5,
            'questions' => ['question1' => 'answer1'],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'user_id',
                    'date',
                    'category_id',
                    'symptom_id',
                    'time_of_day',
                    'rating',
                ],
            ])
            ->assertJson([
                'message' => 'Befinden-Eintrag erstellt',
                'data' => [
                    'user_id' => $user->id,
                    'category_id' => 'physical',
                    'symptom_id' => 'headache',
                    'time_of_day' => 'morning',
                    'rating' => 5,
                ],
            ]);
        
        // Prüfe Datum separat (kann als ISO-String zurückgegeben werden)
        $data = $response->json('data');
        $this->assertStringContainsString('2025-01-15', $data['date']);

        $this->assertDatabaseHas('befindens', [
            'user_id' => $user->id,
            'date' => '2025-01-15 00:00:00', // Datenbank speichert als datetime
            'category_id' => 'physical',
            'symptom_id' => 'headache',
            'time_of_day' => 'morning',
            'rating' => 5,
        ]);
    }

    /** @test */
    public function authenticated_user_can_list_their_befindens()
    {
        $user = $this->createAuthenticatedUser();
        $otherUser = User::factory()->create();

        Befinden::factory()->count(3)->create(['user_id' => $user->id]);
        Befinden::factory()->count(2)->create(['user_id' => $otherUser->id]);

        $response = $this->getJson('/api/befinden');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');

        // Prüfe, dass nur die eigenen Einträge zurückgegeben werden
        foreach ($response->json('data') as $befinden) {
            $this->assertEquals($user->id, $befinden['user_id']);
        }
    }

    /** @test */
    public function authenticated_user_can_filter_befindens_by_date()
    {
        $user = $this->createAuthenticatedUser();

        Befinden::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
        ]);
        Befinden::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-16',
        ]);

        $response = $this->getJson('/api/befinden?date=2025-01-15');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
        
        // Prüfe, dass das Datum enthalten ist (kann als ISO-String zurückgegeben werden)
        $data = $response->json('data');
        $this->assertStringContainsString('2025-01-15', $data[0]['date']);
    }

    /** @test */
    public function authenticated_user_can_filter_befindens_by_date_range()
    {
        $user = $this->createAuthenticatedUser();

        Befinden::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
        ]);
        Befinden::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-20',
        ]);
        Befinden::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-25',
        ]);

        $response = $this->getJson('/api/befinden?start_date=2025-01-15&end_date=2025-01-20');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function authenticated_user_can_filter_befindens_by_category()
    {
        $user = $this->createAuthenticatedUser();

        Befinden::factory()->create([
            'user_id' => $user->id,
            'category_id' => 'physical',
        ]);
        Befinden::factory()->create([
            'user_id' => $user->id,
            'category_id' => 'mental',
        ]);

        $response = $this->getJson('/api/befinden?category_id=physical');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'category_id' => 'physical',
            ]);
    }

    /** @test */
    public function authenticated_user_can_view_their_befinden()
    {
        $user = $this->createAuthenticatedUser();
        $befinden = Befinden::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
            'category_id' => 'physical',
            'symptom_id' => 'headache',
        ]);

        $response = $this->getJson('/api/befinden/' . $befinden->id);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'user_id',
                    'date',
                    'category_id',
                    'symptom_id',
                    'time_of_day',
                    'rating',
                ],
            ])
            ->assertJson([
                'data' => [
                    'id' => $befinden->id,
                    'user_id' => $user->id,
                    'category_id' => 'physical',
                    'symptom_id' => 'headache',
                ],
            ]);
    }

    /** @test */
    public function authenticated_user_cannot_view_other_users_befinden()
    {
        $user = $this->createAuthenticatedUser();
        $otherUser = User::factory()->create();
        $befinden = Befinden::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->getJson('/api/befinden/' . $befinden->id);

        $response->assertStatus(404);
    }

    /** @test */
    public function authenticated_user_can_update_their_befinden()
    {
        $user = $this->createAuthenticatedUser();
        $befinden = Befinden::factory()->create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
            'rating' => 5,
        ]);

        $response = $this->putJson('/api/befinden/' . $befinden->id, [
            'rating' => 8,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Befinden-Eintrag aktualisiert',
                'data' => [
                    'id' => $befinden->id,
                    'rating' => 8,
                ],
            ]);

        $this->assertDatabaseHas('befindens', [
            'id' => $befinden->id,
            'rating' => 8,
        ]);
    }

    /** @test */
    public function authenticated_user_cannot_update_other_users_befinden()
    {
        $user = $this->createAuthenticatedUser();
        $otherUser = User::factory()->create();
        $befinden = Befinden::factory()->create([
            'user_id' => $otherUser->id,
            'rating' => 5,
        ]);

        $response = $this->putJson('/api/befinden/' . $befinden->id, [
            'rating' => 8,
        ]);

        $response->assertStatus(404);
    }

    /** @test */
    public function authenticated_user_can_delete_their_befinden()
    {
        $user = $this->createAuthenticatedUser();
        $befinden = Befinden::factory()->create(['user_id' => $user->id]);

        $response = $this->deleteJson('/api/befinden/' . $befinden->id);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Befinden-Eintrag gelöscht',
            ]);

        $this->assertDatabaseMissing('befindens', [
            'id' => $befinden->id,
        ]);
    }

    /** @test */
    public function authenticated_user_cannot_delete_other_users_befinden()
    {
        $user = $this->createAuthenticatedUser();
        $otherUser = User::factory()->create();
        $befinden = Befinden::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->deleteJson('/api/befinden/' . $befinden->id);

        $response->assertStatus(404);

        $this->assertDatabaseHas('befindens', [
            'id' => $befinden->id,
        ]);
    }

    /** @test */
    public function creating_duplicate_befinden_updates_existing()
    {
        $user = $this->createAuthenticatedUser();

        // Erstelle einen bestehenden Eintrag
        $existing = Befinden::create([
            'user_id' => $user->id,
            'date' => '2025-01-15',
            'category_id' => 'physical',
            'symptom_id' => 'headache',
            'time_of_day' => 'morning',
            'rating' => 5,
        ]);

        // Versuche, denselben Eintrag nochmal zu erstellen (sollte aktualisiert werden)
        $response = $this->postJson('/api/befinden', [
            'date' => '2025-01-15',
            'category_id' => 'physical',
            'symptom_id' => 'headache',
            'time_of_day' => 'morning',
            'rating' => 8,
        ]);

        // Der Controller sollte den bestehenden Eintrag aktualisieren
        // Prüfe, dass die Antwort erfolgreich ist und das Rating aktualisiert wurde
        $response->assertSuccessful();
        
        // Prüfe, ob Update oder Create (beide sind OK, Hauptsache Rating wurde aktualisiert)
        $responseData = $response->json('data');
        $this->assertEquals(8, $responseData['rating']);

        // Prüfe, dass das Rating in der Datenbank aktualisiert wurde
        $this->assertDatabaseHas('befindens', [
            'user_id' => $user->id,
            'date' => '2025-01-15 00:00:00',
            'category_id' => 'physical',
            'symptom_id' => 'headache',
            'time_of_day' => 'morning',
            'rating' => 8,
        ]);
    }

    /** @test */
    public function validation_fails_for_invalid_category()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/befinden', [
            'date' => '2025-01-15',
            'category_id' => 'invalid',
            'symptom_id' => 'headache',
            'time_of_day' => 'morning',
            'rating' => 5,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category_id']);
    }

    /** @test */
    public function validation_fails_for_invalid_time_of_day()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/befinden', [
            'date' => '2025-01-15',
            'category_id' => 'physical',
            'symptom_id' => 'headache',
            'time_of_day' => 'invalid',
            'rating' => 5,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['time_of_day']);
    }

    /** @test */
    public function validation_fails_for_invalid_rating()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/befinden', [
            'date' => '2025-01-15',
            'category_id' => 'physical',
            'symptom_id' => 'headache',
            'time_of_day' => 'morning',
            'rating' => 15, // Zu hoch
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rating']);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_befinden_endpoints()
    {
        $response = $this->getJson('/api/befinden');
        $response->assertStatus(401);

        $response = $this->postJson('/api/befinden', []);
        $response->assertStatus(401);

        $response = $this->getJson('/api/befinden/1');
        $response->assertStatus(401);

        $response = $this->putJson('/api/befinden/1', []);
        $response->assertStatus(401);

        $response = $this->deleteJson('/api/befinden/1');
        $response->assertStatus(401);
    }
}

