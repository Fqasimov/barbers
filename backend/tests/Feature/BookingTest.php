<?php

namespace Tests\Feature;

use App\Mail\BookingMail;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class BookingTest extends TestCase
{
    private User $user;

    private array $h;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->user = User::factory()->create();
        $this->h = ['Authorization' => 'Bearer '.$this->tokenFor($this->user)];
    }

    private function book($salon, array $over = [])
    {
        return $this->postJson('/api/bookings', $over + [
            'salon_id' => $salon->id,
            'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id],
            'start' => '2026-10-13T08:00:00.000Z', // Tue 12:00 Baku
            'note' => 'Qısa saxlayın',
            'total' => 1, // ignored: the server prices it
        ], $this->h);
    }

    public function test_happy_path_recomputes_price_and_notifies_the_salon(): void
    {
        $salon = $this->makeSalon();
        $beard = $this->makeService($salon, ['key' => 'beard', 'duration_min' => 30, 'price' => 15, 'name' => ['en' => 'Beard']]);
        $master = $salon->masters()->first();
        $master->services()->attach($beard->id);

        $res = $this->book($salon, ['service_ids' => [$salon->services()->first()->id, $beard->id]])
            ->assertStatus(201)
            ->assertJsonPath('salon_id', $salon->id)
            ->assertJsonPath('master_id', $master->id)
            ->assertJsonPath('duration_min', 90)
            ->assertJsonPath('total', 45)
            ->assertJsonPath('status', 'upcoming')
            ->assertJsonPath('cancelled_by', null)
            ->assertJsonPath('reviewed', false)
            ->assertJsonPath('start', '2026-10-13T08:00:00.000Z')
            ->assertJsonPath('note', 'Qısa saxlayın');
        $this->assertSame(['id', 'salon_id', 'master_id', 'service_ids', 'start', 'duration_min', 'total', 'note', 'status', 'cancelled_by', 'reviewed', 'created_at'], array_keys($res->json()));
        Mail::assertQueued(BookingMail::class, fn ($m) => $m->hasTo($salon->owner->email) && $m->kind === 'created');

        $this->getJson('/api/bookings', $this->h)->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $res->json('id'));
        $this->getJson("/api/salons/{$salon->id}/availability?".http_build_query(['service_ids' => [$beard->id], 'from' => '2026-10-13', 'days' => 1]))
            ->assertJsonMissing(['slots' => [720]]);
    }

    public function test_double_booking_gives_slot_taken(): void
    {
        $salon = $this->makeSalon();
        $this->book($salon)->assertStatus(201);
        $this->book($salon, ['start' => '2026-10-13T07:30:00.000Z'])->assertStatus(409)->assertJsonPath('error', 'slot_taken');
        $this->assertSame(1, Booking::query()->count());
    }

    public function test_master_must_do_every_service(): void
    {
        $salon = $this->makeSalon();
        $other = $this->makeService($salon, ['key' => 'shave', 'name' => ['en' => 'Shave']]);
        $this->book($salon, ['service_ids' => [$other->id]])->assertStatus(422)->assertJsonValidationErrors('master_id');
        $this->book($salon, ['service_ids' => ['nope']])->assertStatus(422)->assertJsonValidationErrors('service_ids');
    }

    public function test_start_must_be_a_real_slot(): void
    {
        $salon = $this->makeSalon();
        $this->book($salon, ['start' => '2026-10-13T08:10:00.000Z'])->assertStatus(422)->assertJsonValidationErrors('start'); // off-grid
        $this->book($salon, ['start' => '2026-10-18T08:00:00.000Z'])->assertStatus(422); // Sunday, closed
        $this->book($salon, ['start' => '2026-10-12T06:00:00.000Z'])->assertStatus(422); // now: inside the lead time
        $this->book($salon, ['start' => '2026-10-20T08:00:00.000Z'])->assertStatus(422); // beyond 7 days
        $this->book($salon, ['start' => '2026-10-13T13:30:00.000Z'])->assertStatus(422); // 17:30 + 60 > 18:00
    }

    public function test_unlisted_salon_cannot_be_booked(): void
    {
        $salon = $this->makeSalon(['status' => 'pending_review']);
        $this->book($salon)->assertStatus(404)->assertJsonPath('error', 'not_found');
    }

    public function test_cancel_until_two_hours_before(): void
    {
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $soon = $this->makeBooking($salon, $master, $this->user, now()->addMinutes(90)->toImmutable());
        $later = $this->makeBooking($salon, $master, $this->user, now()->addHours(5)->toImmutable());

        $this->postJson("/api/bookings/{$soon->id}/cancel", [], $this->h)->assertStatus(422)->assertJsonPath('error', 'too_late_to_cancel');
        $this->postJson("/api/bookings/{$later->id}/cancel", [], $this->h)->assertOk()
            ->assertJsonPath('status', 'cancelled')->assertJsonPath('cancelled_by', 'customer');

        $stranger = User::factory()->create();
        $this->app['auth']->forgetGuards();
        $this->postJson("/api/bookings/{$soon->id}/cancel", [], ['Authorization' => 'Bearer '.$this->tokenFor($stranger)])
            ->assertStatus(404);
    }

    public function test_review_once_and_only_after_the_visit(): void
    {
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $booking = $this->makeBooking($salon, $master, $this->user, '2026-10-13 08:00:00');
        $body = ['rating' => 4, 'text' => 'Əla idi', 'tags' => ['skilled', 'clean']];

        $this->postJson("/api/bookings/{$booking->id}/review", $body, $this->h)->assertStatus(422)->assertJsonPath('error', 'not_reviewable');

        $this->travelTo(now()->addDays(2));
        $this->getJson('/api/bookings', $this->h)->assertJsonPath('0.status', 'completed');
        $this->postJson("/api/bookings/{$booking->id}/review", $body, $this->h)->assertStatus(201)
            ->assertJsonPath('rating', 4)->assertJsonPath('author', 'Aysel M.')->assertJsonPath('booking_id', $booking->id)
            ->assertJsonPath('master_id', $master->id)->assertJsonPath('service_name.en', 'Cut');
        $this->postJson("/api/bookings/{$booking->id}/review", $body, $this->h)->assertStatus(422)->assertJsonPath('error', 'not_reviewable');
        $this->postJson("/api/bookings/{$booking->id}/review", ['rating' => 9, 'text' => '', 'tags' => ['bogus']], $this->h)->assertStatus(422);

        $this->getJson('/api/bookings', $this->h)->assertJsonPath('0.reviewed', true);
        $s = $this->getJson("/api/salons/{$salon->id}")->json();
        $this->assertSame(4.0, (float) $s['rating']);
        $this->assertSame(1, $s['review_count']);
        $this->assertSame([0, 1, 0, 0, 0], array_map('intval', $s['distribution']));
        $this->assertSame(1, $s['masters'][0]['review_count']);

        $cancelled = $this->makeBooking($salon, $master, $this->user, '2026-10-13 10:00:00', ['status' => 'cancelled']);
        $this->postJson("/api/bookings/{$cancelled->id}/review", $body, $this->h)->assertJsonPath('error', 'not_reviewable');
    }

    public function test_bookings_require_a_session(): void
    {
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/bookings')->assertStatus(401)->assertJsonPath('error', 'session_expired');
    }

    public function test_booking_is_rate_limited_per_user(): void
    {
        $salon = $this->makeSalon();
        for ($i = 0; $i < 10; $i++) {
            $this->book($salon, ['start' => '2026-10-14T'.sprintf('%02d', 6 + $i % 8).':00:00.000Z']);
        }
        $this->book($salon)->assertStatus(429);
    }
}
