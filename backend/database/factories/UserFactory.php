<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'first_name' => 'Aysel',
            'last_name' => 'Məmmədova',
            'email' => fake()->unique()->safeEmail(),
            'phone' => '+99450'.fake()->numerify('#######'),
            'birth_date' => '1995-04-06',
            'gender' => 'female',
            'role' => 'customer',
            'provider' => 'password',
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('secret123'),
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }

    public function business(): static
    {
        return $this->state(fn () => ['role' => 'business']);
    }
}
