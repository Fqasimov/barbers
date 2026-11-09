<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Booking;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Per-day opening hours and schedules, logos and master photos, the staff cabinet
 * (check-in / check-out), attendance for the owner, and where bookings came from.
 * Now = Monday 2026-10-12 10:00 Baku. Salon 10–20, closed Sunday; master Mon–Sat 09–18; service 60 min.
 */
class StaffCabinetTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    public function json($method, $uri, array $data = [], array $headers = [], $options = 0)
    {
        $this->app['auth']->forgetGuards();

        return parent::json($method, $uri, $data, $headers, $options);
    }

    private function auth(User $u): array
    {
        return ['Authorization' => 'Bearer '.$this->tokenFor($u)];
    }

    private function days($salon): array
    {
        $service = $salon->services()->first();

        return $this->getJson("/api/salons/{$salon->id}/availability?".http_build_query(['service_ids' => [$service->id]]))
            ->assertOk()->json('masters.0.days');
    }

    private function week(array $byDay, string $a = 'open', string $b = 'close'): array
    {
        return array_map(fn ($d) => isset($byDay[$d]) ? [$a => $byDay[$d][0], $b => $byDay[$d][1]] : null, range(0, 6));
    }

    public function test_opening_hours_can_differ_per_day_and_bookings_follow_them(): void
    {
        $salon = $this->makeSalon();
        $h = $this->auth($salon->owner);
        // Mon 10–14, Tue 12–20, Wed–Sat 10–20, Sun closed.
        $week = $this->week([1 => ['10:00', '14:00'], 2 => ['12:00', '20:00'], 3 => ['10:00', '20:00'], 4 => ['10:00', '20:00'], 5 => ['10:00', '20:00'], 6 => ['10:00', '20:00']]);

        $res = $this->patchJson('/api/business', ['hours_week' => $week], $h)->assertOk();
        $this->assertSame($week, $res->json('hours_week'));
        // The single pair stays in step for older app versions.
        $this->assertSame([0], $res->json('closed_days'));
        $this->assertSame(['open' => '10:00', 'close' => '20:00'], $res->json('hours'));

        $days = $this->days($salon->fresh());
        // Monday: 10:30 (lead) … last start 13:00 (closes 14:00).
        $this->assertSame(range(630, 780, 30), $days[0]['slots']);
        // Tuesday: from 12:00 to the shift end 18:00 → last start 17:00.
        $this->assertSame(range(720, 1020, 30), $days[1]['slots']);
        $this->assertTrue($days[6]['off']);

        // A day must end after it starts.
        $bad = $week;
        $bad[3] = ['open' => '18:00', 'close' => '09:00'];
        $this->patchJson('/api/business', ['hours_week' => $bad], $h)->assertStatus(422);
        // Seven days exactly.
        $this->patchJson('/api/business', ['hours_week' => array_slice($week, 0, 6)], $h)->assertStatus(422);

        // Setting the old single pair again replaces the per-day hours.
        $this->patchJson('/api/business', ['hours' => ['open' => '09:00', 'close' => '21:00']], $h)->assertOk()
            ->assertJsonPath('hours_week.1', ['open' => '09:00', 'close' => '21:00']);
    }

    public function test_masters_have_a_weekly_schedule(): void
    {
        $salon = $this->makeSalon(['closed_days' => []]);
        $master = $salon->masters()->first();
        $h = $this->auth($salon->owner);
        // Mon 15–18, Tue off, the rest 09–18.
        $schedule = $this->week([0 => ['09:00', '18:00'], 1 => ['15:00', '18:00'], 3 => ['09:00', '18:00'], 4 => ['09:00', '18:00'], 5 => ['09:00', '18:00'], 6 => ['09:00', '18:00']], 'start', 'end');

        $res = $this->patchJson("/api/business/masters/{$master->id}", ['schedule' => $schedule], $h)->assertOk();
        $this->assertSame($schedule, $res->json('schedule'));
        $this->assertSame([0, 1, 3, 4, 5, 6], $res->json('work_days'));

        $days = $this->days($salon->fresh());
        $this->assertSame(range(900, 1020, 30), $days[0]['slots']);
        $this->assertTrue($days[1]['off']);

        // New masters can be created with a schedule alone.
        $this->postJson('/api/business/masters', [
            'name' => 'Leyla', 'role' => ['az' => 'Stilist'], 'schedule' => $schedule,
        ], $h)->assertStatus(201)->assertJsonPath('schedule.1', ['start' => '15:00', 'end' => '18:00']);
    }

    public function test_logo_and_master_photos(): void
    {
        Storage::fake('public');
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $h = $this->auth($salon->owner);

        $logo = $this->post('/api/business/logo', ['photo' => UploadedFile::fake()->image('logo.png', 400, 400)], $h + ['Accept' => 'application/json'])
            ->assertOk()->json('logo_url');
        $this->assertNotNull($logo);
        $this->getJson("/api/salons/{$salon->id}")->assertJsonPath('logo_url', $logo);
        $this->deleteJson('/api/business/logo', [], $h)->assertOk()->assertJsonPath('logo_url', null);

        $photo = $this->post("/api/business/masters/{$master->id}/photo", ['photo' => UploadedFile::fake()->image('m.jpg', 300, 400)], $h + ['Accept' => 'application/json'])
            ->assertOk()->json('photo_url');
        $this->assertNotNull($photo);
        $this->post("/api/business/masters/{$master->id}/photo", ['photo' => UploadedFile::fake()->create('x.pdf', 10, 'application/pdf')], $h + ['Accept' => 'application/json'])
            ->assertStatus(422);
        $this->deleteJson("/api/business/masters/{$master->id}/photo", [], $h)->assertOk()->assertJsonPath('photo_url', null);

        // Someone else's master: forbidden.
        $other = $this->makeSalon();
        $this->post("/api/business/masters/{$other->masters()->first()->id}/photo", ['photo' => UploadedFile::fake()->image('m.jpg')], $h + ['Accept' => 'application/json'])
            ->assertStatus(403);
    }

    public function test_staff_check_in_and_out_in_their_own_cabinet(): void
    {
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $owner = $this->auth($salon->owner);
        $staff = User::factory()->create(['email' => 'usta@example.com']);
        $h = $this->auth($staff);

        // Not invited yet: no cabinet.
        $this->getJson('/api/staff/me', $h)->assertStatus(403);

        $this->postJson('/api/business/team', ['email' => 'usta@example.com', 'role' => 'staff', 'master_id' => $master->id], $owner)
            ->assertStatus(201)->assertJsonPath('role', 'staff')->assertJsonPath('master_id', $master->id)->assertJsonPath('accepted', true);
        // One cabinet per master.
        $this->postJson('/api/business/team', ['email' => 'other@example.com', 'role' => 'staff', 'master_id' => $master->id], $owner)
            ->assertStatus(422)->assertJsonPath('error', 'master_taken');
        // A master of another salon can't be linked.
        $this->postJson('/api/business/team', ['email' => 'x@example.com', 'role' => 'staff', 'master_id' => $this->makeSalon()->masters()->first()->id], $owner)
            ->assertStatus(404);

        // The session says where to go; staff never get the salon panel.
        $this->getJson('/api/me', $h)->assertOk()->assertJsonPath('staff.master_id', $master->id)->assertJsonPath('business', null);
        $this->getJson('/api/business', $h)->assertStatus(403);

        $me = $this->getJson('/api/staff/me', $h)->assertOk();
        $me->assertJsonPath('checked_in', false)->assertJsonPath('master.id', $master->id)->assertJsonPath('salon.id', $salon->id);

        // 10:20 Baku: 80 minutes after a 09:00 shift start → late.
        $this->travel(20)->minutes();
        $in = $this->postJson('/api/staff/check-in', [], $h)->assertStatus(201);
        $this->assertSame(80, $in->json('late_minutes'));
        $this->postJson('/api/staff/check-in', [], $h)->assertStatus(409)->assertJsonPath('error', 'already_checked_in');
        $this->getJson('/api/staff/me', $h)->assertJsonPath('checked_in', true);

        $this->travel(8)->hours();
        $out = $this->postJson('/api/staff/check-out', [], $h)->assertOk();
        $this->assertSame(480, $out->json('minutes'));
        $this->postJson('/api/staff/check-out', [], $h)->assertStatus(409)->assertJsonPath('error', 'not_checked_in');

        // The owner sees it.
        $att = $this->getJson('/api/business/attendance', $owner)->assertOk();
        $att->assertJsonPath('rows.0.master_id', $master->id)->assertJsonPath('rows.0.minutes', 480);
        $this->assertSame(1, collect($att->json('by_master'))->firstWhere('master_id', $master->id)['late']);
        $this->assertSame(1, Attendance::query()->count());

        // Removing the team member closes the cabinet.
        $id = $this->getJson('/api/business/team', $owner)->json('0.id');
        $this->deleteJson("/api/business/team/{$id}", [], $owner)->assertNoContent();
        $this->getJson('/api/staff/me', $h)->assertStatus(403);
    }

    public function test_statistics_by_channel_for_owner_and_for_each_master(): void
    {
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $service = $salon->services()->first();
        $owner = $this->auth($salon->owner);
        $client = User::factory()->create();

        foreach ([['2026-10-13T08:00:00.000Z', 'web'], ['2026-10-13T10:00:00.000Z', 'ios'], ['2026-10-14T08:00:00.000Z', null]] as [$start, $platform]) {
            $this->postJson('/api/bookings', [
                'salon_id' => $salon->id, 'master_id' => $master->id, 'service_ids' => [$service->id], 'start' => $start,
            ], $this->auth($client) + ($platform ? ['X-Platform' => $platform] : []))->assertStatus(201);
        }
        $this->assertSame(['web', 'ios', null], Booking::query()->orderBy('start_at')->pluck('channel')->all());

        $this->travelTo(CarbonImmutable::parse('2026-10-20 06:00:00', 'UTC'));
        $stats = $this->getJson('/api/business/stats', $owner)->assertOk()->json();
        $this->assertSame(1, $stats['totals']['from_web']);
        $this->assertSame(1, $stats['totals']['from_phone']);
        $byChannel = collect($stats['by_channel'])->keyBy('id');
        $this->assertSame(1, $byChannel['web']['bookings']);
        $this->assertSame(1, $byChannel['phone']['bookings']);
        $this->assertSame(3 * $service->price, $stats['totals']['revenue']);

        // A master's own numbers, in their cabinet.
        $staff = User::factory()->create(['email' => 'usta@example.com']);
        $this->postJson('/api/business/team', ['email' => 'usta@example.com', 'role' => 'staff', 'master_id' => $master->id], $owner)->assertStatus(201);
        $mine = $this->getJson('/api/staff/stats?from=2026-10-01&to=2026-10-31', $this->auth($staff))->assertOk()->json();
        $this->assertSame(3, $mine['totals']['bookings']);
        $this->assertSame(1, $mine['totals']['clients']);
    }
}
