<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Mail\OtpCodeMail;
use App\Models\OneTimeCode;
use App\Support\Iso;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Emailed six-digit codes. Only an HMAC of the code is stored; codes expire
 * after 10 minutes, die after 5 wrong attempts and can be resent after 60 s.
 * Asking for a new code never buys more guesses: an address gets at most
 * `daily_failures` wrong codes a day and `mails_per_hour` emails an hour.
 */
class OtpService
{
    /** Issues (and emails) a new code. `$force` skips the resend cooldown. */
    public function issue(string $email, string $purpose, bool $force = false): array
    {
        $now = now();
        $prev = OneTimeCode::query()->where('email', $email)->where('purpose', $purpose)->first();
        $mailKey = 'otp-mail:'.sha1($email);
        $cooling = $prev && $prev->resend_at->isFuture() && $prev->expires_at->isFuture();
        $capped = RateLimiter::tooManyAttempts($mailKey, (int) config('usta.otp.mails_per_hour', 6));
        if ($cooling || $capped) {
            if (! $force) {
                $at = $cooling ? $prev->resend_at : $now->copy()->addSeconds(RateLimiter::availableIn($mailKey));
                throw new ApiException(429, 'resend_too_soon', 'Please wait before requesting another code.', [
                    'resend_at' => Iso::ts($at),
                ]);
            }
            // Sign-up, login and "forgot" ask again: the code already sent still works.
            if ($prev && $prev->expires_at->isFuture()) {
                return $this->challenge($email, $purpose, $prev->expires_at, $prev->resend_at);
            }
            if ($capped) {
                return $this->decoy($email, $purpose);
            }
        }
        RateLimiter::hit($mailKey, 3600);

        $code = str_pad((string) random_int(0, 999_999), 6, '0', STR_PAD_LEFT);
        $otp = OneTimeCode::query()->updateOrCreate(
            ['email' => $email, 'purpose' => $purpose],
            [
                'code_hash' => $this->hash($email, $purpose, $code),
                'attempts' => 0,
                'expires_at' => $now->copy()->addMinutes(config('usta.otp.ttl_minutes')),
                'resend_at' => $now->copy()->addSeconds(config('usta.otp.resend_seconds')),
            ],
        );

        Mail::to($email)->queue(new OtpCodeMail($code, $purpose));

        return $this->challenge($email, $purpose, $otp->expires_at, $otp->resend_at, $code);
    }

    /**
     * The same shape for an email we won't send anything to (unknown account),
     * so responses can't be used to probe which emails are registered.
     */
    public function decoy(string $email, string $purpose): array
    {
        $now = now();

        return $this->challenge(
            $email,
            $purpose,
            $now->copy()->addMinutes(config('usta.otp.ttl_minutes')),
            $now->copy()->addSeconds(config('usta.otp.resend_seconds')),
        );
    }

    /** Throws otp_expired / too_many_attempts / otp_invalid; consumes the code on success. */
    public function verify(string $email, string $purpose, string $code): void
    {
        $otp = OneTimeCode::query()->where('email', $email)->where('purpose', $purpose)->first();
        if (! $otp || $otp->expires_at->isPast()) {
            throw new ApiException(422, 'otp_expired', 'This code has expired. Request a new one.');
        }
        $max = config('usta.otp.max_attempts');
        $failKey = "otp-fail:{$purpose}:".sha1($email);
        if ($otp->attempts >= $max || RateLimiter::tooManyAttempts($failKey, (int) config('usta.otp.daily_failures', 15))) {
            throw new ApiException(422, 'too_many_attempts', 'Too many wrong codes. Request a new one.');
        }
        if (! hash_equals($otp->code_hash, $this->hash($email, $purpose, $code))) {
            $otp->increment('attempts');
            RateLimiter::hit($failKey, 86400);
            if ($otp->attempts >= $max) {
                throw new ApiException(422, 'too_many_attempts', 'Too many wrong codes. Request a new one.');
            }
            throw new ApiException(422, 'otp_invalid', 'That code is not right.');
        }
        $otp->delete();
    }

    public function forget(string $email): void
    {
        OneTimeCode::query()->where('email', $email)->delete();
    }

    private function hash(string $email, string $purpose, string $code): string
    {
        return hash_hmac('sha256', "{$purpose}|{$email}|{$code}", (string) config('app.key'));
    }

    private function challenge(string $email, string $purpose, CarbonInterface $expires, CarbonInterface $resend, ?string $code = null): array
    {
        $out = [
            'email' => $email,
            'purpose' => $purpose,
            'expires_at' => Iso::ts($expires),
            'resend_at' => Iso::ts($resend),
        ];
        // Dev servers only: lets the app's demo banner show the code. Never in production.
        if ($code !== null && app()->environment('local')) {
            $out['demo_code'] = $code;
        }

        return $out;
    }
}
