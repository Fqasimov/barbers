<?php

namespace Tests\Feature;

use App\Http\Middleware\AdminAuthenticate;
use App\Models\Admin;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Fixes from the security audit (run 1). */
class SecurityFixesTest extends TestCase
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

    public function test_salon_owner_cant_review_their_own_salon_through_a_booking(): void
    {
        $salon = $this->makeSalon();
        $service = $salon->services()->first();
        $master = $salon->masters()->first();
        $h = $this->auth($salon->owner);
        $id = $this->postJson('/api/bookings', [
            'salon_id' => $salon->id, 'master_id' => $master->id, 'service_ids' => [$service->id], 'start' => '2026-10-13T08:00:00.000Z',
        ], $h)->assertStatus(201)->json('id');
        $this->travel(3)->days();
        $this->postJson("/api/bookings/{$id}/review", ['rating' => 5, 'text' => null], $h)->assertStatus(422)->assertJsonPath('error', 'own_salon');
    }

    public function test_unknown_admin_email_gets_the_same_answer_as_a_wrong_password(): void
    {
        $this->get('/admin/login');
        $this->post('/admin/login', ['email' => 'nobody@example.com', 'password' => 'x', 'code' => '123456'])
            ->assertStatus(302)->assertSessionHasErrors('email');
    }

    public function test_admin_sessions_end_when_the_password_is_reset(): void
    {
        $admin = new Admin;
        $admin->forceFill(['name' => 'A', 'email' => 'a@example.com', 'password' => 'old-password-123', 'totp_secret' => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'])->save();
        $session = ['admin_seen' => now()->getTimestamp(), 'admin_key' => AdminAuthenticate::credentialKey($admin)];
        $this->actingAs($admin, 'admin')->withSession($session)->get('/admin')->assertOk();

        $admin->forceFill(['password' => 'new-password-456'])->save();
        $this->actingAs($admin->fresh(), 'admin')->withSession($session)->get('/admin')->assertRedirect(route('admin.login'));
    }

    public function test_sign_ins_without_an_email_dont_share_one_limit(): void
    {
        foreach (range(1, 12) as $i) {
            $this->withServerVariables(['REMOTE_ADDR' => "10.0.0.{$i}"])
                ->postJson('/api/auth/social/google', ['id_token' => 'junk'])->assertStatus(401);
        }
    }

    public function test_password_guessing_stops_after_the_daily_limit(): void
    {
        config(['usta.login_daily_failures' => 3]);
        $user = User::factory()->create(['email' => 'g@example.com', 'password' => 'right-pass-1']);
        foreach (range(1, 3) as $i) {
            $this->withServerVariables(['REMOTE_ADDR' => "10.1.0.{$i}"])
                ->postJson('/api/auth/login', ['email' => 'g@example.com', 'password' => 'wrong-pass-1'])->assertStatus(401);
        }
        $this->withServerVariables(['REMOTE_ADDR' => '10.1.0.9'])
            ->postJson('/api/auth/login', ['email' => 'g@example.com', 'password' => 'right-pass-1'])->assertStatus(429);
    }

    public function test_sade_has_no_calendar(): void
    {
        $salon = $this->makeSalon();
        Subscription::query()->where('business_id', $salon->id)->update(['plan' => 'sade']);
        $this->postJson('/api/business/blocks', ['start' => '2026-10-13T08:00:00.000Z', 'end' => '2026-10-13T09:00:00.000Z'], $this->auth($salon->owner))
            ->assertStatus(402);
    }
}
