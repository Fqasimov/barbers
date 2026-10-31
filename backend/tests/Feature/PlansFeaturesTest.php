<?php

namespace Tests\Feature;

use App\Jobs\SendPush;
use App\Jobs\SendWhatsApp;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Payments\FakeGateway;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Sadə / Start / Pro: what each plan unlocks, branches, managers, deposits, waitlist, QR reviews, WhatsApp. */
class PlansFeaturesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Bus::fake([SendPush::class, SendWhatsApp::class]);
    }

    private function onPlan(Business $b, string $plan): Business
    {
        Subscription::query()->where('business_id', $b->id)->update(['plan' => $plan]);

        return $b->fresh();
    }

    /** Each request signs in afresh by its token: the guard otherwise keeps the previous user. */
    public function json($method, $uri, array $data = [], array $headers = [], $options = 0)
    {
        $this->app['auth']->forgetGuards();

        return parent::json($method, $uri, $data, $headers, $options);
    }

    private function auth(User $u): array
    {
        return ['Authorization' => 'Bearer '.$this->tokenFor($u)];
    }

    private function book(Business $salon, User $u, string $start = '2026-10-13T08:00:00.000Z')
    {
        return $this->postJson('/api/bookings', [
            'salon_id' => $salon->id,
            'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id],
            'start' => $start,
        ], $this->auth($u));
    }

    private function pay(string $paymentId): void
    {
        $p = Payment::query()->findOrFail($paymentId);
        $this->postJson('/api/payments/fake/callback', [
            'payment_id' => $p->id, 'status' => 'paid', 'amount' => $p->amount, 'currency' => 'AZN',
            'signature' => FakeGateway::sign($p->id, 'paid', (int) $p->amount, 'AZN'),
        ])->assertOk();
    }

    // --- Sadə ---------------------------------------------------------------

    public function test_sade_is_on_the_map_without_masters_and_sends_clients_to_its_link(): void
    {
        $salon = $this->onPlan($this->makeSalon(['booking_url' => 'https://dikidi.net/123']), 'sade');
        $salon->masters()->delete();

        $this->getJson("/api/salons/{$salon->id}")->assertOk()
            ->assertJsonPath('booking', 'link')->assertJsonPath('booking_url', 'https://dikidi.net/123')
            ->assertJsonPath('deposits', false);
        $this->makeMaster($salon, [$salon->services()->first()->id]);
        $this->book($salon, User::factory()->create())->assertStatus(422)->assertJsonPath('error', 'booking_external');
        $this->getJson("/api/salons/{$salon->id}/availability?service_ids[]={$salon->services()->first()->id}")
            ->assertStatus(422);

        $this->postJson("/api/salons/{$salon->id}/click", ['kind' => 'book'])->assertOk();
        $this->postJson("/api/salons/{$salon->id}/click", ['kind' => 'book'])->assertOk();
        $this->postJson("/api/salons/{$salon->id}/click", ['kind' => 'phone'])->assertOk();
        $this->postJson("/api/salons/{$salon->id}/click", ['kind' => 'nope'])->assertStatus(422);
        $this->getJson('/api/business/clicks', $this->auth($salon->owner))->assertOk()
            ->assertJsonPath('totals.book', 2)->assertJsonPath('totals.phone', 1)
            ->assertJsonPath('by_day.0.date', '2026-10-12');

        // Pro-only tools say which plan is needed.
        $this->getJson('/api/business/stats', $this->auth($salon->owner))->assertStatus(402)->assertJsonPath('error', 'plan_required');
    }

    public function test_owner_sets_the_booking_link(): void
    {
        $salon = $this->makeSalon();
        $h = $this->auth($salon->owner);
        $this->patchJson('/api/business', ['booking_url' => 'not a url'], $h)->assertStatus(422);
        $this->patchJson('/api/business', ['booking_url' => 'https://wa.me/994505550000'], $h)->assertOk()
            ->assertJsonPath('booking_url', 'https://wa.me/994505550000')
            ->assertJsonPath('role', 'owner');
        $this->patchJson('/api/business', ['booking_url' => null], $h)->assertOk()->assertJsonPath('booking_url', null);
    }

    // --- Branches and managers ---------------------------------------------

    public function test_pro_branches_are_billed_after_three_locations(): void
    {
        $salon = $this->makeSalon();
        $h = $this->auth($salon->owner);
        $this->postJson('/api/business/branches', ['salon_name' => 'Gənclik', 'address' => 'A 1', 'district' => 'Nərimanov'], $h)
            ->assertStatus(402);

        $this->onPlan($salon, 'pro');
        foreach (['Gənclik', 'Yasamal', 'Xətai'] as $name) {
            $this->postJson('/api/business/branches', ['salon_name' => $name, 'address' => 'A 1', 'district' => 'Nərimanov'], $h)
                ->assertCreated()->assertJsonPath('is_main', false)->assertJsonPath('status', 'live');
        }
        $this->getJson('/api/business/branches', $h)->assertOk()
            ->assertJsonCount(4, 'data')->assertJsonPath('price', 49 + 15);

        $res = $this->postJson('/api/business/subscription/checkout', ['plan' => 'pro', 'period' => 'year'], $h)->assertOk();
        $this->assertSame(490 + 150, $res->json('amount'));
        $this->assertDatabaseHas('payments', ['id' => $res->json('payment_id'), 'locations' => 4]);
    }

    public function test_a_branch_is_listed_while_the_main_salon_is_on_pro(): void
    {
        $salon = $this->onPlan($this->makeSalon(), 'pro');
        $h = $this->auth($salon->owner);
        $id = $this->postJson('/api/business/branches', ['salon_name' => 'Gənclik', 'address' => 'A 1', 'district' => 'Nərimanov'], $h)->json('id');

        // The branch is its own location: X-Branch picks it.
        $this->getJson('/api/business', $h + ['X-Branch' => $id])->assertOk()
            ->assertJsonPath('salon_name', 'Gənclik')->assertJsonPath('parent_id', $salon->id)
            ->assertJsonPath('subscription.plan', 'pro')->assertJsonCount(2, 'locations');
        $svc = $this->postJson('/api/business/services', ['name' => ['az' => 'Kəsim'], 'category' => 'barber', 'duration_min' => 30, 'price' => 20], $h + ['X-Branch' => $id])->json('id');
        $this->postJson('/api/business/masters', ['name' => 'Elvin', 'role' => ['az' => 'Bərbər'], 'service_ids' => [$svc], 'work_days' => [1, 2], 'shift' => ['start' => '10:00', 'end' => '18:00']], $h + ['X-Branch' => $id])->assertCreated();
        $this->assertSame(1, Business::query()->find($salon->id)->masters()->count());
        $this->getJson("/api/salons/{$id}")->assertOk()->assertJsonPath('booking', 'app');

        $this->getJson('/api/business', $h + ['X-Branch' => 'someone-else'])->assertForbidden();

        $this->onPlan($salon, 'start');
        $this->getJson("/api/salons/{$id}")->assertNotFound();
    }

    public function test_managers_run_their_location_but_not_billing(): void
    {
        $salon = $this->onPlan($this->makeSalon(), 'pro');
        $owner = $this->auth($salon->owner);
        $manager = User::factory()->create(['email' => 'leyla@example.com']);

        $this->postJson('/api/business/team', ['email' => 'Leyla@Example.com'], $owner)->assertCreated()
            ->assertJsonPath('accepted', true)->assertJsonPath('email', 'leyla@example.com');
        $this->postJson('/api/business/team', ['email' => 'new@example.com'], $owner)->assertCreated()->assertJsonPath('accepted', false);

        $h = $this->auth($manager);
        $this->getJson('/api/business', $h)->assertOk()->assertJsonPath('role', 'manager')->assertJsonPath('id', $salon->id);
        $this->getJson('/api/business/bookings', $h)->assertOk();
        $this->postJson('/api/business/subscription/checkout', ['plan' => 'pro'], $h)->assertForbidden();
        $this->postJson('/api/business/branches', ['salon_name' => 'X', 'address' => 'A', 'district' => 'B'], $h)->assertForbidden();
        $this->getJson('/api/business/team', $h)->assertForbidden();
        $this->getJson('/api/business/stats?scope=all', $h)->assertForbidden();
        $this->getJson('/api/business/stats', $h)->assertOk();

        // Signing in later picks up a waiting invite.
        $late = User::factory()->create(['email' => 'new@example.com']);
        $this->getJson('/api/business', $this->auth($late))->assertOk()->assertJsonPath('role', 'manager');

        // Off Pro, managers lose access.
        $this->onPlan($salon, 'start');
        $this->getJson('/api/business', $h)->assertForbidden();
    }

    // --- Deposits ----------------------------------------------------------

    public function test_deposit_holds_the_slot_until_paid_then_confirms(): void
    {
        $salon = $this->onPlan($this->makeSalon(), 'pro');
        $h = $this->auth($salon->owner);
        $sid = $salon->services()->first()->id;
        $this->patchJson("/api/business/services/{$sid}", ['deposit' => ['type' => 'percent', 'value' => 150]], $h)->assertStatus(422);
        $this->patchJson("/api/business/services/{$sid}", ['deposit' => ['type' => 'percent', 'value' => 20]], $h)->assertOk()
            ->assertJsonPath('deposit', ['type' => 'percent', 'value' => 20]);

        $client = User::factory()->create();
        $res = $this->book($salon, $client)->assertCreated()
            ->assertJsonPath('status', 'pending_payment')->assertJsonPath('deposit', 6)->assertJsonPath('deposit_status', 'pending');
        $this->assertNotNull($res->json('checkout_url'));
        Bus::assertNotDispatched(SendPush::class);

        // Held: nobody else can take it.
        $this->book($salon, User::factory()->create())->assertStatus(409);

        $payment = Payment::query()->where('booking_id', $res->json('id'))->firstOrFail();
        $this->assertSame('deposit', $payment->kind);
        $this->pay($payment->id);
        $b = Booking::query()->find($res->json('id'));
        $this->assertSame([Booking::UPCOMING, 'paid'], [$b->status, $b->deposit_status]);
        Bus::assertDispatched(SendPush::class);

        // Cancelled in time: refunded.
        $this->postJson("/api/bookings/{$b->id}/cancel", [], $this->auth($client))->assertOk()->assertJsonPath('deposit_status', 'refunded');
        $this->assertNotNull($payment->fresh()->refunded_at);
    }

    public function test_unpaid_hold_expires_and_frees_the_slot(): void
    {
        $salon = $this->onPlan($this->makeSalon(), 'pro');
        $salon->services()->update(['deposit_type' => 'fixed', 'deposit_value' => 10]);
        $id = $this->book($salon, User::factory()->create())->assertCreated()->json('id');

        $this->travel(16)->minutes();
        $this->book($salon, User::factory()->create())->assertCreated();
        $this->artisan('usta:expire-holds')->assertSuccessful();
        $this->assertSame([Booking::CANCELLED, 'system', 'expired'], array_values(Booking::query()->find($id)->only(['status', 'cancelled_by', 'deposit_status'])));
    }

    public function test_no_show_keeps_the_deposit_and_arrival_counts_it(): void
    {
        $salon = $this->onPlan($this->makeSalon(), 'pro');
        $salon->services()->update(['deposit_type' => 'fixed', 'deposit_value' => 10]);
        $h = $this->auth($salon->owner);
        $ids = [];
        foreach (['2026-10-13T08:00:00.000Z', '2026-10-13T10:00:00.000Z'] as $start) {
            $id = $this->book($salon, User::factory()->create(), $start)->json('id');
            $this->pay(Payment::query()->where('booking_id', $id)->value('id'));
            $ids[] = $id;
        }
        $this->travel(2)->days();
        $this->postJson("/api/business/bookings/{$ids[0]}/no-show", [], $h)->assertOk();
        $this->postJson("/api/business/bookings/{$ids[1]}/complete", [], $h)->assertOk();
        $this->assertSame('kept', Booking::query()->find($ids[0])->deposit_status);
        $this->assertSame('applied', Booking::query()->find($ids[1])->deposit_status);
    }

    public function test_two_no_shows_mean_a_deposit_at_pro_salons_only(): void
    {
        $client = User::factory()->create();
        $past = $this->makeSalon();
        foreach ([1, 2] as $i) {
            $this->makeBooking($past, $past->masters()->first(), $client, now()->subDays($i), ['status' => Booking::NO_SHOW]);
        }
        $start = $this->makeSalon();
        $this->book($start, $client)->assertCreated()->assertJsonPath('status', 'upcoming')->assertJsonPath('deposit', 0);

        $pro = $this->onPlan($this->makeSalon(), 'pro');
        // 20 % of 30 ₼ is 6 ₼.
        $this->book($pro, $client)->assertCreated()->assertJsonPath('status', 'pending_payment')->assertJsonPath('deposit', 6);
    }

    public function test_salon_cancel_refunds_a_paid_deposit(): void
    {
        $salon = $this->onPlan($this->makeSalon(), 'pro');
        $salon->services()->update(['deposit_type' => 'fixed', 'deposit_value' => 10]);
        $id = $this->book($salon, User::factory()->create())->json('id');
        $this->pay(Payment::query()->where('booking_id', $id)->value('id'));
        $this->postJson("/api/business/bookings/{$id}/cancel", [], $this->auth($salon->owner))->assertOk()
            ->assertJsonPath('deposit_status', 'refunded');
    }

    // --- Waitlist ----------------------------------------------------------

    public function test_waitlist_is_told_when_a_time_opens(): void
    {
        $salon = $this->onPlan($this->makeSalon(), 'pro');
        $sid = $salon->services()->first()->id;
        $start = $this->makeSalon();
        $this->postJson("/api/salons/{$start->id}/waitlist", ['service_ids' => [$start->services()->first()->id], 'date' => '2026-10-13'], $this->auth(User::factory()->create()))
            ->assertStatus(402);

        $first = User::factory()->create();
        $b = $this->book($salon, $first)->assertCreated();
        $waiting = User::factory()->create();
        $this->postJson("/api/salons/{$salon->id}/waitlist", ['service_ids' => [$sid], 'date' => '2026-10-13', 'from_min' => 600, 'to_min' => 780], $this->auth($waiting))
            ->assertCreated()->assertJsonPath('notified', false);
        $this->getJson('/api/me/waitlist', $this->auth($waiting))->assertOk()->assertJsonCount(1);
        $this->getJson('/api/business/waitlist', $this->auth($salon->owner))->assertOk()->assertJsonCount(1);

        // Fill every other slot in the window so only the cancelled one opens up.
        $this->postJson("/api/bookings/{$b->json('id')}/cancel", [], $this->auth($first))->assertOk();
        Bus::assertDispatched(SendPush::class, fn (SendPush $p) => $p->userId === $waiting->id && $p->data['type'] === 'waitlist');
        $this->getJson('/api/me/waitlist', $this->auth($waiting))->assertJsonPath('0.notified', true);
    }

    // --- QR reviews ---------------------------------------------------------

    public function test_qr_review_works_once_and_weighs_less(): void
    {
        $salon = $this->makeSalon(['base_rating' => 0, 'base_review_count' => 0]);
        $master = $salon->masters()->first();
        $h = $this->auth($salon->owner);
        $qr = $this->postJson('/api/business/review-codes', ['master_id' => $master->id], $h)->assertCreated();
        $code = $qr->json('code');
        $this->assertStringEndsWith("/r/{$code}", $qr->json('url'));
        $this->assertStringEndsWith("/s/{$salon->id}", $qr->json('wall_url'));
        $this->assertDatabaseMissing('review_codes', ['token_hash' => $code]);

        $this->getJson("/api/reviews/qr/{$code}")->assertOk()
            ->assertJsonPath('salon_name', 'Test Barbers')->assertJsonPath('master_name', $master->name)->assertJsonPath('usable', true);
        $this->postJson("/api/reviews/qr/{$code}", ['rating' => 5])->assertUnauthorized();
        $this->postJson("/api/reviews/qr/{$code}", ['rating' => 5], $h)->assertStatus(422)->assertJsonPath('error', 'own_salon');

        $client = User::factory()->create();
        $this->postJson("/api/reviews/qr/{$code}", ['rating' => 2, 'master_rating' => 5, 'text' => 'Usta yaxşı, gözləmə uzun'], $this->auth($client))
            ->assertCreated()->assertJsonPath('source', 'qr')->assertJsonPath('master_rating', 5);
        $this->postJson("/api/reviews/qr/{$code}", ['rating' => 5], $this->auth(User::factory()->create()))->assertStatus(410);

        // Same client, new code, same salon within 30 days: refused.
        $again = $this->postJson('/api/business/review-codes', [], $h)->json('code');
        $this->postJson("/api/reviews/qr/{$again}", ['rating' => 5], $this->auth($client))->assertStatus(429);

        // A booked-visit 4★ (weight 10) and the QR 2★ (weight 8): (40 + 16) / 18.
        $other = User::factory()->create();
        $b = $this->makeBooking($salon, $master, $other, now()->subDay());
        $this->postJson("/api/bookings/{$b->id}/review", ['rating' => 4, 'text' => ''], $this->auth($other))->assertCreated();
        $s = $this->getJson("/api/salons/{$salon->id}")->json();
        $this->assertSame(round(56 / 18, 2), $s['rating']);
        $this->assertSame(2, $s['review_count']);
        // The master: QR 5★ (×8) and 4★ (×10).
        $this->assertSame(round(80 / 18, 2), $s['masters'][0]['rating']);

        // Negative reviews stay; the salon answers but can't delete.
        $this->getJson('/api/business/reviews', $h)->assertJsonCount(2, 'data');
    }

    public function test_expired_code_is_refused(): void
    {
        $salon = $this->makeSalon();
        $code = $this->postJson('/api/business/review-codes', [], $this->auth($salon->owner))->json('code');
        $this->travel(25)->hours();
        $this->postJson("/api/reviews/qr/{$code}", ['rating' => 5], $this->auth(User::factory()->create()))->assertStatus(410);
        $this->getJson('/api/reviews/qr/short')->assertNotFound();
    }

    // --- Statistics ---------------------------------------------------------

    public function test_pro_statistics_for_one_or_all_locations(): void
    {
        $salon = $this->onPlan($this->makeSalon(), 'pro');
        $h = $this->auth($salon->owner);
        $master = $salon->masters()->first();
        $u = User::factory()->create();
        $this->makeBooking($salon, $master, $u, now()->subDays(3), ['status' => Booking::COMPLETED]);
        $this->makeBooking($salon, $master, $u, now()->subDays(2), ['status' => Booking::NO_SHOW]);
        $this->makeBooking($salon, $master, User::factory()->create(), now()->subDay(), ['status' => Booking::CANCELLED]);
        $branch = $this->postJson('/api/business/branches', ['salon_name' => 'Gənclik', 'address' => 'A', 'district' => 'B'], $h)->json('id');

        $one = $this->getJson('/api/business/stats', $h)->assertOk()->json();
        $this->assertSame(['bookings' => 3, 'completed' => 1, 'cancelled' => 1, 'no_show' => 1, 'revenue' => 30, 'clients' => 1],
            array_intersect_key($one['totals'], array_flip(['bookings', 'completed', 'cancelled', 'no_show', 'revenue', 'clients'])));
        $this->assertCount(30, $one['by_day']);
        $this->assertSame($master->id, $one['by_master'][0]['id']);

        $all = $this->getJson('/api/business/stats?scope=all', $h)->assertOk()->json();
        $this->assertSame([$salon->id, $branch], array_column($all['by_location'], 'id'));

        $this->onPlan($salon, 'start');
        $this->getJson('/api/business/stats', $h)->assertStatus(402);
    }

    // --- WhatsApp and support ----------------------------------------------

    public function test_whatsapp_pack_sends_until_it_runs_out(): void
    {
        $salon = $this->makeSalon();
        $h = $this->auth($salon->owner);
        $res = $this->postJson('/api/business/whatsapp/checkout', [], $h)->assertOk()->assertJsonPath('amount', 10);
        $this->pay($res->json('payment_id'));
        $this->getJson('/api/business', $h)->assertJsonPath('whatsapp_pack.left', 300);

        $client = User::factory()->create(['phone' => '+994501112233']);
        $this->book($salon, $client)->assertCreated();
        Bus::assertDispatched(SendWhatsApp::class, fn ($j) => $j->phone === '+994501112233');
        $this->getJson('/api/business', $h)->assertJsonPath('whatsapp_pack.left', 299);

        Business::query()->whereKey($salon->id)->update(['whatsapp_used' => 300]);
        Bus::fake([SendWhatsApp::class]);
        $this->book($salon, User::factory()->create(['phone' => '+994501112244']), '2026-10-13T10:00:00.000Z')->assertCreated();
        Bus::assertNotDispatched(SendWhatsApp::class);

        $this->onPlan($salon, 'sade');
        $this->postJson('/api/business/whatsapp/checkout', [], $h)->assertStatus(402);
    }

    public function test_support_phone_line_is_for_pro(): void
    {
        $salon = $this->makeSalon();
        $h = $this->auth($salon->owner);
        $this->getJson('/api/business/support', $h)->assertOk()->assertJsonPath('priority', false)->assertJsonPath('phone', null);
        $this->onPlan($salon, 'pro');
        $this->getJson('/api/business/support', $h)->assertOk()->assertJsonPath('priority', true);
        $this->assertNotNull($this->getJson('/api/business/support', $h)->json('phone'));
    }
}
