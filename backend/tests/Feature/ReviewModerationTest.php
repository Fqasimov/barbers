<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use App\Models\User;
use Tests\TestCase;

class ReviewModerationTest extends TestCase
{
    private Business $salon;

    private Review $review;

    protected function setUp(): void
    {
        parent::setUp();
        $this->salon = $this->makeSalon();
        $author = User::factory()->create();
        $booking = $this->makeBooking($this->salon, $this->salon->masters()->first(), $author, '2026-10-10T08:00:00Z');
        $this->postJson("/api/bookings/{$booking->id}/review", ['rating' => 1, 'text' => 'Pis xidmət'], ['Authorization' => 'Bearer '.$this->tokenFor($author)])->assertStatus(201);
        $this->review = Review::query()->firstOrFail();
    }

    private function report(?User $by = null, string $reason = 'offensive')
    {
        $by ??= User::factory()->create();
        $this->app['auth']->forgetGuards();

        return $this->postJson("/api/reviews/{$this->review->id}/report", ['reason' => $reason], ['Authorization' => 'Bearer '.$this->tokenFor($by)]);
    }

    public function test_three_reports_hide_a_review_until_checked(): void
    {
        $first = User::factory()->create();
        $this->report($first)->assertOk();
        $this->report($first)->assertOk(); // the same person twice counts once
        $this->report()->assertOk();
        $this->getJson('/api/salons/'.$this->salon->id.'/reviews')->assertJsonCount(1, 'data');
        $this->assertSame(1, $this->salon->fresh()->review_count);

        $this->report()->assertOk();
        $this->getJson('/api/salons/'.$this->salon->id.'/reviews')->assertJsonCount(0, 'data');
        $this->assertSame(0, $this->salon->fresh()->review_count);

        $this->artisan('usta:reviews')->expectsOutputToContain($this->review->id)->assertSuccessful();
        $this->artisan('usta:reviews', ['--restore' => $this->review->id])->assertSuccessful();
        $this->getJson('/api/salons/'.$this->salon->id.'/reviews')->assertJsonCount(1, 'data');
        $this->assertSame(1, $this->salon->fresh()->review_count);
        $this->artisan('usta:reviews')->expectsOutputToContain('No reports waiting')->assertSuccessful();

        $this->artisan('usta:reviews', ['--hide' => $this->review->id])->assertSuccessful();
        $this->getJson('/api/salons/'.$this->salon->id.'/reviews')->assertJsonCount(0, 'data');
    }

    public function test_report_needs_an_account_and_a_reason(): void
    {
        $this->app['auth']->forgetGuards();
        $this->postJson("/api/reviews/{$this->review->id}/report", ['reason' => 'spam'])->assertStatus(401);
        $this->report(null, 'nonsense')->assertStatus(422);
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/reviews/nope/report', ['reason' => 'spam'], ['Authorization' => 'Bearer '.$this->tokenFor(User::factory()->create())])->assertStatus(404);
    }

    public function test_the_salon_replies(): void
    {
        $this->app['auth']->forgetGuards();
        $h = ['Authorization' => 'Bearer '.$this->tokenFor($this->salon->owner)];
        $this->getJson('/api/business/reviews', $h)->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.reply', null);
        $this->postJson("/api/business/reviews/{$this->review->id}/reply", ['reply' => 'Üzr istəyirik, zəng edəcəyik.'], $h)
            ->assertOk()->assertJsonPath('reply', 'Üzr istəyirik, zəng edəcəyik.');
        $this->getJson('/api/salons/'.$this->salon->id.'/reviews')->assertJsonPath('data.0.reply', 'Üzr istəyirik, zəng edəcəyik.');
        $this->postJson("/api/business/reviews/{$this->review->id}/reply", ['reply' => ''], $h)->assertOk()->assertJsonPath('reply', null);

        $other = $this->makeSalon(['name' => 'Other']);
        $this->app['auth']->forgetGuards();
        $this->postJson("/api/business/reviews/{$this->review->id}/reply", ['reply' => 'x'], ['Authorization' => 'Bearer '.$this->tokenFor($other->owner)])->assertStatus(403);
    }
}
