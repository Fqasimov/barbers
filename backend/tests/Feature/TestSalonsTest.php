<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use App\Support\Traffic;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TestSalonsTest extends TestCase
{
    use RefreshDatabase;

    public function test_creates_one_hidden_salon_per_plan(): void
    {
        $this->artisan('usta:test-salons', ['email' => 'owner@example.com'])->assertSuccessful();
        $this->artisan('usta:test-salons', ['email' => 'owner@example.com'])->assertSuccessful(); // idempotent

        $this->assertSame(4, User::query()->where('email', 'like', 'owner+test%@example.com')->count());
        $plans = [];
        foreach ([1 => 'sade', 2 => 'ferdi', 3 => 'start', 4 => 'pro'] as $n => $plan) {
            $user = User::query()->where('email', "owner+test{$n}@example.com")->firstOrFail();
            $salon = Business::query()->where('owner_id', $user->id)->firstOrFail();
            $this->assertSame("test{$n}", $salon->name);
            $this->assertTrue((bool) $salon->is_test);
            $this->assertSame(Business::LIVE, $salon->status);
            $plans[] = $salon->planId();
            $this->assertNull($user->password);
        }
        $this->assertSame(['sade', 'ferdi', 'start', 'pro'], $plans);
        // Customers never see them, even the Sadə one that needs no services.
        $this->assertSame(0, Business::query()->listable()->where('is_test', true)->count());
    }

    public function test_ignored_ips_are_left_out_of_traffic(): void
    {
        DB::table('traffic_ignored_ips')->insert(['ip' => '10.0.0.9']);
        $t = new Traffic;
        $line = fn ($ip) => $ip.' - - [18/Nov/2026:10:00:00 +0400] "GET / HTTP/1.1" 200 100 "-" "Mozilla/5.0"';
        $t->line($line('10.0.0.9'));
        $t->line($line('10.0.0.8'));
        $t->save();

        $this->assertSame(1, (int) DB::table('traffic_days')->sum('views'));
        $this->assertFalse(DB::table('traffic_ips')->where('ip', '10.0.0.9')->exists());
    }
}
