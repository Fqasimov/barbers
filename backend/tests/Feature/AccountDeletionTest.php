<?php

namespace Tests\Feature;

use App\Mail\BookingMail;
use App\Models\Booking;
use App\Models\Business;
use App\Models\PushToken;
use App\Models\Review;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AccountDeletionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    public function test_customer_deletion_cancels_upcoming_and_anonymises_history(): void
    {
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $user = User::factory()->create(['email' => 'gone@example.com']);
        $token = $this->tokenFor($user);
        PushToken::query()->create(['user_id' => $user->id, 'token' => 'ExponentPushToken[abc]', 'platform' => 'ios']);
        $upcoming = $this->makeBooking($salon, $master, $user, '2026-10-13 08:00:00');
        $past = $this->makeBooking($salon, $master, $user, '2026-10-01 08:00:00', ['status' => 'completed']);
        (new Review)->forceFill(['business_id' => $salon->id, 'user_id' => $user->id, 'booking_id' => $past->id, 'author' => 'Aysel M.', 'rating' => 5, 'text' => 'ok'])->save();
        $h = ['Authorization' => "Bearer {$token}"];

        $this->deleteJson('/api/me', ['password' => 'wrong123'], $h)->assertStatus(422);
        $this->deleteJson('/api/me', [], $h)->assertStatus(422)->assertJsonValidationErrors('password');
        $this->deleteJson('/api/me', ['password' => 'secret123'], $h)->assertNoContent();

        $this->assertNull(User::query()->find($user->id));
        $this->assertDatabaseMissing('users', ['email' => 'gone@example.com']);
        $this->assertSame(0, PushToken::query()->count());
        $this->assertDatabaseCount('personal_access_tokens', 0);

        $upcoming->refresh();
        $this->assertSame('cancelled', $upcoming->status);
        $this->assertSame('customer', $upcoming->cancelled_by);
        $this->assertNull($upcoming->user_id);
        $this->assertNotNull($past->fresh());
        $this->assertSame('İstifadəçi', Review::query()->first()->author);

        $ownerH = ['Authorization' => 'Bearer '.$this->tokenFor($salon->owner)];
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/business/bookings?from=2026-10-01&to=2026-10-20', $ownerH)
            ->assertJsonPath('0.client', ['name' => 'Deleted user', 'phone' => '']);

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me', $h)->assertStatus(401);
    }

    public function test_social_accounts_delete_without_a_password(): void
    {
        $user = User::factory()->create(['password' => null, 'provider' => 'google']);
        $this->deleteJson('/api/me', [], ['Authorization' => 'Bearer '.$this->tokenFor($user)])->assertNoContent();
        $this->assertSame(0, User::query()->count());
    }

    public function test_owner_deletion_unpublishes_salon_cancels_future_bookings_and_removes_photos(): void
    {
        Storage::fake('public');
        $salon = $this->makeSalon();
        $owner = $salon->owner;
        $h = ['Authorization' => 'Bearer '.$this->tokenFor($owner)];
        $photoUrl = $this->post('/api/business/photos', ['photo' => UploadedFile::fake()->image('a.jpg', 100, 100)], $h)->assertStatus(201)->json('url');
        $this->assertNotEmpty(Storage::disk('public')->allFiles());

        $customer = User::factory()->create();
        $future = $this->makeBooking($salon, $salon->masters()->first(), $customer, '2026-10-13 08:00:00');
        $past = $this->makeBooking($salon, $salon->masters()->first(), $customer, '2026-10-01 08:00:00');

        $this->deleteJson('/api/me', ['password' => 'secret123'], $h)->assertNoContent();

        $this->assertSame([], Storage::disk('public')->allFiles());
        $this->assertNull(Business::query()->find($salon->id));
        $this->getJson("/api/salons/{$salon->id}")->assertStatus(404);
        $this->assertSame('cancelled', $future->fresh()->status);
        $this->assertSame('salon', $future->fresh()->cancelled_by);
        $this->assertSame('upcoming', $past->fresh()->status);
        Mail::assertQueued(BookingMail::class, fn ($m) => $m->hasTo($customer->email) && $m->kind === 'cancelled_by_salon');

        // The customer still sees the booking history.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/bookings', ['Authorization' => 'Bearer '.$this->tokenFor($customer)])->assertJsonCount(2);
        $this->assertNotNull($photoUrl);
        $this->assertSame(2, Booking::query()->count());
    }
}
