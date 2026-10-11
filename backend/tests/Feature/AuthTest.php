<?php

namespace Tests\Feature;

use App\Mail\OtpCodeMail;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthTest extends TestCase
{
    private array $person = [
        'first_name' => 'Aysel',
        'last_name' => 'Məmmədova',
        'phone' => '+994501234567',
        'birth_date' => '1995-04-06',
        'gender' => 'female',
        'email' => 'Aysel@Example.com ',
        'password' => 'secret123',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function lastCode(string $email): string
    {
        $code = null;
        Mail::assertQueued(OtpCodeMail::class, function (OtpCodeMail $m) use ($email, &$code) {
            if ($m->hasTo($email)) {
                $code = $m->code;
            }

            return true;
        });

        return $code;
    }

    public function test_register_creates_unverified_user_and_emails_a_code(): void
    {
        $res = $this->postJson('/api/auth/register', $this->person)->assertStatus(202)
            ->assertJsonStructure(['email', 'purpose', 'expires_at', 'resend_at'])
            ->assertJsonPath('email', 'aysel@example.com')
            ->assertJsonPath('purpose', 'register')
            ->assertJsonMissingPath('demo_code');

        $this->assertMatchesRegularExpression('/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/', $res->json('expires_at'));
        $user = User::query()->where('email', 'aysel@example.com')->first();
        $this->assertFalse($user->isVerified());
        $code = $this->lastCode('aysel@example.com');
        $this->assertMatchesRegularExpression('/^\d{6}$/', $code);
        $this->assertDatabaseMissing('one_time_codes', ['code_hash' => $code]);
    }

    public function test_demo_code_is_returned_only_in_local_env(): void
    {
        $this->app['env'] = 'local';
        $this->postJson('/api/auth/register', $this->person)->assertStatus(202)->assertJsonStructure(['demo_code']);
    }

    public function test_register_validates_like_the_app(): void
    {
        $this->postJson('/api/auth/register', ['phone' => '+994401234567', 'birth_date' => '2020-01-01', 'password' => 'short', 'first_name' => 'A1'] + $this->person)
            ->assertStatus(422)->assertJsonValidationErrors(['phone', 'birth_date', 'password', 'first_name']);
    }

    public function test_wrong_code_then_lockout_after_five_attempts(): void
    {
        $this->postJson('/api/auth/register', $this->person)->assertStatus(202);
        $code = $this->lastCode('aysel@example.com');
        $wrong = $code === '000000' ? '111111' : '000000';

        for ($i = 1; $i <= 4; $i++) {
            $this->postJson('/api/auth/email/verify', ['email' => 'aysel@example.com', 'code' => $wrong])
                ->assertStatus(422)->assertJsonPath('error', 'otp_invalid');
        }
        $this->postJson('/api/auth/email/verify', ['email' => 'aysel@example.com', 'code' => $wrong])
            ->assertJsonPath('error', 'too_many_attempts');
        // The code is dead now, even the right one.
        $this->postJson('/api/auth/email/verify', ['email' => 'aysel@example.com', 'code' => $code])
            ->assertJsonPath('error', 'too_many_attempts');
    }

    public function test_code_expires_after_ten_minutes(): void
    {
        $this->postJson('/api/auth/register', $this->person);
        $code = $this->lastCode('aysel@example.com');
        $this->travel(11)->minutes();
        $this->postJson('/api/auth/email/verify', ['email' => 'aysel@example.com', 'code' => $code])
            ->assertJsonPath('error', 'otp_expired');
    }

    public function test_verify_signs_in(): void
    {
        $this->postJson('/api/auth/register', $this->person);
        $code = $this->lastCode('aysel@example.com');

        $res = $this->postJson('/api/auth/email/verify', ['email' => 'aysel@example.com', 'code' => $code])
            ->assertOk()
            ->assertJsonPath('user.email', 'aysel@example.com')
            ->assertJsonPath('user.email_verified', true)
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonPath('user.provider', 'password')
            ->assertJsonPath('user.birth_date', '1995-04-06')
            ->assertJsonPath('business', null)
            ->assertJsonMissingPath('user.password');

        $this->getJson('/api/me', ['Authorization' => 'Bearer '.$res->json('token')])
            ->assertOk()->assertJsonPath('user.id', $res->json('user.id'))->assertJsonPath('token', $res->json('token'));
    }

    public function test_registering_a_verified_email_is_refused(): void
    {
        User::factory()->create(['email' => 'aysel@example.com']);
        $this->postJson('/api/auth/register', $this->person)->assertStatus(422)->assertJsonPath('error', 'email_taken');
    }

    public function test_resend_cooldown(): void
    {
        $this->postJson('/api/auth/register', $this->person);
        $this->postJson('/api/auth/otp/resend', ['email' => 'aysel@example.com', 'purpose' => 'register'])
            ->assertStatus(429)->assertJsonPath('error', 'resend_too_soon');
        $this->travel(61)->seconds();
        $this->postJson('/api/auth/otp/resend', ['email' => 'aysel@example.com', 'purpose' => 'register'])->assertStatus(202);
    }

    public function test_business_register_creates_pending_business(): void
    {
        $this->postJson('/api/business/register', [
            'first_name' => 'Elçin', 'last_name' => 'Quliyev', 'phone' => '+994551112233',
            'email' => 'owner@example.com', 'password' => 'secret123',
            'salon_name' => 'Kəsim Studio', 'categories' => ['barber', 'hair'],
            'district' => 'Yasamal', 'address' => 'Şərifzadə küç. 5', 'audience' => 'men',
        ])->assertStatus(202);

        $user = User::query()->where('email', 'owner@example.com')->first();
        $this->assertSame('business', $user->role);
        $business = Business::query()->where('owner_id', $user->id)->first();
        $this->assertSame('pending_review', $business->status);

        $code = $this->lastCode('owner@example.com');
        $this->postJson('/api/auth/email/verify', ['email' => 'owner@example.com', 'code' => $code])
            ->assertOk()
            ->assertJsonPath('business.salon_name', 'Kəsim Studio')
            ->assertJsonPath('business.status', 'pending_review')
            ->assertJsonPath('business.subscription', null)
            ->assertJsonPath('business.salon_id', $business->id);
    }

    public function test_login_gives_the_same_answer_for_unknown_email_and_wrong_password(): void
    {
        User::factory()->create(['email' => 'aysel@example.com']);

        $unknown = $this->postJson('/api/auth/login', ['email' => 'nobody@example.com', 'password' => 'secret123']);
        $wrong = $this->postJson('/api/auth/login', ['email' => 'aysel@example.com', 'password' => 'wrong1234']);

        $unknown->assertStatus(401)->assertJsonPath('error', 'invalid_credentials');
        $wrong->assertStatus(401);
        $this->assertSame($unknown->json(), $wrong->json());

        $this->postJson('/api/auth/login', ['email' => ' AYSEL@example.com', 'password' => 'secret123'])
            ->assertOk()->assertJsonStructure(['token', 'user', 'business']);
    }

    public function test_login_unverified_returns_not_verified_with_a_fresh_challenge(): void
    {
        User::factory()->unverified()->create(['email' => 'aysel@example.com']);
        $this->postJson('/api/auth/login', ['email' => 'aysel@example.com', 'password' => 'secret123'])
            ->assertStatus(403)
            ->assertJsonPath('error', 'not_verified')
            ->assertJsonPath('otp.email', 'aysel@example.com')
            ->assertJsonPath('otp.purpose', 'register');
        Mail::assertQueued(OtpCodeMail::class);
    }

    public function test_forgot_is_202_for_unknown_email_and_sends_nothing(): void
    {
        $this->postJson('/api/auth/password/forgot', ['email' => 'nobody@example.com'])
            ->assertStatus(202)->assertJsonStructure(['email', 'purpose', 'expires_at', 'resend_at']);
        Mail::assertNothingQueued();
    }

    public function test_reset_flow_revokes_old_tokens_and_is_single_use(): void
    {
        $user = User::factory()->create(['email' => 'aysel@example.com']);
        $old = $this->tokenFor($user);

        $this->postJson('/api/auth/password/forgot', ['email' => 'aysel@example.com'])->assertStatus(202);
        $code = $this->lastCode('aysel@example.com');
        $resetToken = $this->postJson('/api/auth/password/verify', ['email' => 'aysel@example.com', 'code' => $code])
            ->assertOk()->json('reset_token');
        $this->assertDatabaseMissing('password_reset_tokens', ['token' => $resetToken]);

        $res = $this->postJson('/api/auth/password/reset', ['reset_token' => $resetToken, 'password' => 'newpass123'])
            ->assertOk()->assertJsonStructure(['token', 'user']);

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me', ['Authorization' => "Bearer {$old}"])->assertStatus(401)->assertJsonPath('error', 'session_expired');
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me', ['Authorization' => 'Bearer '.$res->json('token')])->assertOk();

        $this->postJson('/api/auth/password/reset', ['reset_token' => $resetToken, 'password' => 'another123'])
            ->assertJsonPath('error', 'otp_expired');
        $this->postJson('/api/auth/login', ['email' => 'aysel@example.com', 'password' => 'newpass123'])->assertOk();
    }

    public function test_reset_token_expires_after_15_minutes(): void
    {
        User::factory()->create(['email' => 'aysel@example.com']);
        $this->postJson('/api/auth/password/forgot', ['email' => 'aysel@example.com']);
        $token = $this->postJson('/api/auth/password/verify', ['email' => 'aysel@example.com', 'code' => $this->lastCode('aysel@example.com')])->json('reset_token');
        $this->travel(16)->minutes();
        $this->postJson('/api/auth/password/reset', ['reset_token' => $token, 'password' => 'newpass123'])
            ->assertJsonPath('error', 'otp_expired');
    }

    public function test_patch_me_and_logout(): void
    {
        $user = User::factory()->create(['phone' => null, 'birth_date' => null, 'gender' => null]);
        $token = $this->tokenFor($user);
        $h = ['Authorization' => "Bearer {$token}"];

        $this->getJson('/api/me', $h)->assertJsonPath('user.phone', '')->assertJsonPath('user.birth_date', '');
        $this->patchJson('/api/me', ['phone' => '+994 70 123 45 67', 'gender' => 'male', 'role' => 'business', 'email' => 'x@y.z'], $h)
            ->assertOk()->assertJsonPath('phone', '+994701234567')->assertJsonPath('gender', 'male')
            ->assertJsonPath('role', 'customer')->assertJsonPath('email', $user->email);
        $this->patchJson('/api/me', ['birth_date' => now()->subYears(10)->toDateString()], $h)->assertStatus(422);

        $this->postJson('/api/auth/logout', [], $h)->assertNoContent();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me', $h)->assertStatus(401)->assertJsonPath('error', 'session_expired');
    }

    public function test_auth_endpoints_are_rate_limited_per_email(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/auth/login', ['email' => 'x@example.com', 'password' => 'whatever1'])->assertStatus(401);
        }
        $this->postJson('/api/auth/login', ['email' => 'x@example.com', 'password' => 'whatever1'])
            ->assertStatus(429)->assertJsonPath('error', 'too_many_attempts');
    }
}
