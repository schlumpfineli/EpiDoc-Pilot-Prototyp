<?php

namespace Database\Factories;

use App\Models\Befinden;
use Illuminate\Database\Eloquent\Factories\Factory;

class BefindenFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Befinden::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'date' => $this->faker->date(),
            'category_id' => $this->faker->randomElement(['physical', 'mental', 'lifestyle', 'alternative']),
            'symptom_id' => $this->faker->randomElement(['headache', 'stress', 'fatigue', 'anxiety', 'pain']),
            'time_of_day' => $this->faker->randomElement(['morning', 'noon', 'evening']),
            'rating' => $this->faker->numberBetween(0, 10),
            'questions' => $this->faker->boolean(50) ? [
                'question1' => $this->faker->sentence(),
                'question2' => $this->faker->sentence(),
            ] : null,
        ];
    }
}

