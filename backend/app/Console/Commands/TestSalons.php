<?php

namespace App\Console\Commands;

use App\Models\Business;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * The team's test salons, one per plan, so every plan can be tried in the panel:
 * <name>+test1@… = Sadə, +test2 = Fərdi, +test3 = Start, +test4 = Pro. They are live with a
 * paid period that doesn't end, marked is_test so customers never see them, and their owners
 * have no password: set one with "Forgot password" (the code goes to the base inbox).
 * Running it again leaves existing ones alone and resets their plans.
 */
class TestSalons extends Command
{
    protected $signature = 'usta:test-salons {email : Base address, e.g. name@gmail.com}';

    protected $description = 'Create the four test salons (one per plan), hidden from customers';

    private const PLANS = ['sade', 'ferdi', 'start', 'pro'];

    public function handle(): int
    {
        $email = mb_strtolower(trim((string) $this->argument('email')));
        if (! preg_match('/^([^@+\s]+)@([^@\s]+\.[a-z]{2,})$/', $email, $m)) {
            $this->error('Give a plain address like name@gmail.com.');

            return self::FAILURE;
        }

        foreach (self::PLANS as $i => $plan) {
            $n = $i + 1;
            $address = "{$m[1]}+test{$n}@{$m[2]}";
            DB::transaction(function () use ($address, $n, $plan) {
                $user = User::query()->where('email', $address)->first() ?? new User;
                $user->forceFill([
                    'email' => $address,
                    'first_name' => 'Test',
                    'last_name' => (string) $n,
                    'role' => 'business',
                    'provider' => 'password',
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();

                $business = Business::query()->where('owner_id', $user->id)->whereNull('parent_id')->first() ?? new Business;
                $business->forceFill([
                    'owner_id' => $user->id,
                    'name' => "test{$n}",
                    'categories' => $business->categories ?? ['barber'],
                    'closed_days' => $business->closed_days ?? [],
                    'district' => $business->district ?: 'Test',
                    'address' => $business->address ?: 'Test',
                    'is_test' => true,
                    'status' => Business::LIVE,
                    'approved_at' => $business->approved_at ?? now(),
                ])->save();

                Subscription::query()->updateOrCreate(['business_id' => $business->id], [
                    'plan' => $plan,
                    'status' => Subscription::ACTIVE,
                    'started_at' => now(),
                    'trial_ends_at' => null,
                    'current_period_end' => now()->addYears(10),
                ]);
            });
            $this->line("test{$n}  {$plan}  {$address}");
        }

        return self::SUCCESS;
    }
}
