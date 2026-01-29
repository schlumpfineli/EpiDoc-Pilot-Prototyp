<?php

namespace Database\Factories;

use App\Models\Seizure;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Seizure>
 */
class SeizureFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<\Illuminate\Database\Eloquent\Model>
     */
    protected $model = Seizure::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date' => fake()->dateTimeBetween('-30 days', 'now')->format('Y-m-d'),
            'type' => [fake()->randomElement(['tonic-clonic', 'absence', 'focal', 'myoclonic'])],
            'custom_type' => null,
            'felt_before' => fake()->optional()->sentence(),
            'felt_symptoms' => fake()->optional()->sentence(),
            'seizure_count' => fake()->numberBetween(1, 5),
            'duration_minutes' => fake()->numberBetween(1, 30),
            'duration_seconds' => fake()->numberBetween(0, 59),
            'after_effects' => fake()->optional()->randomElements(['confusion', 'tiredness', 'headache', 'muscle_ache'], 2),
            'custom_after_effects' => null,
            'triggers' => fake()->optional()->randomElements(['stress', 'lack_of_sleep', 'alcohol', 'flashing_lights'], 2),
            'custom_triggers' => null,
            'emergency_med' => fake()->boolean(30), // 30% chance
            'emergency_med_name' => fake()->optional()->randomElement(['Diazepam', 'Lorazepam', 'Midazolam']),
            'video_path' => null,
        ];
    }
}

