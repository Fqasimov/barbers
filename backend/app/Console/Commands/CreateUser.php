<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Rules\V;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

/**
 * Creates a verified password account, e.g. the demo account. The password is
 * read from a hidden prompt; it is never an argument, never logged or stored
 * anywhere but as a hash.
 */
class CreateUser extends Command
{
    protected $signature = 'usta:create-user
        {--email= : Email address}
        {--first-name= : First name}
        {--last-name= : Last name}
        {--role=customer : customer or business}';

    protected $description = 'Create (or reset the password of) a verified user';

    public function handle(): int
    {
        $email = mb_strtolower(trim($this->option('email') ?: (string) $this->ask('Email')));
        if (Validator::make(['email' => $email], ['email' => ['required', ...V::email()]])->fails()) {
            $this->error('That is not a valid email.');

            return self::FAILURE;
        }

        $user = User::query()->where('email', $email)->first();
        if ($user && ! $this->confirm("{$email} already exists. Set a new password for it?", false)) {
            return self::FAILURE;
        }

        if (! $user) {
            $user = new User;
            $user->email = $email;
            $user->first_name = trim($this->option('first-name') ?: (string) $this->ask('First name'));
            $user->last_name = trim($this->option('last-name') ?: (string) $this->ask('Last name'));
            $role = $this->option('role');
            if (! in_array($role, ['customer', 'business'], true)) {
                $this->error('Role must be customer or business.');

                return self::FAILURE;
            }
            $user->role = $role;
            $user->provider = 'password';
            $names = Validator::make($user->only(['first_name', 'last_name']), [
                'first_name' => ['required', ...V::name()],
                'last_name' => ['required', ...V::name()],
            ]);
            if ($names->fails()) {
                $this->error(implode(' ', $names->errors()->all()));

                return self::FAILURE;
            }
        }

        $password = (string) $this->secret('Password (8–64 characters, a letter and a digit)');
        $check = Validator::make(['password' => $password], ['password' => ['required', ...V::password()]]);
        if ($check->fails()) {
            $this->error(implode(' ', $check->errors()->all()));

            return self::FAILURE;
        }
        if ($password !== (string) $this->secret('Repeat the password')) {
            $this->error('The passwords do not match.');

            return self::FAILURE;
        }

        $user->password = $password;
        $user->email_verified_at ??= now();
        $user->save();
        $user->tokens()->delete();

        $this->info("Saved {$user->email} ({$user->id}).");

        return self::SUCCESS;
    }
}
