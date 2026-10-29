<?php

namespace Tests\Feature;

use App\Mail\BookingMail;
use App\Models\Business;
use App\Models\Master;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BusinessTest extends TestCase
{
    private Business $salon;

    private array $h;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->salon = $this->makeSalon();
        $this->h = ['Authorization' => 'Bearer '.$this->tokenFor($this->salon->owner)];
    }

    public function test_show_and_update_business(): void
    {
        $this->getJson('/api/business', $this->h)->assertOk()
            ->assertJsonPath('id', $this->salon->id)->assertJsonPath('salon_id', $this->salon->id)
            ->assertJsonPath('subscription.status', 'trialing')->assertJsonCount(1, 'masters');

        $this->patchJson('/api/business', [
            'salon_name' => 'New Name',
            'about' => 'Ən yaxşı bərbərxana',
            'coords' => ['latitude' => 40.4, 'longitude' => 49.85],
            'hours' => ['open' => '08:00', 'close' => '22:00'],
            'closed_days' => [],
            'whatsapp' => '+994 50 555 00 11',
            'status' => 'live',
            'owner_id' => 'someone',
        ], $this->h)->assertOk()
            ->assertJsonPath('salon_name', 'New Name')
            ->assertJsonPath('about.ru', 'Ən yaxşı bərbərxana')
            ->assertJsonPath('coords.latitude', 40.4)
            ->assertJsonPath('hours.open', '08:00')
            ->assertJsonPath('closed_days', [])
            ->assertJsonPath('whatsapp', '994505550011')
            ->assertJsonPath('owner_id', $this->salon->owner_id);

        $this->patchJson('/api/business', ['hours' => ['open' => '20:00', 'close' => '08:00']], $this->h)->assertStatus(422);
    }

    public function test_customers_and_other_owners_are_forbidden(): void
    {
        $customer = User::factory()->create();
        $this->getJson('/api/business', ['Authorization' => 'Bearer '.$this->tokenFor($customer)])
            ->assertStatus(403)->assertJsonPath('error', 'forbidden');

        $this->app['auth']->forgetGuards();
        $other = $this->makeSalon(['name' => 'Other']);
        $theirMaster = $other->masters()->first();
        $theirService = $other->services()->first();
        $this->patchJson("/api/business/masters/{$theirMaster->id}", ['name' => 'Hacked'], $this->h)->assertStatus(403)->assertJsonPath('error', 'forbidden');
        $this->deleteJson("/api/business/services/{$theirService->id}", [], $this->h)->assertStatus(403);
        $booking = $this->makeBooking($other, $theirMaster, $customer, '2026-10-13 08:00:00');
        $this->postJson("/api/business/bookings/{$booking->id}/cancel", [], $this->h)->assertStatus(403);
        $this->deleteJson('/api/business/masters/nope', [], $this->h)->assertStatus(404)->assertJsonPath('error', 'not_found');
        // Can't attach another salon's service to my master.
        $this->postJson('/api/business/masters', $this->masterBody(['service_ids' => [$theirService->id]]), $this->h)->assertStatus(422);
        $this->assertSame('Rauf Məmmədov', $theirMaster->fresh()->name);
    }

    private function masterBody(array $over = []): array
    {
        return $over + [
            'name' => 'Nicat Əliyev',
            'role' => 'Bərbər',
            'years' => 3,
            'service_ids' => [$this->salon->services()->first()->id],
            'work_days' => [1, 2, 3],
            'shift' => ['start' => '11:00', 'end' => '19:00'],
            'languages' => ['az', 'ru'],
        ];
    }

    public function test_masters_crud_without_limit(): void
    {
        for ($i = 0; $i < 12; $i++) {
            $id = $this->postJson('/api/business/masters', $this->masterBody(), $this->h)->assertStatus(201)
                ->assertJsonPath('role', ['az' => 'Bərbər', 'ru' => 'Bərbər', 'en' => 'Bərbər'])
                ->assertJsonPath('shift.start', '11:00')->assertJsonPath('rating', 0)->assertJsonPath('photo_url', null)
                ->json('id');
        }
        $this->assertSame(13, Master::query()->where('business_id', $this->salon->id)->count());

        $this->patchJson("/api/business/masters/{$id}", ['years' => 9, 'service_ids' => []], $this->h)->assertOk()
            ->assertJsonPath('years', 9)->assertJsonPath('service_ids', [])->assertJsonPath('name', 'Nicat Əliyev');
        $this->patchJson("/api/business/masters/{$id}", ['shift' => ['start' => '19:00', 'end' => '11:00']], $this->h)->assertStatus(422);
        $this->deleteJson("/api/business/masters/{$id}", [], $this->h)->assertNoContent();
        $this->assertNull(Master::query()->find($id));
    }

    public function test_master_with_upcoming_bookings_cannot_be_deleted(): void
    {
        $master = $this->salon->masters()->first();
        $this->makeBooking($this->salon, $master, User::factory()->create(), '2026-10-13 08:00:00');
        $this->deleteJson("/api/business/masters/{$master->id}", [], $this->h)->assertStatus(422);
    }

    public function test_services_crud_and_delete_removes_from_masters(): void
    {
        $res = $this->postJson('/api/business/services', [
            'name' => ['en' => 'Skin fade'], 'category' => 'barber', 'duration_min' => 45, 'price' => 35,
        ], $this->h)->assertStatus(201)->assertJsonPath('key', 'fade')->assertJsonPath('name.az', 'Skin fade')->assertJsonPath('description', null);
        $id = $res->json('id');

        $this->postJson('/api/business/services', ['name' => 'X', 'category' => 'barber', 'duration_min' => 2, 'price' => 20000], $this->h)
            ->assertStatus(422)->assertJsonValidationErrors(['duration_min', 'price']);

        $this->patchJson("/api/business/services/{$id}", ['price' => 40, 'description' => 'Ülgüclə'], $this->h)->assertOk()
            ->assertJsonPath('price', 40)->assertJsonPath('description.en', 'Ülgüclə');

        $master = $this->salon->masters()->first();
        $master->services()->attach($id);
        $this->deleteJson("/api/business/services/{$id}", [], $this->h)->assertNoContent();
        $this->assertNotContains($id, $master->fresh('services')->serviceIds());
        $this->getJson('/api/business', $this->h)->assertJsonCount(1, 'services');
    }

    public function test_photos_upload_reencode_limit_and_delete(): void
    {
        Storage::fake('public');
        $res = $this->post('/api/business/photos', ['photo' => UploadedFile::fake()->image('shop.png', 3200, 1600)], $this->h)
            ->assertStatus(201)->assertJsonStructure(['id', 'url']);
        $this->assertStringStartsWith('http', $res->json('url'));
        $path = "salons/{$this->salon->id}/{$res->json('id')}.jpg";
        Storage::disk('public')->assertExists($path);
        [$w, $h, $type] = getimagesizefromstring(Storage::disk('public')->get($path));
        $this->assertSame([1600, 800, IMAGETYPE_JPEG], [$w, $h, $type]);

        $this->post('/api/business/photos', ['photo' => UploadedFile::fake()->create('doc.pdf', 10, 'application/pdf')], $this->h)->assertStatus(422);
        $this->post('/api/business/photos', ['photo' => UploadedFile::fake()->image('big.jpg')->size(9000)], $this->h)->assertStatus(422);

        for ($i = 0; $i < 11; $i++) {
            $this->post('/api/business/photos', ['photo' => UploadedFile::fake()->image("p{$i}.jpg", 50, 50)], $this->h)->assertStatus(201);
        }
        $this->post('/api/business/photos', ['photo' => UploadedFile::fake()->image('13.jpg', 50, 50)], $this->h)
            ->assertStatus(422)->assertJsonValidationErrors('photo');

        $this->deleteJson("/api/business/photos/{$res->json('id')}", [], $this->h)->assertNoContent();
        Storage::disk('public')->assertMissing($path);
        $this->getJson("/api/salons/{$this->salon->id}")->assertJsonCount(11, 'photos');
    }

    public function test_business_bookings_list_cancel_complete_no_show(): void
    {
        $master = $this->salon->masters()->first();
        $customer = User::factory()->create(['first_name' => 'Aysel', 'last_name' => 'Məmmədova', 'phone' => '+994501234567']);
        $a = $this->makeBooking($this->salon, $master, $customer, '2026-10-13 08:00:00');
        $b = $this->makeBooking($this->salon, $master, $customer, '2026-10-12 05:00:00');
        $this->makeBooking($this->salon, $master, $customer, '2026-11-12 05:00:00');

        $list = $this->getJson('/api/business/bookings', $this->h)->assertOk()->assertJsonCount(2);
        $this->assertSame([$b->id, $a->id], array_column($list->json(), 'id'));
        $this->assertSame(['name' => 'Aysel Məmmədova', 'phone' => '+994501234567'], $list->json('0.client'));
        $this->getJson('/api/business/bookings?status=cancelled', $this->h)->assertJsonCount(0);
        $this->getJson('/api/business/bookings?from=2026-11-01&to=2026-11-30', $this->h)->assertJsonCount(1);

        $this->postJson("/api/business/bookings/{$a->id}/no-show", [], $this->h)->assertStatus(422);
        $this->postJson("/api/business/bookings/{$b->id}/no-show", [], $this->h)->assertOk()->assertJsonPath('status', 'no_show');

        $this->postJson("/api/business/bookings/{$a->id}/cancel", ['reason' => 'Usta xəstədir'], $this->h)->assertOk()
            ->assertJsonPath('status', 'cancelled')->assertJsonPath('cancelled_by', 'salon')->assertJsonPath('client.name', 'Aysel Məmmədova');
        Mail::assertQueued(BookingMail::class, fn ($m) => $m->hasTo($customer->email) && $m->kind === 'cancelled_by_salon');

        $c = $this->makeBooking($this->salon, $master, $customer, '2026-10-12 04:00:00');
        $this->postJson("/api/business/bookings/{$c->id}/complete", [], $this->h)->assertOk()->assertJsonPath('status', 'completed');
        $this->postJson("/api/business/bookings/{$a->id}/complete", [], $this->h)->assertStatus(422);
    }

    public function test_trial_starts_once_and_then_only_changes_plan(): void
    {
        $owner = User::factory()->business()->create();
        $salon = $this->makeSalon(['name' => 'Fresh'], $owner, subscription: '');
        $h = ['Authorization' => 'Bearer '.$this->tokenFor($owner)];
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/business/subscription', $h)->assertStatus(402)->assertJsonPath('error', 'subscription_required');

        $first = $this->postJson('/api/business/subscription/trial', ['plan' => 'start'], $h)->assertOk()
            ->assertJsonPath('subscription.plan', 'start')->assertJsonPath('subscription.status', 'trialing')
            ->assertJsonPath('subscription.trial_ends_at', '2026-11-11T06:00:00.000Z')
            ->assertJsonPath('subscription.current_period_end', null)
            ->assertJsonPath('subscription.billing_period', 'month')
            ->assertJsonPath('subscription.grace_ends_at', '2026-11-18T06:00:00.000Z');
        $this->postJson('/api/business/subscription/trial', ['plan' => 'studio'], $h)->assertStatus(422);
        $this->postJson('/api/business/subscription/trial', ['plan' => 'start', 'period' => 'year'], $h)->assertOk()
            ->assertJsonPath('subscription.billing_period', 'year')
            ->assertJsonPath('subscription.trial_ends_at', '2026-11-11T06:00:00.000Z');

        $this->travel(40)->days();
        $salon->subscription->forceFill(['status' => 'expired'])->save();
        $this->postJson('/api/business/subscription/trial', ['plan' => 'pro'], $h)->assertOk()
            ->assertJsonPath('subscription.plan', 'pro')
            ->assertJsonPath('subscription.status', 'expired')
            ->assertJsonPath('subscription.trial_ends_at', $first->json('subscription.trial_ends_at'));
        $this->getJson('/api/business/subscription', $h)->assertOk()->assertJsonPath('plan', 'pro');
        $this->postJson('/api/business/subscription/trial', ['plan' => 'gold'], $h)->assertStatus(422);
    }
}
