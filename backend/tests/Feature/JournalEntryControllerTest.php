<?php

namespace Tests\Feature;

use App\Models\JournalEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class JournalEntryControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function authenticated_user_can_create_journal_entry()
    {
        $user = $this->createAuthenticatedUser();

        $response = $this->postJson('/api/journal-entries', [
            'body' => 'Heute war ein ruhiger Tag.',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Eintrag gespeichert',
                'data' => [
                    'user_id' => $user->id,
                    'body' => 'Heute war ein ruhiger Tag.',
                ],
            ]);

        $this->assertDatabaseHas('journal_entries', [
            'user_id' => $user->id,
            'body' => 'Heute war ein ruhiger Tag.',
        ]);
    }

    /** @test */
    public function user_cannot_create_empty_journal_entry()
    {
        $this->createAuthenticatedUser();

        $response = $this->postJson('/api/journal-entries', [
            'body' => '   ',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['body']);
    }

    /** @test */
    public function authenticated_user_can_list_their_journal_entries()
    {
        $user = $this->createAuthenticatedUser();
        $other = User::factory()->create();

        JournalEntry::factory()->create([
            'user_id' => $user->id,
            'body' => 'Mein Eintrag',
        ]);
        JournalEntry::factory()->create([
            'user_id' => $other->id,
            'body' => 'Fremder Eintrag',
        ]);

        $response = $this->getJson('/api/journal-entries');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Mein Eintrag', $response->json('data.0.body'));
    }

    /** @test */
    public function authenticated_user_can_update_their_journal_entry()
    {
        $user = $this->createAuthenticatedUser();
        $entry = JournalEntry::factory()->create([
            'user_id' => $user->id,
            'body' => 'Alt',
        ]);

        $response = $this->putJson("/api/journal-entries/{$entry->id}", [
            'body' => 'Neu formuliert',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'body' => 'Neu formuliert',
                ],
            ]);
    }

    /** @test */
    public function user_cannot_update_other_users_journal_entry()
    {
        $this->createAuthenticatedUser();
        $entry = JournalEntry::factory()->create([
            'body' => 'Fremd',
        ]);

        $response = $this->putJson("/api/journal-entries/{$entry->id}", [
            'body' => 'Gehackt',
        ]);

        $response->assertStatus(404);
        $this->assertDatabaseHas('journal_entries', [
            'id' => $entry->id,
            'body' => 'Fremd',
        ]);
    }

    /** @test */
    public function authenticated_user_can_delete_their_journal_entry()
    {
        $user = $this->createAuthenticatedUser();
        $entry = JournalEntry::factory()->create([
            'user_id' => $user->id,
        ]);

        $response = $this->deleteJson("/api/journal-entries/{$entry->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('journal_entries', [
            'id' => $entry->id,
        ]);
    }

    /** @test */
    public function user_cannot_delete_other_users_journal_entry()
    {
        $this->createAuthenticatedUser();
        $entry = JournalEntry::factory()->create();

        $response = $this->deleteJson("/api/journal-entries/{$entry->id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('journal_entries', [
            'id' => $entry->id,
        ]);
    }

    /** @test */
    public function unauthenticated_user_cannot_access_journal_entries()
    {
        $response = $this->getJson('/api/journal-entries');

        $response->assertStatus(401);
    }
}
