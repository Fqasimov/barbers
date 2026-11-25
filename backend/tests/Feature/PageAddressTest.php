<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PageAddressTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function register(array $extra = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/business/register', [
            'first_name' => 'Elvin', 'last_name' => 'Məmmədov', 'phone' => '+994551112233',
            'email' => 'elvin@example.com', 'password' => 'secret123',
            'salon_name' => 'Elvin Bərbər', 'categories' => ['barber'],
            'district' => 'Yasamal', 'address' => 'Şərifzadə küç. 5', 'audience' => 'men',
        ] + $extra);
    }

    public function test_the_address_picked_at_sign_up_is_kept(): void
    {
        $this->register(['slug' => 'Elvin-Barber'])->assertStatus(202);
        $this->assertSame('elvin-barber', Business::query()->where('name', 'Elvin Bərbər')->value('slug'));

        // Registering again before confirming the code keeps the same address.
        $this->travel(11)->minutes();
        $this->register(['slug' => 'elvin-barber'])->assertStatus(202);
    }

    public function test_an_abandoned_sign_up_does_not_keep_its_address(): void
    {
        $this->register(['slug' => 'popular-name'])->assertStatus(202);
        $this->getJson('/api/page-address?slug=popular-name')->assertJsonPath('available', false);

        $this->travel(11)->minutes(); // the code expired, never confirmed
        $this->getJson('/api/page-address?slug=popular-name')->assertJsonPath('available', true);
        $this->register(['slug' => 'popular-name', 'email' => 'real@example.com'])->assertStatus(202);
        $this->assertSame(1, Business::query()->where('slug', 'popular-name')->count());
    }

    public function test_the_plan_comes_first_and_ferdi_needs_no_salon_name(): void
    {
        $this->postJson('/api/business/register', [
            'first_name' => 'Elvin', 'last_name' => 'Məmmədov', 'phone' => '+994551112233',
            'email' => 'solo@example.com', 'password' => 'secret123',
            'categories' => ['barber'], 'district' => 'Yasamal', 'address' => 'Şərifzadə küç. 5', 'audience' => 'men',
            'plan' => 'ferdi',
        ])->assertStatus(202);
        $salon = Business::query()->where('name', 'Elvin Məmmədov')->firstOrFail();
        $this->assertSame('ferdi', $salon->subscription->plan);
        $this->assertSame('trialing', $salon->subscription->status);
        $this->assertSame('elvin-memmedov', $salon->slug);
        $this->assertSame(1, $salon->masters()->count());

        // Other plans still need a salon name, and the plan must fit the kind of business.
        $base = ['first_name' => 'Anar', 'last_name' => 'Bayramov', 'phone' => '+994551112234', 'email' => 'team@example.com',
            'password' => 'secret123', 'district' => 'X', 'address' => 'Y', 'audience' => 'all'];
        $this->postJson('/api/business/register', $base + ['categories' => ['barber'], 'plan' => 'start'])->assertStatus(422);
        $this->postJson('/api/business/register', $base + ['categories' => ['couture'], 'plan' => 'start', 'salon_name' => 'Z'])->assertStatus(422);
        $this->postJson('/api/business/register', $base + ['categories' => ['barber'], 'plan' => 'start', 'salon_name' => 'Team Cuts'])->assertStatus(202);
        $this->assertSame('start', Business::query()->where('name', 'Team Cuts')->first()->subscription->plan);
    }

    public function test_without_an_address_one_is_made_from_the_name(): void
    {
        $this->register()->assertStatus(202);
        $this->assertSame('elvin-berber', Business::query()->where('name', 'Elvin Bərbər')->value('slug'));
    }

    public function test_bad_taken_and_reserved_addresses_are_refused(): void
    {
        $this->makeSalon()->forceFill(['slug' => 'taken-one'])->save();

        $this->register(['slug' => 'taken-one'])->assertStatus(422)->assertJsonPath('error', 'slug_taken');
        $this->register(['slug' => 'admin'])->assertStatus(422)->assertJsonPath('error', 'slug_reserved');
        $this->register(['slug' => 'a--b'])->assertStatus(422)->assertJsonPath('error', 'slug_invalid');
        $this->register(['slug' => 'ab'])->assertStatus(422)->assertJsonPath('error', 'slug_invalid');

        $this->getJson('/api/page-address?slug=taken-one')->assertOk()
            ->assertJsonPath('available', false)->assertJsonPath('problem', 'taken');
        $this->getJson('/api/page-address?slug=free-one')->assertOk()
            ->assertJsonPath('available', true)->assertJsonPath('problem', null);
    }

    public function test_only_ferdi_gets_a_subdomain(): void
    {
        config(['usta.page_subdomains' => true, 'usta.link_url' => 'https://link.yazilnow.az']);
        $salon = $this->makeSalon();
        $salon->forceFill(['slug' => 'elvin'])->save();

        Subscription::query()->where('business_id', $salon->id)->update(['plan' => 'ferdi']);
        $this->assertSame('https://elvin.yazilnow.az', $salon->fresh()->shareUrl());

        foreach (['start', 'pro'] as $plan) {
            Subscription::query()->where('business_id', $salon->id)->update(['plan' => $plan]);
            $this->assertSame('https://link.yazilnow.az/elvin', $salon->fresh()->shareUrl());
        }

        // Until the hosting has wildcard subdomains, Fərdi uses the link address too.
        config(['usta.page_subdomains' => false]);
        Subscription::query()->where('business_id', $salon->id)->update(['plan' => 'ferdi']);
        $this->assertSame('https://link.yazilnow.az/elvin', $salon->fresh()->shareUrl());
    }

    public function test_ferdi_owner_is_the_one_master(): void
    {
        $owner = User::factory()->create(['first_name' => 'Leyla', 'last_name' => 'Əliyeva', 'role' => 'business']);
        $salon = new Business;
        $salon->forceFill([
            'owner_id' => $owner->id, 'name' => 'Leyla Nails', 'categories' => ['nails'], 'closed_days' => [0],
            'hours_open' => '10:00', 'hours_close' => '19:00', 'status' => Business::PENDING,
        ])->save();
        $h = ['Authorization' => 'Bearer '.$this->tokenFor($owner)];

        $this->postJson('/api/business/subscription/trial', ['plan' => 'ferdi'], $h)->assertOk();
        $master = $salon->masters()->first();
        $this->assertNotNull($master);
        $this->assertSame('Leyla Əliyeva', $master->name);
        $this->assertSame([1, 2, 3, 4, 5, 6], $master->work_days);
        $this->assertSame('10:00', $master->shift_start);

        // New services are the owner's automatically.
        $this->postJson('/api/business/services', [
            'name' => 'Manikür', 'category' => 'nails', 'duration_min' => 60, 'price' => 25,
        ], $h)->assertCreated();
        $this->assertSame(1, $master->fresh()->services()->count());
        $this->assertSame(1, $salon->masters()->count());

        // A second master is not allowed on Fərdi.
        $this->postJson('/api/business/masters', [
            'name' => 'Second', 'role' => 'Usta', 'work_days' => [1], 'shift' => ['start' => '10:00', 'end' => '18:00'],
        ], $h)->assertStatus(402);
    }
}
