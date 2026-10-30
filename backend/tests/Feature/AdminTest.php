<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\AdminAction;
use App\Models\Business;
use App\Models\Review;
use App\Models\ReviewReport;
use App\Models\Subscription;
use App\Models\User;
use App\Support\Totp;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminTest extends TestCase
{
    private const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

    private function admin(array $attrs = []): Admin
    {
        $a = new Admin(['name' => 'Leyla Staff', 'email' => 'leyla@usta.az']);
        $a->forceFill($attrs + ['password' => 'correct-horse-42', 'totp_secret' => self::SECRET])->save();

        return $a;
    }

    private function code(int $offsetSteps = 0): string
    {
        return Totp::code(self::SECRET, intdiv(now()->getTimestamp(), 30) + $offsetSteps);
    }

    private function signIn(?Admin $admin = null): Admin
    {
        $admin ??= $this->admin();
        $this->actingAs($admin, 'admin')->withSession(['admin_seen' => now()->getTimestamp()]);

        return $admin;
    }

    public function test_pages_need_a_signed_in_admin(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->get('/admin/salons')->assertRedirect('/admin/login');
        $this->post('/admin/salons/x/approve')->assertRedirect('/admin/login');

        // An app user's session or token is not an admin session.
        $user = User::factory()->create();
        $this->actingAs($user, 'web')->get('/admin')->assertRedirect('/admin/login');
        $this->get('/admin/login')->assertOk()->assertSee('Authenticator code');
    }

    public function test_sign_in_needs_password_and_a_fresh_code(): void
    {
        $admin = $this->admin();

        $this->post('/admin/login', ['email' => 'leyla@usta.az', 'password' => 'wrong', 'code' => $this->code()])
            ->assertSessionHasErrors(['email' => 'The email, password or code is wrong.']);
        $this->post('/admin/login', ['email' => 'leyla@usta.az', 'password' => 'correct-horse-42', 'code' => '000000'])
            ->assertSessionHasErrors('email');
        $this->assertGuest('admin');

        $code = $this->code();
        $this->post('/admin/login', ['email' => 'LEYLA@usta.az ', 'password' => 'correct-horse-42', 'code' => substr($code, 0, 3).' '.substr($code, 3)])
            ->assertRedirect('/admin');
        $this->assertAuthenticatedAs($admin, 'admin');
        $this->assertDatabaseHas('admin_actions', ['admin_id' => $admin->id, 'action' => 'login']);
        $this->assertNotNull($admin->fresh()->last_login_at);

        // The same code can't be used twice.
        $this->post('/admin/logout')->assertRedirect('/admin/login');
        $this->post('/admin/login', ['email' => 'leyla@usta.az', 'password' => 'correct-horse-42', 'code' => $code])
            ->assertSessionHasErrors('email');
    }

    public function test_disabled_admins_and_brute_force_are_refused(): void
    {
        $this->admin(['disabled_at' => now()]);
        $this->post('/admin/login', ['email' => 'leyla@usta.az', 'password' => 'correct-horse-42', 'code' => $this->code()])
            ->assertSessionHasErrors('email');

        Admin::query()->update(['disabled_at' => null]);
        for ($i = 0; $i < 5; $i++) {
            $this->post('/admin/login', ['email' => 'leyla@usta.az', 'password' => 'nope', 'code' => '123456']);
        }
        $this->post('/admin/login', ['email' => 'leyla@usta.az', 'password' => 'correct-horse-42', 'code' => $this->code()])
            ->assertSessionHasErrors('email');
        $this->assertStringContainsString('Too many attempts', session('errors')->first('email'));
        $this->assertGuest('admin');
    }

    public function test_idle_sessions_and_disabled_admins_are_signed_out(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin, 'admin')->withSession(['admin_seen' => now()->subMinutes(31)->getTimestamp()])
            ->get('/admin')->assertRedirect('/admin/login');
        $this->assertGuest('admin');

        $admin->forceFill(['disabled_at' => now()])->save();
        $this->actingAs($admin->fresh(), 'admin')->withSession(['admin_seen' => now()->getTimestamp()])
            ->get('/admin')->assertRedirect('/admin/login');
    }

    public function test_every_page_renders_with_strict_headers(): void
    {
        $this->signIn();
        $salon = $this->makeSalon(['status' => Business::PENDING]);
        $user = User::factory()->create();
        $this->makeBooking($salon, $salon->masters()->first(), $user, '2026-10-13 08:00:00');

        $res = $this->get('/admin')->assertOk()->assertSee('Salons waiting for review')->assertSee($salon->name);
        $this->assertStringContainsString("frame-ancestors 'none'", $res->headers->get('Content-Security-Policy'));
        $this->assertSame('DENY', $res->headers->get('X-Frame-Options'));
        $this->assertStringContainsString('no-store', $res->headers->get('Cache-Control'));

        foreach ([
            '/admin/salons', '/admin/salons?status=pending_review&sub=trialing&q=Test', '/admin/salons?status=deleted',
            "/admin/salons/{$salon->id}", '/admin/users', '/admin/users?role=business&q=example', "/admin/users/{$user->id}",
            '/admin/bookings', '/admin/bookings?from=2026-10-01&to=2026-10-31&status=upcoming&q=Test', '/admin/reviews',
            '/admin/reviews?tab=all', '/admin/reviews?tab=hidden', '/admin/payments', '/admin/payments?status=paid', '/admin/activity',
        ] as $url) {
            $this->get($url)->assertOk();
        }
        $this->get('/admin/salons/nope')->assertNotFound();
    }

    public function test_approve_suspend_and_reinstate_a_salon(): void
    {
        $admin = $this->signIn();
        $salon = $this->makeSalon(['status' => Business::PENDING, 'name' => 'Fresh Cuts']);
        $this->getJson('/api/salons')->assertJsonCount(0);

        $this->post("/admin/salons/{$salon->id}/approve")->assertRedirect()->assertSessionHas('status', fn ($s) => str_contains($s, 'in search now'));
        $this->assertSame(Business::LIVE, $salon->fresh()->status);
        $this->assertNotNull($salon->fresh()->approved_at);
        $this->getJson('/api/salons')->assertJsonCount(1);

        $this->post("/admin/salons/{$salon->id}/suspend")->assertSessionHasErrors('reason');
        $this->post("/admin/salons/{$salon->id}/suspend", ['reason' => 'Fake photos'])->assertRedirect();
        $this->assertSame(Business::SUSPENDED, $salon->fresh()->status);
        $this->assertSame('Fake photos', $salon->fresh()->suspended_reason);
        $this->getJson('/api/salons')->assertJsonCount(0);
        $this->get("/admin/salons/{$salon->id}")->assertOk()->assertSee('Fake photos')->assertSee('Reinstate');
        $this->get('/admin/salons?status=suspended')->assertOk()->assertSee('Fresh Cuts');
        $this->get("/admin/salons/{$salon->id}")->assertSee('<span class="badge b-trialing">Trial</span>', false);

        $this->post("/admin/salons/{$salon->id}/approve")->assertRedirect();
        $this->assertSame(Business::LIVE, $salon->fresh()->status);
        $this->assertNull($salon->fresh()->suspended_at);

        $this->assertSame(['salon.approve', 'salon.suspend', 'salon.reinstate'],
            AdminAction::query()->where('subject_id', $salon->id)->orderBy('id')->pluck('action')->all());
        $this->assertSame($admin->id, AdminAction::query()->where('action', 'salon.suspend')->value('admin_id'));
        $this->get("/admin/salons/{$salon->id}")->assertSee('Suspended Fresh Cuts: Fake photos');
    }

    public function test_extend_a_trial_and_restart_a_lapsed_plan(): void
    {
        $this->signIn();
        $salon = $this->makeSalon();
        $sub = $salon->subscription;
        $end = $sub->trial_ends_at->copy();
        $sub->forceFill(['trial_reminded_3d_at' => now()])->save();

        $this->post("/admin/salons/{$salon->id}/extend", ['days' => 0, 'reason' => 'x'])->assertSessionHasErrors('days');
        $this->post("/admin/salons/{$salon->id}/extend", ['days' => 10, 'reason' => 'Approved late'])->assertRedirect();
        $sub->refresh();
        $this->assertSame($end->addDays(10)->toDateTimeString(), $sub->trial_ends_at->toDateTimeString());
        $this->assertNull($sub->trial_reminded_3d_at);

        // Expired long ago: the new days count from today.
        $sub->forceFill(['status' => Subscription::EXPIRED, 'trial_ends_at' => now()->subDays(40)])->save();
        $this->getJson('/api/salons')->assertJsonCount(0);
        $this->post("/admin/salons/{$salon->id}/extend", ['days' => 14, 'reason' => 'Goodwill'])->assertRedirect();
        $sub->refresh();
        $this->assertSame(Subscription::TRIALING, $sub->status);
        $this->assertSame(now()->addDays(14)->toDateTimeString(), $sub->trial_ends_at->toDateTimeString());
        $this->getJson('/api/salons')->assertJsonCount(1);

        // A paying salon gets days on the paid period.
        $paid = $this->makeSalon(['name' => 'Paid'], subscription: Subscription::ACTIVE);
        $periodEnd = $paid->subscription->current_period_end->copy();
        $this->post("/admin/salons/{$paid->id}/extend", ['days' => 5, 'reason' => 'Outage'])->assertRedirect();
        $this->assertSame($periodEnd->addDays(5)->toDateTimeString(), $paid->subscription->fresh()->current_period_end->toDateTimeString());

        $this->assertDatabaseHas('admin_actions', ['action' => 'salon.extend', 'subject_id' => $salon->id]);
    }

    public function test_change_plan(): void
    {
        $this->signIn();
        $salon = $this->makeSalon();
        $this->post("/admin/salons/{$salon->id}/plan", ['plan' => 'studio'])->assertSessionHasErrors('plan');
        $this->post("/admin/salons/{$salon->id}/plan", ['plan' => 'pro'])->assertRedirect();
        $this->assertSame('pro', $salon->subscription->fresh()->plan);
        $this->assertDatabaseHas('admin_actions', ['action' => 'salon.plan', 'summary' => 'Changed Test Barbers from start to pro']);

        $none = $this->makeSalon(['name' => 'No plan'], subscription: '');
        $this->post("/admin/salons/{$none->id}/plan", ['plan' => 'pro'])->assertSessionHasErrors('plan');
    }

    public function test_reported_reviews_can_be_hidden_restored_or_dismissed(): void
    {
        $this->signIn();
        $salon = $this->makeSalon();
        $user = User::factory()->create();
        $review = new Review;
        $review->forceFill(['business_id' => $salon->id, 'user_id' => $user->id, 'author' => 'Aysel M.', 'rating' => 1, 'text' => 'Spam spam buy now', 'report_count' => 2])->save();
        foreach (['spam', 'fake'] as $i => $reason) {
            (new ReviewReport)->forceFill(['review_id' => $review->id, 'user_id' => User::factory()->create()->id, 'reason' => $reason])->save();
        }
        $this->get('/admin/reviews')->assertOk()->assertSee('Spam spam buy now')->assertSee('2 open reports');
        $this->get('/admin')->assertSee('Reported reviews');

        $this->post("/admin/reviews/{$review->id}/hide")->assertRedirect();
        $this->assertNotNull($review->fresh()->hidden_at);
        $this->assertSame(0, ReviewReport::query()->whereNull('resolved_at')->count());
        $this->getJson("/api/salons/{$salon->id}/reviews")->assertJsonCount(0, 'data');
        $this->get('/admin/reviews')->assertSee('No open reports.');
        $this->get('/admin/reviews?tab=hidden')->assertSee('Spam spam buy now');

        $this->post("/admin/reviews/{$review->id}/restore")->assertRedirect();
        $this->assertNull($review->fresh()->hidden_at);
        $this->assertSame(0, $review->fresh()->report_count);

        (new ReviewReport)->forceFill(['review_id' => $review->id, 'user_id' => User::factory()->create()->id, 'reason' => 'other'])->save();
        $this->post("/admin/reviews/{$review->id}/dismiss")->assertRedirect();
        $this->assertNull($review->fresh()->hidden_at);
        $this->assertSame(0, ReviewReport::query()->whereNull('resolved_at')->count());
        $this->assertSame(['review.hide', 'review.restore', 'review.dismiss'], AdminAction::query()->where('subject_type', 'review')->orderBy('id')->pluck('action')->all());
    }

    public function test_sign_a_user_out_everywhere(): void
    {
        $this->signIn();
        $user = User::factory()->create();
        $token = $user->createToken('phone')->plainTextToken;
        $user->createToken('tablet');

        $this->post("/admin/users/{$user->id}/sign-out")->assertRedirect()->assertSessionHas('status', fn ($s) => str_contains($s, '2 session'));
        $this->assertSame(0, $user->tokens()->count());
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me', ['Authorization' => "Bearer {$token}"])->assertStatus(401);
    }

    public function test_delete_an_account_only_after_typing_its_email(): void
    {
        Mail::fake();
        $this->signIn();
        $user = User::factory()->create(['email' => 'gone@example.com']);

        $this->post("/admin/users/{$user->id}/delete", ['confirm' => 'someone@else.com', 'reason' => 'Asked'])->assertSessionHasErrors('confirm');
        $this->post("/admin/users/{$user->id}/delete", ['confirm' => 'gone@example.com'])->assertSessionHasErrors('reason');
        $this->assertNotNull(User::query()->find($user->id));

        $this->post("/admin/users/{$user->id}/delete", ['confirm' => ' GONE@example.com', 'reason' => 'Asked by email'])->assertRedirect('/admin/users');
        $this->assertNull(User::query()->find($user->id));
        $this->assertDatabaseHas('admin_actions', ['action' => 'user.delete', 'summary' => 'Deleted gone@example.com: Asked by email']);
        $this->get('/admin/activity')->assertSee('Deleted gone@example.com');
    }

    public function test_deleting_an_owner_unpublishes_their_salon(): void
    {
        Mail::fake();
        $this->signIn();
        $salon = $this->makeSalon();
        $owner = $salon->owner;

        $this->post("/admin/users/{$owner->id}/delete", ['confirm' => $owner->email, 'reason' => 'Closed the business'])->assertRedirect();
        $this->assertSoftDeleted('businesses', ['id' => $salon->id]);
        $this->getJson('/api/salons')->assertJsonCount(0);
        $this->get("/admin/salons/{$salon->id}")->assertOk()->assertSee('Deleted');
    }

    public function test_create_admin_command(): void
    {
        $this->artisan('usta:create-admin', ['--email' => 'Ops@Usta.az', '--name' => 'Ops Person'])
            ->expectsQuestion('Password (at least 12 characters, letters and numbers)', 'short')
            ->assertFailed();

        $this->artisan('usta:create-admin', ['--email' => 'Ops@Usta.az', '--name' => 'Ops Person'])
            ->expectsQuestion('Password (at least 12 characters, letters and numbers)', 'a-long-password-77')
            ->expectsQuestion('Repeat the password', 'a-long-password-77')
            ->expectsOutputToContain('Key: ')
            ->assertSuccessful();
        $admin = Admin::query()->where('email', 'ops@usta.az')->firstOrFail();
        $this->assertSame(32, strlen($admin->totp_secret));
        $this->assertNotSame($admin->totp_secret, $admin->getRawOriginal('totp_secret')); // stored encrypted

        $this->artisan('usta:create-admin', ['--email' => 'ops@usta.az', '--disable' => true])->assertSuccessful();
        $this->assertNotNull($admin->fresh()->disabled_at);
    }

    public function test_totp_matches_rfc_6238(): void
    {
        $secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; // "12345678901234567890"
        $this->assertSame('287082', Totp::code($secret, intdiv(59, 30)));
        $this->assertSame('081804', Totp::code($secret, intdiv(1111111109, 30)));
        $this->assertSame(intdiv(59, 30), Totp::verify($secret, '287082', null, 59));
        $this->assertNull(Totp::verify($secret, '287082', intdiv(59, 30), 59)); // used
        $this->assertNull(Totp::verify($secret, '28708', null, 59));
    }
}
