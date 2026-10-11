<?php

namespace App\Providers;

use App\Payments\FakeGateway;
use App\Payments\PaymentGateway;
use App\Services\Photos\GdPhotoProcessor;
use App\Services\Photos\ImagickPhotoProcessor;
use App\Services\Photos\PhotoProcessor;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentGateway::class, function ($app) {
            $driver = config('payments.driver');
            $cfg = config("payments.drivers.{$driver}");
            if (! $cfg) {
                throw new RuntimeException("Unknown PAYMENT_DRIVER [{$driver}].");
            }
            if ($cfg['class'] === FakeGateway::class && $app->environment('production')) {
                throw new RuntimeException('The fake payment driver cannot be used in production.');
            }

            return new $cfg['class']($cfg);
        });

        $this->app->bind(PhotoProcessor::class, fn () => extension_loaded('imagick')
            ? new ImagickPhotoProcessor
            : new GdPhotoProcessor);
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();
        Model::preventSilentlyDiscardingAttributes(! $this->app->isProduction());

        $email = fn (Request $r) => mb_strtolower(trim((string) $r->input('email', '')));

        // login, register, forgot, verify, resend: per IP and per email.
        RateLimiter::for('auth', fn (Request $r) => [
            Limit::perMinute(30)->by('auth-ip:'.$r->ip()),
            Limit::perMinute(10)->by('auth-email:'.sha1($email($r))),
        ]);

        RateLimiter::for('bookings', fn (Request $r) => [
            Limit::perMinute(10)->by('book-user:'.$r->user()?->id),
            Limit::perDay(60)->by('book-user-day:'.$r->user()?->id),
        ]);

        RateLimiter::for('public', fn (Request $r) => Limit::perMinute(240)->by('pub:'.$r->ip()));

        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(240)->by('api:'.($r->user()?->id ?: $r->ip())));
    }
}
