<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

/** Now = Monday 2026-10-12 10:00 Baku. Salon 10–20, closed Sunday; master Mon–Sat 09–18; service 60 min. */
class AvailabilityTest extends TestCase
{
    private function days(array $query, $salon): array
    {
        return $this->getJson("/api/salons/{$salon->id}/availability?".http_build_query($query))->assertOk()->json('masters.0.days');
    }

    public function test_window_is_shift_intersected_with_salon_hours_and_lead_time_applies_today(): void
    {
        $salon = $this->makeSalon();
        $service = $salon->services()->first();
        $days = $this->days(['service_ids' => [$service->id]], $salon);

        $this->assertCount(7, $days);
        // Today (Mon): 10:00 + 30 min lead → first slot 10:30; last start 17:00 (shift ends 18:00).
        $this->assertSame('2026-10-12', $days[0]['date']);
        $this->assertFalse($days[0]['off']);
        $this->assertSame(range(630, 1020, 30), $days[0]['slots']);
        // Tomorrow: from 10:00 (salon opens after the shift starts).
        $this->assertSame(range(600, 1020, 30), $days[1]['slots']);
        // Sunday 18th: salon closed.
        $this->assertSame('2026-10-18', $days[6]['date']);
        $this->assertTrue($days[6]['off']);
        $this->assertSame([], $days[6]['slots']);
    }

    public function test_master_days_off_and_booking_window(): void
    {
        $salon = $this->makeSalon(['closed_days' => []]);
        $master = $salon->masters()->first();
        $master->forceFill(['work_days' => [2]])->save(); // Tuesdays only
        $service = $salon->services()->first();

        $days = $this->days(['service_ids' => [$service->id], 'days' => 14], $salon);
        $this->assertTrue($days[0]['off']);
        $this->assertFalse($days[1]['off']);
        $this->assertNotEmpty($days[1]['slots']);
        // The 7-day window: next Tuesday (day 8) is a working day but not bookable yet.
        $this->assertFalse($days[8]['off']);
        $this->assertSame([], $days[8]['slots']);
    }

    public function test_upcoming_bookings_block_overlapping_starts(): void
    {
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $service = $salon->services()->first();
        $user = User::factory()->create();
        // Tue 13th 12:00–13:00 Baku = 08:00 UTC.
        $this->makeBooking($salon, $master, $user, '2026-10-13 08:00:00');
        $this->makeBooking($salon, $master, $user, '2026-10-13 12:00:00', ['status' => 'cancelled']);

        $slots = $this->days(['service_ids' => [$service->id], 'from' => '2026-10-13', 'days' => 1], $salon)[0]['slots'];
        // 11:30 (would end 12:30) and 12:00, 12:30 overlap; 11:00 and 13:00 are free.
        $this->assertContains(660, $slots);
        $this->assertNotContains(690, $slots);
        $this->assertNotContains(720, $slots);
        $this->assertNotContains(750, $slots);
        $this->assertContains(780, $slots);
        // Cancelled bookings don't block: 16:00 Baku free.
        $this->assertContains(960, $slots);
    }

    public function test_only_masters_doing_every_service_are_returned(): void
    {
        $salon = $this->makeSalon();
        $cut = $salon->services()->first();
        $beard = $this->makeService($salon, ['key' => 'beard', 'duration_min' => 30, 'name' => ['en' => 'Beard']]);
        $both = $this->makeMaster($salon, [$cut->id, $beard->id], ['name' => 'Both']);

        $res = $this->getJson("/api/salons/{$salon->id}/availability?".http_build_query(['service_ids' => [$cut->id, $beard->id], 'from' => '2026-10-13', 'days' => 1]))
            ->assertOk()->json('masters');
        $this->assertSame([$both->id], array_column($res, 'master_id'));
        // 90 minutes: last start 16:30.
        $this->assertSame(990, max($res[0]['days'][0]['slots']));

        $other = $salon->masters()->where('id', '!=', $both->id)->first();
        $this->getJson("/api/salons/{$salon->id}/availability?".http_build_query(['service_ids' => [$cut->id, $beard->id], 'master_id' => $other->id]))
            ->assertStatus(422)->assertJsonValidationErrors('master_id');
    }

    public function test_city_wide_slots(): void
    {
        $a = $this->makeSalon(['name' => 'A']);
        $b = $this->makeSalon(['name' => 'B', 'hours_open' => '12:00']);
        $user = User::factory()->create();
        // A's only master is busy 10:00–11:00 tomorrow.
        $this->makeBooking($a, $a->masters()->first(), $user, '2026-10-13 06:00:00');

        $res = $this->getJson('/api/slots?service_key=cut&date=2026-10-13')->assertOk()->json();
        $this->assertSame([
            ['salon_id' => $a->id, 'master_id' => $a->masters()->first()->id, 'service_id' => $a->services()->first()->id, 'start' => 660],
            ['salon_id' => $b->id, 'master_id' => $b->masters()->first()->id, 'service_id' => $b->services()->first()->id, 'start' => 720],
        ], $res);

        $this->getJson('/api/slots?service_key=cut&date=2026-10-13&from_min=800&to_min=900')
            ->assertJsonPath('0.start', 810)->assertJsonCount(2);
        $this->getJson('/api/slots?service_key=nails&date=2026-10-13')->assertExactJson([]);
        $this->getJson('/api/slots?service_key=cut&date=2026-10-25')->assertExactJson([]);
    }
}
