<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Rules\V;
use App\Services\SessionService;
use App\Services\SocialTokenVerifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SocialAuthController extends Controller
{
    public function __construct(private SocialTokenVerifier $verifier, private SessionService $sessions) {}

    public function google(Request $request): JsonResponse
    {
        $data = $request->validate(['id_token' => ['required', 'string', 'max:8192']]);
        $claims = $this->verifier->verify('google', $data['id_token']);
        if (! filter_var($claims['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN) || empty($claims['email'])) {
            throw new ApiException(401, 'invalid_credentials', 'Your Google email is not verified.');
        }

        $user = $this->findOrCreate('google', (string) $claims['sub'], (string) $claims['email'], [
            'first_name' => $claims['given_name'] ?? null,
            'last_name' => $claims['family_name'] ?? null,
        ]);

        return response()->json($this->sessions->open($user, $request));
    }

    public function apple(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate([
            'id_token' => ['required', 'string', 'max:8192'],
            'email' => ['nullable', 'string', 'max:254'],
            'first_name' => ['nullable', 'string', 'max:60'],
            'last_name' => ['nullable', 'string', 'max:60'],
        ]);
        $claims = $this->verifier->verify('apple', $data['id_token']);

        // The address comes from the signed token only; the body's email is
        // never trusted for finding or linking an account.
        $email = isset($claims['email']) && filter_var($claims['email_verified'] ?? true, FILTER_VALIDATE_BOOLEAN)
            ? (string) $claims['email'] : null;

        $user = $this->findOrCreate('apple', (string) $claims['sub'], $email, [
            // Apple sends the name only on the first sign-in, in the request body.
            'first_name' => $data['first_name'] ?? null,
            'last_name' => $data['last_name'] ?? null,
        ]);

        return response()->json($this->sessions->open($user, $request));
    }

    private function findOrCreate(string $provider, string $sub, ?string $email, array $names): User
    {
        $column = "{$provider}_sub";
        $email = $email ? mb_strtolower(trim($email)) : null;

        return DB::transaction(function () use ($provider, $column, $sub, $email, $names) {
            $user = User::query()->where($column, $sub)->first()
                ?? ($email ? User::query()->where('email', $email)->first() : null);

            if (! $user) {
                if (! $email) {
                    throw new ApiException(422, 'validation', 'The sign-in did not share an email address.', [
                        'errors' => ['email' => ['An email address is required.']],
                    ]);
                }
                $user = new User;
                $user->email = $email;
                $user->first_name = $this->cleanName($names['first_name']);
                $user->last_name = $this->cleanName($names['last_name']);
                $user->role = 'customer';
                $user->provider = $provider;
            } elseif (! $user->isVerified()) {
                // An unconfirmed password sign-up with this address: whoever
                // chose that password never proved they own the inbox.
                $user->password = null;
                $user->provider = $provider;
            }

            foreach (['first_name', 'last_name'] as $f) {
                if (($user->{$f} ?? '') === '' && ($clean = $this->cleanName($names[$f]))) {
                    $user->{$f} = $clean;
                }
            }
            $user->{$column} = $sub;
            // The provider has verified the address.
            $user->email_verified_at ??= now();
            $user->save();

            return $user;
        });
    }

    private function cleanName(?string $name): string
    {
        $name = trim((string) $name);

        return $name !== '' && preg_match(V::NAME, $name) ? $name : '';
    }
}
