<?php

namespace Tests\Feature;

use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SocialAuthTest extends TestCase
{
    private ?string $privateKey = null;

    private array $jwks;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.google.client_ids' => ['ios.apps.googleusercontent.com', 'web.apps.googleusercontent.com'],
            'services.apple.client_ids' => ['az.usta.app'],
        ]);

        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($key, $this->privateKey);
        $d = openssl_pkey_get_details($key)['rsa'];
        $b64 = fn ($v) => rtrim(strtr(base64_encode($v), '+/', '-_'), '=');
        $this->jwks = ['keys' => [['kty' => 'RSA', 'kid' => 'test-kid', 'use' => 'sig', 'alg' => 'RS256', 'n' => $b64($d['n']), 'e' => $b64($d['e'])]]];

        Http::fake([
            'www.googleapis.com/oauth2/v3/certs' => Http::response($this->jwks),
            'appleid.apple.com/auth/keys' => Http::response($this->jwks),
        ]);
    }

    private function token(array $claims, ?string $key = null): string
    {
        return JWT::encode($claims + ['iat' => time(), 'exp' => time() + 3600], $key ?? $this->privateKey, 'RS256', 'test-kid');
    }

    private function google(array $over = []): array
    {
        return $over + [
            'iss' => 'https://accounts.google.com',
            'aud' => 'ios.apps.googleusercontent.com',
            'sub' => 'g-123',
            'email' => 'Leyla@Gmail.com',
            'email_verified' => true,
            'given_name' => 'Leyla',
            'family_name' => 'Həsənova',
        ];
    }

    public function test_google_creates_a_verified_user(): void
    {
        $this->postJson('/api/auth/social/google', ['id_token' => $this->token($this->google())])
            ->assertOk()
            ->assertJsonPath('user.email', 'leyla@gmail.com')
            ->assertJsonPath('user.provider', 'google')
            ->assertJsonPath('user.first_name', 'Leyla')
            ->assertJsonPath('user.email_verified', true)
            ->assertJsonPath('user.phone', '');

        // Second sign-in finds the same user.
        $this->postJson('/api/auth/social/google', ['id_token' => $this->token($this->google())])->assertOk();
        $this->assertSame(1, User::query()->count());
        Http::assertSentCount(1); // JWKS cached
    }

    public function test_google_rejects_wrong_audience_issuer_expiry_and_signature(): void
    {
        $bad = [
            $this->token($this->google(['aud' => 'someone-else'])),
            $this->token($this->google(['iss' => 'https://evil.example'])),
            $this->token($this->google(['email_verified' => false])),
            JWT::encode($this->google() + ['iat' => time() - 7200, 'exp' => time() - 3600], $this->privateKey, 'RS256', 'test-kid'),
        ];
        $other = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        openssl_pkey_export($other, $otherPem);
        $bad[] = $this->token($this->google(), $otherPem);
        $bad[] = 'not-a-jwt';

        foreach ($bad as $t) {
            $this->postJson('/api/auth/social/google', ['id_token' => $t])
                ->assertStatus(401)->assertJsonPath('error', 'invalid_credentials');
        }
        $this->assertSame(0, User::query()->count());
    }

    public function test_google_links_to_an_existing_password_account(): void
    {
        $user = User::factory()->create(['email' => 'leyla@gmail.com']);
        $this->postJson('/api/auth/social/google', ['id_token' => $this->token($this->google())])
            ->assertOk()->assertJsonPath('user.id', $user->id)->assertJsonPath('user.provider', 'password');
    }

    public function test_apple_stores_the_name_from_the_first_sign_in(): void
    {
        $claims = ['iss' => 'https://appleid.apple.com', 'aud' => 'az.usta.app', 'sub' => 'apple-001', 'email' => 'x1@privaterelay.appleid.com', 'email_verified' => 'true'];

        $this->postJson('/api/auth/social/apple', ['id_token' => $this->token($claims), 'first_name' => 'Nigar', 'last_name' => 'Əliyeva'])
            ->assertOk()->assertJsonPath('user.first_name', 'Nigar')->assertJsonPath('user.provider', 'apple');

        // Later sign-ins: no name, no email in the token; found by `sub`.
        unset($claims['email']);
        $this->postJson('/api/auth/social/apple', ['id_token' => $this->token($claims)])
            ->assertOk()->assertJsonPath('user.first_name', 'Nigar')->assertJsonPath('user.email', 'x1@privaterelay.appleid.com');
        $this->assertSame(1, User::query()->count());
    }

    public function test_apple_rejects_a_token_for_another_app(): void
    {
        $claims = ['iss' => 'https://appleid.apple.com', 'aud' => 'com.other.app', 'sub' => 'apple-001', 'email' => 'a@b.cd'];
        $this->postJson('/api/auth/social/apple', ['id_token' => $this->token($claims)])->assertStatus(401);
    }
}
