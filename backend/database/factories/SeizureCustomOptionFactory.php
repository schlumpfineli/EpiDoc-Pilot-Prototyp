<?php

namespace Database\Factories;

use App\Models\SeizureCustomOption;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SeizureCustomOption>
 */
class SeizureCustomOptionFactory extends Factory
{
    protected $model = SeizureCustomOption::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'kind' => fake()->randomElement(SeizureCustomOption::KINDS),
            'label' => fake()->unique()->words(2, true),
        ];
    }
}
