<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Couture brands: showroom appointments, their own 39 ₼ plan with everything in Pro. */
class CouturePlanTest extends TestCase
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

    private function showroom(): Business
    {
        $b = $this->makeSalon(['name' => 'Atelier Nərmin', 'categories' => ['couture']], null, '');

        return $b->fresh();
    }

    public function test_a_couture_brand_gets_its_plan_with_the_pro_dashboard(): void
    {
        $b = $this->showroom();
        $h = $this->auth($b->owner);
        $this->assertSame('couture', $b->market());

        // Salon plans are not for showrooms.
        $this->postJson('/api/business/subscription/trial', ['plan' => 'pro'], $h)->assertStatus(422)->assertJsonPath('error', 'wrong_market');
        $this->postJson('/api/business/subscription/trial', ['plan' => 'couture'], $h)->assertOk()
            ->assertJsonPath('market', 'couture')
            ->assertJsonPath('subscription.plan', 'couture');

        $features = $this->getJson('/api/business', $h)->json('features');
        foreach (['booking', 'managers', 'deposits', 'waitlist', 'stats', 'personal_page'] as $f) {
            $this->assertContains($f, $features);
        }
        // Couture is one showroom; more showrooms need Couture Plus.
        $this->assertNotContains('branches', $features);
        $branch = ['salon_name' => 'Atelier Nərmin · Port Baku', 'address' => 'Neftçilər pr. 1', 'district' => 'Səbail'];
        $this->postJson('/api/business/branches', $branch, $h)->assertStatus(402);

        $this->postJson('/api/business/subscription/trial', ['plan' => 'couture_plus'], $h)->assertOk()
            ->assertJsonPath('subscription.plan', 'couture_plus');
        $this->assertContains('branches', $this->getJson('/api/business', $h)->json('features'));
        // A second showroom is a branch, billed like Pro's (3 included).
        $this->postJson('/api/business/branches', $branch, $h)->assertCreated();
        $this->getJson('/api/business/branches', $h)->assertOk()->assertJsonPath('price', 59);
    }

    public function test_salons_cannot_pick_the_couture_plan_or_mix_markets(): void
    {
        $salon = $this->makeSalon();
        $h = $this->auth($salon->owner);
        $this->assertSame('beauty', $salon->market());
        $this->postJson('/api/business/subscription/trial', ['plan' => 'couture'], $h)->assertStatus(422)->assertJsonPath('error', 'wrong_market');

        // Beauty and couture can't be mixed, and a salon on a beauty plan can't turn into a showroom.
        $this->patchJson('/api/business', ['categories' => ['barber', 'couture']], $h)->assertStatus(422);
        $this->patchJson('/api/business', ['categories' => ['couture']], $h)->assertStatus(422)->assertJsonPath('error', 'wrong_market');

        $this->postJson('/api/business/register', [
            'first_name' => 'Nərmin', 'last_name' => 'Əliyeva', 'phone' => '+994501112233', 'email' => 'nermin@atelier.az',
            'password' => 'Showroom123', 'salon_name' => 'Atelier', 'categories' => ['couture', 'makeup'],
            'district' => 'Səbail', 'address' => 'A 1', 'audience' => 'women',
        ])->assertStatus(422);
    }
}
