<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Review;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\DemoCatalogueSeeder;
use Tests\TestCase;

class CatalogueTest extends TestCase
{
    public function test_only_live_salons_with_staff_and_a_running_plan_are_listed(): void
    {
        $live = $this->makeSalon(['name' => 'Live trial']);
        $paid = $this->makeSalon(['name' => 'Live paid'], subscription: Subscription::ACTIVE);
        $this->makeSalon(['name' => 'Pending', 'status' => Business::PENDING]);
        $this->makeSalon(['name' => 'Suspended', 'status' => Business::SUSPENDED]);
        $this->makeSalon(['name' => 'No plan'], subscription: '');
        $this->makeSalon(['name' => 'Expired'], subscription: Subscription::EXPIRED);
        $this->makeSalon(['name' => 'Past due'], subscription: Subscription::PAST_DUE);
        $lapsed = $this->makeSalon(['name' => 'Trial over']);
        $lapsed->subscription->forceFill(['trial_ends_at' => now()->subMinute()])->save();
        $noMasters = $this->makeSalon(['name' => 'No masters']);
        $noMasters->masters()->delete();

        $res = $this->getJson('/api/salons')->assertOk()->assertHeader('Cache-Control', 'max-age=60, public');
        $this->assertEqualsCanonicalizing([$live->id, $paid->id], array_column($res->json(), 'id'));

        $this->getJson("/api/salons/{$live->id}")->assertOk()->assertJsonPath('name', 'Live trial');
        $this->getJson("/api/salons/{$lapsed->id}")->assertStatus(404)->assertJsonPath('error', 'not_found');
        $this->getJson('/api/salons/does-not-exist')->assertStatus(404)->assertJsonPath('error', 'not_found');
    }

    public function test_salon_shape_matches_the_contract(): void
    {
        $salon = $this->makeSalon(['about' => ['ru' => 'Только по-русски']]);
        $s = $this->getJson("/api/salons/{$salon->id}")->assertOk()->json();

        foreach (['id', 'name', 'kind', 'categories', 'tagline', 'about', 'address', 'district', 'coords', 'price_level', 'tone',
            'rating', 'review_count', 'distribution', 'hours', 'closed_days', 'phone', 'whatsapp', 'women_only', 'audience',
            'amenities', 'photos', 'services', 'masters'] as $k) {
            $this->assertArrayHasKey($k, $s, $k);
        }
        $this->assertSame(['az' => 'Только по-русски', 'ru' => 'Только по-русски', 'en' => 'Только по-русски'], $s['about']);
        $this->assertSame(['az', 'ru', 'en'], array_keys($s['kind']));
        $this->assertSame(['open' => '10:00', 'close' => '20:00'], $s['hours']);
        $this->assertSame(2, $s['price_level']);
        $this->assertSame([0, 0, 0, 0, 0], $s['distribution']);
        $this->assertSame(['id', 'key', 'name', 'description', 'category', 'duration_min', 'price'], array_keys($s['services'][0]));
        $this->assertSame(['id', 'name', 'role', 'years', 'rating', 'review_count', 'service_ids', 'work_days', 'shift', 'tone', 'languages', 'photo_url'], array_keys($s['masters'][0]));
        $this->assertSame([$s['services'][0]['id']], $s['masters'][0]['service_ids']);
    }

    public function test_listing_cache_is_flushed_when_a_salon_changes(): void
    {
        $salon = $this->makeSalon();
        $this->getJson('/api/salons')->assertJsonCount(1);
        $salon->forceFill(['status' => Business::SUSPENDED])->save();
        $this->getJson('/api/salons')->assertJsonCount(0);
    }

    public function test_reviews_are_paginated_newest_first(): void
    {
        $salon = $this->makeSalon();
        for ($i = 0; $i < 35; $i++) {
            (new Review)->forceFill([
                'business_id' => $salon->id, 'author' => "R{$i}", 'rating' => 5, 'text' => 't',
                'created_at' => now()->subDays($i), 'updated_at' => now(),
            ])->save();
        }
        $p1 = $this->getJson("/api/salons/{$salon->id}/reviews")->assertOk()->assertJsonCount(30, 'data')->assertJsonPath('next_page', 2);
        $this->assertSame('R0', $p1->json('data.0.author'));
        $this->getJson("/api/salons/{$salon->id}/reviews?page=2")->assertJsonCount(5, 'data')->assertJsonPath('next_page', null);
    }

    public function test_plans(): void
    {
        $this->getJson('/api/plans')->assertOk()->assertExactJson([
            ['id' => 'start', 'price' => 29], ['id' => 'pro', 'price' => 59], ['id' => 'studio', 'price' => 99],
        ]);
    }

    public function test_busy_lists_upcoming_bookings_without_client_details(): void
    {
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $user = User::factory()->create();
        $this->makeBooking($salon, $master, $user, '2026-10-13 07:00:00');
        $this->makeBooking($salon, $master, $user, '2026-10-13 09:00:00', ['status' => 'cancelled']);
        $this->makeBooking($salon, $master, $user, '2026-10-30 09:00:00'); // outside the window
        $other = $this->makeSalon(['name' => 'Other']);
        $this->makeBooking($other, $other->masters()->first(), $user, '2026-10-14 07:00:00');

        $res = $this->getJson('/api/busy')->assertOk()->assertHeader('Cache-Control', 'max-age=30, public');
        $this->assertCount(2, $res->json());
        $this->assertSame(['master_id', 'start', 'end'], array_keys($res->json('0')));
        $this->assertSame('2026-10-13T07:00:00.000Z', $res->json('0.start'));
        $this->assertSame('2026-10-13T08:00:00.000Z', $res->json('0.end'));

        $this->getJson('/api/busy?'.http_build_query(['salon_ids' => [$salon->id], 'from' => '2026-10-13', 'days' => 1]))
            ->assertJsonCount(1)->assertJsonPath('0.master_id', $master->id);
        $this->getJson('/api/busy?days=20')->assertStatus(422);
    }

    public function test_busy_is_recomputed_right_after_a_booking_changes(): void
    {
        $salon = $this->makeSalon();
        $master = $salon->masters()->first();
        $this->getJson('/api/busy')->assertOk()->assertJsonCount(0); // primes the 30 s cache

        $booking = $this->makeBooking($salon, $master, User::factory()->create(), '2026-10-13 07:00:00');
        $this->getJson('/api/busy')->assertJsonCount(1);

        $booking->update(['status' => 'cancelled']);
        $this->getJson('/api/busy')->assertJsonCount(0);
    }

    public function test_demo_catalogue_seeder_matches_the_app(): void
    {
        $this->seed(DemoCatalogueSeeder::class);
        $res = $this->getJson('/api/salons')->assertOk()->assertJsonCount(15);
        $s = collect($res->json())->firstWhere('id', 'old-town-barbers');
        $this->assertSame(4.9, $s['rating']);
        $this->assertSame(412, $s['review_count']);
        $this->assertSame('old-town-barbers.m1', $s['masters'][0]['id']);
        $this->assertSame('Rauf Məmmədov', $s['masters'][0]['name']);
        $this->assertEqualsWithDelta(1.0, array_sum($s['distribution']), 0.001);
        $this->assertSame(86, Review::query()->count());
        $this->assertTrue(collect($res->json())->firstWhere('id', 'maison-leyla')['women_only']);
    }
}
