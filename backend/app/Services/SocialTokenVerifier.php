<?php

namespace App\Services;

use App\Exceptions\ApiException;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Verifies Google and Apple id_tokens: RS256 signature against the provider's
 * JWKS (cached), `iss`, `aud` (our client IDs) and expiry.
 */
class SocialTokenVerifier
{
    /** @return array<string, mixed> the verified claims */
    public function verify(string $provider, string $idToken): array
    {
        $cfg = config("services.{$provider}");
        if (! $cfg || empty($cfg['client_ids'])) {
            Log::warning("Social sign-in with {$provider} attempted but no client IDs are configured.");
            throw $this->invalid();
        }

        $claims = $this->decode($provider, $cfg['jwks_url'], $idToken);

        if (! in_array($claims['iss'] ?? null, $cfg['issuers'], true)) {
            throw $this->invalid();
        }
        $aud = (array) ($claims['aud'] ?? []);
        if (array_intersect($aud, $cfg['client_ids']) === []) {
            throw $this->invalid();
        }
        if (empty($claims['sub'])) {
            throw $this->invalid();
        }

        return $claims;
    }

    private function decode(string $provider, string $url, string $idToken): array
    {
        JWT::$leeway = 60;
        $attempt = function (bool $fresh) use ($provider, $url, $idToken) {
            $keys = JWK::parseKeySet($this->jwks($provider, $url, $fresh), 'RS256');

            return (array) JWT::decode($idToken, $keys);
        };

        try {
            return $attempt(false);
        } catch (\UnexpectedValueException $e) {
            // A key rotation: the token's kid isn't in our cached set yet.
            if (str_contains($e->getMessage(), '"kid"')) {
                try {
                    return $attempt(true);
                } catch (Throwable) {
                    throw $this->invalid();
                }
            }
            throw $this->invalid();
        } catch (Throwable) {
            throw $this->invalid();
        }
    }

    private function jwks(string $provider, string $url, bool $fresh): array
    {
        $key = "jwks:{$provider}";
        if ($fresh) {
            Cache::forget($key);
        }

        return Cache::remember($key, now()->addHours(6), function () use ($url) {
            $res = Http::timeout(5)->retry(2, 200)->get($url);
            if (! $res->successful() || ! is_array($res->json('keys'))) {
                throw new \RuntimeException('Could not fetch JWKS.');
            }

            return $res->json();
        });
    }

    private function invalid(): ApiException
    {
        return new ApiException(401, 'invalid_credentials', 'The sign-in token could not be verified.');
    }
}
