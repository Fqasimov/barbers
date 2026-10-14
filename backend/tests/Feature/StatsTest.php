<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Business;
use App\Models\User;
use Tests\TestCase;

class StatsTest extends TestCase
{
    public function test_public_figures_count_only_listed_salons_and_real_visits(): void
    {
        $a = $this->makeSalon(['district' => 'Səbail', 'base_rating' => 4.8, 'base_review_count' => 10]);
        $this->makeMaster($a, [$a->services()->first()->id], ['name' => 'Elvin']);
        $this->makeSalon(['district' => 'səbail ']);
        $this->makeSalon(['district' => 'Yasamal', 'status' => Business::PENDING]);

        $client = User::factory()->create();
        $master = $a->masters()->first();
        $this->makeBooking($a, $master, $client, '2026-10-13T08:00:00Z');
        $this->makeBooking($a, $master, $client, '2026-10-13T10:00:00Z', ['status' => Booking::CANCELLED]);
        // Salon-side entries are not app bookings.
        $this->makeBooking($a, $master, $client, '2026-10-14T08:00:00Z', ['source' => 'salon', 'user_id' => null]);
        $this->makeBooking($a, $master, $client, '2026-10-15T08:00:00Z', ['kind' => Booking::BLOCK, 'user_id' => null, 'source' => 'salon']);

        $this->getJson('/api/stats')->assertOk()
            ->assertJsonPath('salons', 2)
            ->assertJsonPath('masters', 3)
            ->assertJsonPath('districts', 1)
            ->assertJsonPath('bookings', 1)
            ->assertJsonPath('clients', 1)
            ->assertJsonPath('reviews', 10)
            ->assertJsonPath('average_rating', 4.8);
    }

    public function test_empty_network(): void
    {
        $this->getJson('/api/stats')->assertOk()->assertJsonPath('salons', 0)->assertJsonPath('average_rating', null);
    }
}
