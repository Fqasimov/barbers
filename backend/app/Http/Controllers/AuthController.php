<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Models\Business;
use App\Models\User;
use App\Rules\V;
use App\Services\OtpService;
use App\Services\SessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function __construct(private OtpService $otp, private SessionService $sessions) {}

    public function register(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate([
            'first_name' => ['required', ...V::name()],
            'last_name' => ['required', ...V::name()],
            'phone' => ['required', ...V::phone()],
            'birth_date' => ['required', ...V::birthDate()],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'email' => ['required', ...V::email()],
            'password' => ['required', ...V::password()],
        ]);

        DB::transaction(function () use ($data) {
            $this->replaceUnverified($data['email']);
            $user = new User;
            $user->fill(collect($data)->only(['first_name', 'last_name', 'phone', 'birth_date', 'gender', 'email'])->all());
            $user->role = 'customer';
            $user->provider = 'password';
            $user->password = $data['password'];
            $user->save();
        });

        return response()->json($this->otp->issue($data['email'], 'register', true), 202);
    }

    public function registerBusiness(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate([
            'first_name' => ['required', ...V::name()],
            'last_name' => ['required', ...V::name()],
            'phone' => ['required', ...V::phone()],
            'email' => ['required', ...V::email()],
            'password' => ['required', ...V::password()],
            'salon_name' => ['required', 'string', 'min:2', 'max:120'],
            'categories' => ['required', 'array', 'min:1'],
            'categories.*' => ['string', 'distinct', Rule::in(config('usta.categories'))],
            'district' => ['required', 'string', 'max:120'],
            'address' => ['required', 'string', 'max:255'],
            'audience' => ['required', Rule::in(['all', 'women', 'men'])],
        ]);

        DB::transaction(function () use ($data) {
            $this->replaceUnverified($data['email']);
            $user = new User;
            $user->fill(collect($data)->only(['first_name', 'last_name', 'phone', 'email'])->all());
            $user->role = 'business';
            $user->provider = 'password';
            $user->password = $data['password'];
            $user->save();

            $business = new Business;
            $business->forceFill([
                'owner_id' => $user->id,
                'name' => $data['salon_name'],
                'categories' => array_values($data['categories']),
                'district' => trim($data['district']),
                'address' => trim($data['address']),
                'audience' => $data['audience'],
                'closed_days' => [],
                'phone' => $data['phone'],
                'whatsapp' => ltrim($data['phone'], '+'),
                'status' => Business::PENDING,
            ])->save();
        });

        return response()->json($this->otp->issue($data['email'], 'register', true), 202);
    }

    public function verifyEmail(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate([
            'email' => ['required', 'string', 'max:254'],
            'code' => ['required', 'string', 'max:12'],
        ]);
        $this->otp->verify($data['email'], 'register', trim($data['code']));
        $user = User::query()->where('email', $data['email'])->first();
        if (! $user) {
            throw ApiException::notFound('No account for this email.');
        }
        if (! $user->isVerified()) {
            $user->email_verified_at = now();
            $user->save();
        }

        return response()->json($this->sessions->open($user, $request));
    }

    public function resend(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate([
            'email' => ['required', 'string', 'max:254'],
            'purpose' => ['required', Rule::in(['register', 'reset'])],
        ]);
        $user = User::query()->where('email', $data['email'])->first();
        $eligible = $data['purpose'] === 'register'
            ? $user && ! $user->isVerified()
            : $user && $user->password !== null;

        return response()->json(
            $eligible ? $this->otp->issue($data['email'], $data['purpose']) : $this->otp->decoy($data['email'], $data['purpose']),
            202,
        );
    }

    public function login(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate([
            'email' => ['required', 'string', 'max:254'],
            'password' => ['required', 'string', 'max:255'],
        ]);
        $user = User::query()->where('email', $data['email'])->first();
        // Same work and the same answer for an unknown email and a wrong password.
        $ok = Hash::check($data['password'], $user?->password ?? self::dummyHash());
        if (! $user || $user->password === null || ! $ok) {
            throw new ApiException(401, 'invalid_credentials', 'The email or password is incorrect.');
        }
        if (! $user->isVerified()) {
            throw new ApiException(403, 'not_verified', 'Confirm your email first. We sent you a new code.', [
                'otp' => $this->otp->issue($user->email, 'register', true),
            ]);
        }
        if (Hash::needsRehash($user->password)) {
            $user->password = $data['password'];
            $user->save();
        }

        return response()->json($this->sessions->open($user, $request));
    }

    public function forgot(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate(['email' => ['required', 'string', 'max:254']]);
        $user = User::query()->where('email', $data['email'])->first();

        // Always 202 so it never reveals whether an email is registered.
        return response()->json(
            $user && $user->password !== null ? $this->otp->issue($data['email'], 'reset', true) : $this->otp->decoy($data['email'], 'reset'),
            202,
        );
    }

    public function verifyReset(Request $request): JsonResponse
    {
        $this->normalize($request);
        $data = $request->validate([
            'email' => ['required', 'string', 'max:254'],
            'code' => ['required', 'string', 'max:12'],
        ]);
        $this->otp->verify($data['email'], 'reset', trim($data['code']));

        $token = Str::random(64);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $data['email']],
            ['token' => hash('sha256', $token), 'created_at' => now()],
        );

        return response()->json(['reset_token' => $token]);
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reset_token' => ['required', 'string', 'max:128'],
            'password' => ['required', ...V::password()],
        ]);

        $user = DB::transaction(function () use ($data) {
            $row = DB::table('password_reset_tokens')->where('token', hash('sha256', $data['reset_token']))->lockForUpdate()->first();
            $expired = ! $row || now()->subMinutes(config('usta.otp.reset_token_minutes'))->gt($row->created_at);
            if ($row) {
                // Single use, valid or not.
                DB::table('password_reset_tokens')->where('email', $row->email)->delete();
            }
            if ($expired) {
                throw new ApiException(422, 'otp_expired', 'This reset link has expired. Start again.');
            }
            $user = User::query()->where('email', $row->email)->first();
            if (! $user) {
                throw ApiException::notFound('No account for this email.');
            }
            $user->password = $data['password'];
            $user->email_verified_at ??= now();
            $user->save();
            // A new password signs out every other device.
            $user->tokens()->delete();

            return $user;
        });

        return response()->json($this->sessions->open($user, $request));
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->noContent();
    }

    /** An unverified sign-up for the same email is replaced; a verified one is taken. */
    private function replaceUnverified(string $email): void
    {
        $existing = User::query()->where('email', $email)->first();
        if (! $existing) {
            return;
        }
        if ($existing->isVerified()) {
            throw new ApiException(422, 'email_taken', 'An account with this email already exists.', [
                'errors' => ['email' => ['An account with this email already exists.']],
            ]);
        }
        Business::withTrashed()->where('owner_id', $existing->id)->forceDelete();
        $existing->tokens()->delete();
        $existing->delete();
    }

    private static function dummyHash(): string
    {
        static $hash;

        return $hash ??= Hash::make(Str::random(32));
    }
}
