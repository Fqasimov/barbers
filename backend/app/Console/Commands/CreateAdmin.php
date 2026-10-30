<?php

namespace App\Console\Commands;

use App\Models\Admin;
use App\Rules\V;
use App\Support\Totp;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

/**
 * Creates a staff account for /admin, or resets one's password and
 * authenticator. The password comes from a hidden prompt (never an argument).
 * Prints the authenticator key once; it is stored encrypted.
 */
class CreateAdmin extends Command
{
    protected $signature = 'usta:create-admin
        {--email= : Email address}
        {--name= : Full name}
        {--disable : Block this admin from signing in}
        {--enable : Allow a disabled admin to sign in again}';

    protected $description = 'Create an admin-panel account, or reset its password and authenticator';

    public function handle(): int
    {
        $email = mb_strtolower(trim($this->option('email') ?: (string) $this->ask('Email')));
        if (Validator::make(['email' => $email], ['email' => ['required', ...V::email()]])->fails()) {
            $this->error('That is not a valid email.');

            return self::FAILURE;
        }
        $admin = Admin::query()->where('email', $email)->first();

        if ($this->option('disable') || $this->option('enable')) {
            if (! $admin) {
                $this->error('No such admin.');

                return self::FAILURE;
            }
            $admin->forceFill(['disabled_at' => $this->option('disable') ? now() : null])->save();
            $this->info($this->option('disable') ? "{$email} can no longer sign in." : "{$email} can sign in again.");

            return self::SUCCESS;
        }

        if ($admin && ! $this->confirm("{$email} exists. Reset its password and authenticator?", false)) {
            return self::FAILURE;
        }
        $admin ??= new Admin(['email' => $email]);
        $admin->name = trim($this->option('name') ?: ($admin->name ?: (string) $this->ask('Full name')));
        if ($admin->name === '') {
            $this->error('A name is required.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('Password (at least 12 characters, letters and numbers)');
        $check = Validator::make(['password' => $password], ['password' => ['required', Password::min(12)->letters()->numbers()]]);
        if ($check->fails() || $password !== (string) $this->secret('Repeat the password')) {
            $this->error($check->fails() ? implode(' ', $check->errors()->all()) : 'The passwords do not match.');

            return self::FAILURE;
        }

        $secret = Totp::newSecret();
        $admin->forceFill(['password' => $password, 'totp_secret' => $secret, 'totp_last_step' => null, 'disabled_at' => null])->save();

        $this->info("Admin {$admin->email} is ready. Sign in at ".rtrim((string) config('app.url'), '/').'/admin');
        $this->line('Add this to an authenticator app (Google Authenticator, 1Password, Authy…); it is shown only now:');
        $this->line("  Key: {$secret}");
        $this->line('  Or open: '.Totp::uri($secret, $admin->email));

        return self::SUCCESS;
    }
}
