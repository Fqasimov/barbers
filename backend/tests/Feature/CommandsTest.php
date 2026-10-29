<?php

namespace Tests\Feature;

use App\Jobs\SendPush;
use App\Mail\TrialEndingMail;
use App\Models\Business;
use App\Models\Subscription;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class CommandsTest extends TestCase
{
    public function test_reminders_are_sent_once_each(): void
    {
        Bus::fake([SendPush::class]);
        $salon = $this->makeSalon();
        $user = User::factory()->create();
        $this->travelTo(now()->subDays(3));
        $booking = $this->makeBooking($salon, $salon->masters()->first(), $user, '2026-10-13 08:00:00');
        $this->travelBack();
        $this->travelTo(CarbonImmutable::parse(self::NOW, 'UTC'));

        // 26 h before: nothing yet.
        $this->artisan('usta:send-reminders')->assertSuccessful();
        Bus::assertNotDispatched(SendPush::class);

        $this->travelTo(CarbonImmutable::parse('2026-10-12 09:00:00', 'UTC')); // 23 h before
        $this->artisan('usta:send-reminders');
        $this->artisan('usta:send-reminders');
        Bus::assertDispatchedTimes(SendPush::class, 1);
        $this->assertNotNull($booking->fresh()->reminded_24h_at);

        $this->travelTo(CarbonImmutable::parse('2026-10-13 06:30:00', 'UTC')); // 1.5 h before
        $this->artisan('usta:send-reminders');
        $this->artisan('usta:send-reminders');
        Bus::assertDispatchedTimes(SendPush::class, 2);
        $this->assertNotNull($booking->fresh()->reminded_2h_at);
    }

    public function test_subscriptions_expire_after_a_7_day_grace(): void
    {
        $trial = $this->makeSalon(['name' => 'Trial'])->subscription;
        $trial->forceFill(['trial_ends_at' => now()->subMinute()])->save();
        $oldTrial = $this->makeSalon(['name' => 'Old trial'])->subscription;
        $oldTrial->forceFill(['trial_ends_at' => now()->subDays(8)])->save();
        $active = $this->makeSalon(['name' => 'Paid'], subscription: Subscription::ACTIVE)->subscription;
        $active->forceFill(['current_period_end' => now()->subDay()])->save();
        $old = $this->makeSalon(['name' => 'Old'], subscription: Subscription::ACTIVE)->subscription;
        $old->forceFill(['current_period_end' => now()->subDays(8)])->save();
        $ok = $this->makeSalon(['name' => 'Fine'], subscription: Subscription::ACTIVE)->subscription;

        $this->artisan('usta:expire-subscriptions')->assertSuccessful();

        $this->assertSame('past_due', $trial->fresh()->status);
        $this->assertSame('expired', $oldTrial->fresh()->status);
        $this->assertSame('past_due', $active->fresh()->status);
        $this->assertSame('expired', $old->fresh()->status);
        $this->assertSame('active', $ok->fresh()->status);

        $this->travel(6)->days();
        $this->artisan('usta:expire-subscriptions');
        $this->assertSame('past_due', $trial->fresh()->status);
        $this->assertSame('expired', $active->fresh()->status);

        $this->travel(1)->days();
        $this->artisan('usta:expire-subscriptions');
        $this->assertSame('expired', $trial->fresh()->status);
    }

    public function test_an_unpaid_trial_stays_bookable_for_the_grace_then_hides(): void
    {
        Mail::fake();
        $salon = $this->makeSalon();
        $salon->subscription->forceFill(['trial_ends_at' => now()->subDays(6)])->save();
        $customer = User::factory()->create();
        $h = ['Authorization' => 'Bearer '.$this->tokenFor($customer)];
        $book = fn (string $start) => $this->postJson('/api/bookings', [
            'salon_id' => $salon->id,
            'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id],
            'start' => $start,
        ], $h);

        $this->artisan('usta:expire-subscriptions');
        $this->assertSame('past_due', $salon->subscription->fresh()->status);
        $this->getJson('/api/salons')->assertJsonCount(1);
        $booked = $book('2026-10-13T08:00:00.000Z')->assertStatus(201)->json('id');

        // Day 7 after the trial: hidden, no new bookings, the old one stays.
        $this->travel(1)->days();
        $this->getJson('/api/salons')->assertJsonCount(0);
        $this->getJson("/api/salons/{$salon->id}")->assertNotFound();
        $book('2026-10-13T10:00:00.000Z')->assertNotFound();
        $this->getJson('/api/bookings', $h)->assertOk()->assertJsonPath('0.id', $booked)->assertJsonPath('0.status', 'upcoming');
    }

    public function test_trial_ending_emails_and_pushes(): void
    {
        Mail::fake();
        Bus::fake([SendPush::class]);
        $salon = $this->makeSalon();
        $salon->subscription->forceFill(['trial_ends_at' => now()->addDays(3)])->save();

        $this->artisan('usta:trial-reminders');
        $this->artisan('usta:trial-reminders');
        Mail::assertQueuedCount(1);
        Mail::assertQueued(TrialEndingMail::class, fn ($m) => $m->hasTo($salon->owner->email) && $m->daysLeft === 3
            && $m->endsOn === '15.10.2026' && $m->hiddenOn === '22.10.2026');
        Bus::assertDispatched(SendPush::class, fn ($p) => $p->userId === $salon->owner_id
            && $p->data['type'] === 'trial_ending' && $p->data['url'] === '/business' && ! str_contains($p->body, '₼'));

        $this->travel(3)->days();
        $this->artisan('usta:trial-reminders');
        Mail::assertQueued(TrialEndingMail::class, fn ($m) => $m->daysLeft === 0);
        Mail::assertQueuedCount(2);
        Bus::assertDispatchedTimes(SendPush::class, 2);
    }

    public function test_admin_approve_and_suspend(): void
    {
        $salon = $this->makeSalon(['status' => Business::PENDING]);
        $this->artisan('usta:approve-business', ['id' => $salon->id])->assertSuccessful();
        $this->assertSame('live', $salon->fresh()->status);
        $this->getJson('/api/salons')->assertJsonCount(1);

        $this->artisan('usta:suspend-business', ['id' => $salon->id])->assertSuccessful();
        $this->assertSame('suspended', $salon->fresh()->status);
        $this->getJson('/api/salons')->assertJsonCount(0);
        $this->artisan('usta:approve-business', ['id' => 'nope'])->assertFailed();
    }

    public function test_create_user_reads_the_password_from_a_prompt(): void
    {
        $this->artisan('usta:create-user')
            ->expectsQuestion('Email', 'faiq.farid0604@gmail.com')
            ->expectsQuestion('First name', 'Faiq')
            ->expectsQuestion('Last name', 'Farid')
            ->expectsQuestion('Password (8–64 characters, a letter and a digit)', 'demoPass123')
            ->expectsQuestion('Repeat the password', 'demoPass123')
            ->assertSuccessful();

        $user = User::query()->where('email', 'faiq.farid0604@gmail.com')->first();
        $this->assertTrue($user->isVerified());
        $this->assertTrue(Hash::check('demoPass123', $user->password));
        $this->postJson('/api/auth/login', ['email' => 'faiq.farid0604@gmail.com', 'password' => 'demoPass123'])->assertOk();
    }
}
