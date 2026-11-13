<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Fərdi (10 ₼): everything in Start for one person, plus a personal page <slug>.yazilnow.az. */
class FerdiPlanTest extends TestCase
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

    private function solo(): Business
    {
        $salon = $this->makeSalon();
        Subscription::query()->where('business_id', $salon->id)->update(['plan' => 'ferdi']);

        return $salon->fresh();
    }

    public function test_ferdi_takes_bookings_like_start(): void
    {
        $salon = $this->solo();
        $this->assertTrue($salon->takesBookings());
        $this->assertTrue($salon->isListable());
        $client = User::factory()->create();
        $this->postJson('/api/bookings', [
            'salon_id' => $salon->id,
            'master_id' => $salon->masters()->first()->id,
            'service_ids' => [$salon->services()->first()->id],
            'start' => '2026-10-13T08:00:00.000Z',
        ], $this->auth($client))->assertCreated();
    }

    public function test_ferdi_is_one_master(): void
    {
        $salon = $this->solo();
        $this->postJson('/api/business/masters', [
            'name' => 'Second Master', 'role' => 'Barber', 'work_days' => [1, 2, 3], 'shift' => ['start' => '10:00', 'end' => '18:00'],
        ], $this->auth($salon->owner))->assertStatus(402)->assertJsonPath('error', 'master_limit');
    }

    public function test_a_salon_with_several_masters_cannot_pick_ferdi(): void
    {
        $salon = $this->makeSalon();
        $h = $this->auth($salon->owner);
        $this->postJson('/api/business/masters', [
            'name' => 'Second Master', 'role' => 'Barber', 'work_days' => [1, 2, 3], 'shift' => ['start' => '10:00', 'end' => '18:00'],
        ], $h)->assertCreated();
        $this->postJson('/api/business/subscription/trial', ['plan' => 'ferdi'], $h)
            ->assertStatus(422)->assertJsonPath('error', 'too_many_masters');
    }

    public function test_personal_page_address(): void
    {
        $salon = $this->solo();
        $h = $this->auth($salon->owner);
        $this->patchJson('/api/business', ['slug' => 'Orxan Osmanov'], $h)->assertStatus(422);
        $this->patchJson('/api/business', ['slug' => 'admin'], $h)->assertStatus(422);
        $this->patchJson('/api/business', ['slug' => 'OrxanOsmanov'], $h)->assertOk()
            ->assertJsonPath('slug', 'orxanosmanov')
            ->assertJsonPath('page_url', 'https://yazilnow.az/u/orxanosmanov')
            ->assertJsonPath('share_url', 'https://yazilnow.az/u/orxanosmanov');

        $this->getJson('/api/pages/orxanosmanov')->assertOk()->assertJsonPath('salon_id', $salon->id);
        $this->getJson("/api/salons/{$salon->id}")->assertJsonPath('page_url', 'https://yazilnow.az/u/orxanosmanov');

        // Once the hosting has wildcard subdomains.
        config(['usta.page_subdomains' => true]);
        $this->getJson('/api/business', $h)->assertJsonPath('page_url', 'https://orxanosmanov.yazilnow.az');
        $this->getJson('/api/pages/nobody')->assertNotFound();

        // Taken by someone else.
        $other = $this->solo();
        $this->patchJson('/api/business', ['slug' => 'orxanosmanov'], $this->auth($other->owner))->assertStatus(422);
    }

    public function test_sade_has_no_personal_page(): void
    {
        $salon = $this->makeSalon();
        Subscription::query()->where('business_id', $salon->id)->update(['plan' => 'sade']);
        $this->patchJson('/api/business', ['slug' => 'mysalon'], $this->auth($salon->owner))
            ->assertStatus(402)->assertJsonPath('error', 'plan_required');
    }

    public function test_every_booking_plan_has_a_link_to_share(): void
    {
        // No address picked yet: the link uses the salon's id and still opens the page.
        $salon = $this->solo();
        $h = $this->auth($salon->owner);
        $this->getJson('/api/business', $h)->assertOk()
            ->assertJsonPath('page_url', null)
            ->assertJsonPath('share_url', "https://yazilnow.az/u/{$salon->id}");
        $this->getJson("/api/pages/{$salon->id}")->assertOk()
            ->assertJsonPath('salon_id', $salon->id)->assertJsonPath('branches', []);

        foreach (['start', 'pro'] as $plan) {
            Subscription::query()->where('business_id', $salon->id)->update(['plan' => $plan]);
            $this->getJson('/api/business', $h)->assertJsonPath('share_url', "https://yazilnow.az/u/{$salon->id}");
        }

        // Sadə (map listing only) has no booking link, and its id doesn't open as a page.
        Subscription::query()->where('business_id', $salon->id)->update(['plan' => 'sade']);
        $this->getJson('/api/business', $h)->assertJsonPath('share_url', null);
        $this->getJson("/api/pages/{$salon->id}")->assertNotFound();
    }

    public function test_pro_link_lists_the_branches_to_pick_from(): void
    {
        $salon = $this->makeSalon();
        Subscription::query()->where('business_id', $salon->id)->update(['plan' => 'pro']);
        $h = $this->auth($salon->owner);
        $id = $this->postJson('/api/business/branches', ['salon_name' => 'Gənclik', 'address' => 'A 1', 'district' => 'Nərimanov'], $h)->json('id');

        // A branch without services or masters isn't open yet: nothing to pick.
        $this->getJson("/api/pages/{$salon->id}")->assertOk()->assertJsonPath('branches', []);

        $b = $h + ['X-Branch' => $id];
        $svc = $this->postJson('/api/business/services', ['name' => ['az' => 'Kəsim'], 'category' => 'barber', 'duration_min' => 30, 'price' => 20], $b)->json('id');
        $this->postJson('/api/business/masters', ['name' => 'Elvin', 'role' => ['az' => 'Bərbər'], 'service_ids' => [$svc], 'work_days' => [1, 2], 'shift' => ['start' => '10:00', 'end' => '18:00']], $b)->assertCreated();

        $this->getJson("/api/pages/{$salon->id}")->assertOk()
            ->assertJsonCount(2, 'branches')
            ->assertJsonPath('branches.0.id', $salon->id)
            ->assertJsonPath('branches.1.id', $id)
            ->assertJsonPath('branches.1.district', 'Nərimanov');
        // The branch shows the main salon's link; its own id is not a link.
        $this->getJson('/api/business', $b)->assertJsonPath('share_url', "https://yazilnow.az/u/{$salon->id}");
        $this->getJson("/api/pages/{$id}")->assertNotFound();
    }
}
