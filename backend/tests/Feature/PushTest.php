<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\PushToken;
use App\Models\User;
use App\Services\ExpoPush;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PushTest extends TestCase
{
    public function test_push_tokens_upsert_and_delete(): void
    {
        $a = User::factory()->create();
        $b = User::factory()->create();
        $ha = ['Authorization' => 'Bearer '.$this->tokenFor($a)];
        $hb = ['Authorization' => 'Bearer '.$this->tokenFor($b)];
        $t = 'ExponentPushToken[xyz]';

        $this->postJson('/api/me/push-tokens', ['token' => $t, 'platform' => 'ios'], $ha)->assertNoContent();
        $this->postJson('/api/me/push-tokens', ['token' => $t, 'platform' => 'ios'], $ha)->assertNoContent();
        $this->assertSame(1, PushToken::query()->count());

        // The same device signs in as someone else: one row, new owner.
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/me/push-tokens', ['token' => $t, 'platform' => 'android'], $hb)->assertNoContent();
        $this->assertSame(1, PushToken::query()->count());
        $this->assertSame($b->id, PushToken::query()->first()->user_id);
        $this->postJson('/api/me/push-tokens', ['token' => $t, 'platform' => 'web'], $hb)->assertStatus(422);

        $this->app['auth']->forgetGuards();
        $this->deleteJson('/api/me/push-tokens', ['token' => $t], $ha)->assertNoContent();
        $this->assertSame(1, PushToken::query()->count()); // not a's token any more
        $this->app['auth']->forgetGuards();
        $this->deleteJson('/api/me/push-tokens', ['token' => $t], $hb)->assertNoContent();
        $this->assertSame(0, PushToken::query()->count());
    }

    public function test_expo_push_chunks_and_drops_dead_tokens(): void
    {
        $user = User::factory()->create();
        $tokens = [];
        for ($i = 0; $i < 150; $i++) {
            $tokens[] = "ExponentPushToken[{$i}]";
            PushToken::query()->create(['user_id' => $user->id, 'token' => "ExponentPushToken[{$i}]", 'platform' => 'ios']);
        }
        Http::fake(['exp.host/*' => function (Request $req) {
            $data = array_map(fn ($m) => $m['to'] === 'ExponentPushToken[3]' || $m['to'] === 'ExponentPushToken[120]'
                ? ['status' => 'error', 'message' => 'gone', 'details' => ['error' => 'DeviceNotRegistered']]
                : ['status' => 'ok', 'id' => 'x'], $req->data());

            return Http::response(['data' => $data]);
        }]);

        app(ExpoPush::class)->send($tokens, 'Hi', 'There', ['booking_id' => 'b1']);

        Http::assertSentCount(2);
        Http::assertSent(fn (Request $r) => $r->url() === 'https://exp.host/--/api/v2/push/send' && count($r->data()) === 100);
        $this->assertSame(148, PushToken::query()->count());
        $this->assertNull(PushToken::query()->where('token', 'ExponentPushToken[3]')->first());
    }

    public function test_booking_creation_pushes_to_the_salon_owner(): void
    {
        $salon = $this->makeSalon();
        PushToken::query()->create(['user_id' => $salon->owner_id, 'token' => 'ExponentPushToken[owner]', 'platform' => 'android']);
        Http::fake(['exp.host/*' => Http::response(['data' => [['status' => 'ok']]])]);
        $customer = User::factory()->create();

        $this->postJson('/api/bookings', [
            'salon_id' => $salon->id, 'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id], 'start' => '2026-10-13T08:00:00Z',
        ], ['Authorization' => 'Bearer '.$this->tokenFor($customer)])->assertStatus(201);

        Http::assertSent(fn (Request $r) => $r[0]['to'] === 'ExponentPushToken[owner]' && str_contains($r[0]['body'], '13.10.2026 12:00'));
    }

    public function test_every_push_carries_the_in_app_url_channel_and_sound(): void
    {
        Mail::fake();
        $salon = $this->makeSalon();
        $customer = User::factory()->create();
        PushToken::query()->create(['user_id' => $salon->owner_id, 'token' => 'ExponentPushToken[owner]', 'platform' => 'android']);
        PushToken::query()->create(['user_id' => $customer->id, 'token' => 'ExponentPushToken[customer]', 'platform' => 'ios']);
        $sent = [];
        Http::fake(['exp.host/*' => function (Request $r) use (&$sent) {
            foreach ($r->data() as $m) {
                $sent[] = $m;
            }

            return Http::response(['data' => [['status' => 'ok']]]);
        }]);
        $ch = ['Authorization' => 'Bearer '.$this->tokenFor($customer)];
        $book = fn ($start) => $this->postJson('/api/bookings', [
            'salon_id' => $salon->id, 'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id], 'start' => $start,
        ], $ch)->assertStatus(201)->json('id');

        $a = $book('2026-10-13T08:00:00Z');            // owner: new booking
        $this->postJson("/api/bookings/{$a}/cancel", [], $ch)->assertOk(); // owner: customer cancelled
        $b = $book('2026-10-13T10:00:00Z');            // owner: new booking
        $this->app['auth']->forgetGuards();
        $this->postJson("/api/business/bookings/{$b}/cancel", [], ['Authorization' => 'Bearer '.$this->tokenFor($salon->owner)])->assertOk(); // customer
        $this->app['auth']->forgetGuards();
        $c = $book('2026-10-14T08:00:00Z');
        Booking::query()->whereKey($c)->update(['created_at' => now()->subDays(3)]);
        $this->travelTo(CarbonImmutable::parse('2026-10-13 09:00:00', 'UTC'));
        $this->artisan('usta:send-reminders');         // customer: 24 h reminder

        $this->assertCount(6, $sent);
        foreach ($sent as $m) {
            $this->assertSame('bookings', $m['channelId']);
            $this->assertSame('default', $m['sound']);
            $expected = $m['to'] === 'ExponentPushToken[owner]' ? '/business/bookings' : '/bookings';
            $this->assertSame($expected, ((array) $m['data'])['url'], json_encode($m));
        }
        $this->assertSame(2, collect($sent)->where('to', 'ExponentPushToken[customer]')->count());
    }
}
