<?php

namespace Tests\Feature;

use App\Models\SeizureCustomOption;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeizureCustomOptionControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function authenticated_user_can_add_custom_trigger()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/seizure-options', [
            'kind' => 'trigger',
            'labels' => ['Zu viel Kaffee', 'Streit'],
        ]);

        $response->assertStatus(201);
        $this->assertSame(
            ['Zu viel Kaffee', 'Streit'],
            array_column($response->json('data.triggers'), 'label')
        );
        $this->assertSame([], $response->json('data.after_effects'));

        $this->assertDatabaseHas('seizure_custom_options', [
            'user_id' => $user->id,
            'kind' => 'trigger',
            'label' => 'Streit',
        ]);
    }

    /** @test */
    public function labels_are_trimmed_and_deduplicated_case_insensitively()
    {
        $user = $this->createAuthenticatedUser();

        SeizureCustomOption::factory()->create([
            'user_id' => $user->id,
            'kind' => 'trigger',
            'label' => 'Streit',
        ]);

        $response = $this->postJson('/api/seizure-options', [
            'kind' => 'trigger',
            'labels' => ['  streit  ', 'Lärm', 'lärm'],
        ]);

        $response->assertStatus(201);
        $labels = array_column($response->json('data.triggers'), 'label');
        $this->assertContains('Lärm', $labels);
        $this->assertCount(2, $labels);
    }

    /** @test */
    public function empty_labels_are_rejected()
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/seizure-options', [
            'kind' => 'trigger',
            'labels' => ['   '],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['labels']);
    }

    /** @test */
    public function unknown_kind_is_rejected()
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/seizure-options', [
            'kind' => 'something-else',
            'labels' => ['Test'],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['kind']);
    }

    /** @test */
    public function user_only_sees_their_own_options()
    {
        $user = $this->createAuthenticatedUser();
        $other = User::factory()->create();

        SeizureCustomOption::factory()->create([
            'user_id' => $user->id,
            'kind' => 'after_effect',
            'label' => 'Kribbeln im linken Arm',
        ]);
        SeizureCustomOption::factory()->create([
            'user_id' => $other->id,
            'kind' => 'after_effect',
            'label' => 'Fremder Eintrag',
        ]);

        $response = $this->getJson('/api/seizure-options');

        $response->assertStatus(200);
        $this->assertSame(
            ['Kribbeln im linken Arm'],
            array_column($response->json('data.after_effects'), 'label')
        );
    }

    /** @test */
    public function authenticated_user_can_delete_their_option()
    {
        $user = $this->createAuthenticatedUser();
        $option = SeizureCustomOption::factory()->create([
            'user_id' => $user->id,
            'kind' => 'trigger',
            'label' => 'Streit',
        ]);

        $response = $this->deleteJson("/api/seizure-options/{$option->id}");

        $response->assertStatus(200);
        $this->assertSame([], $response->json('data.triggers'));
        $this->assertDatabaseMissing('seizure_custom_options', ['id' => $option->id]);
    }

    /** @test */
    public function user_cannot_delete_other_users_option()
    {
        $this->createAuthenticatedUser();
        $option = SeizureCustomOption::factory()->create();

        $response = $this->deleteJson("/api/seizure-options/{$option->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('seizure_custom_options', ['id' => $option->id]);
    }

    /** @test */
    public function newest_options_are_listed_first()
    {
        $user = $this->createAuthenticatedUser();

        SeizureCustomOption::factory()->create([
            'user_id' => $user->id,
            'kind' => 'trigger',
            'label' => 'Alt',
            'created_at' => now()->subDay(),
        ]);
        SeizureCustomOption::factory()->create([
            'user_id' => $user->id,
            'kind' => 'trigger',
            'label' => 'Neu',
            'created_at' => now(),
        ]);

        $response = $this->getJson('/api/seizure-options');

        $this->assertSame(
            ['Neu', 'Alt'],
            array_column($response->json('data.triggers'), 'label')
        );
    }

    /** @test */
    public function unauthenticated_user_cannot_access_options()
    {
        $this->getJson('/api/seizure-options')->assertStatus(401);
    }
}
