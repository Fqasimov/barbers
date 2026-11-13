<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Website visits and suspicious addresses read from the access log, shown in admin → Traffic. */
class TrafficTest extends TestCase
{
    public function test_access_log_becomes_visits_and_suspicious_addresses(): void
    {
        $ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) Safari/604.1';
        $line = fn ($ip, $req, $status, $ref = '-', $agent = null) => sprintf(
            '%s - - [12/Oct/2026:10:00:00 +0400] "%s HTTP/2" %d 100 "%s" "%s"', $ip, $req, $status, $ref, $agent ?? $ua);
        $lines = [
            $line('1.1.1.1', 'GET /', 200, 'https://www.instagram.com/x'),
            $line('1.1.1.1', 'GET /assets/index.js', 200),
            $line('1.1.1.1', 'GET /app/salon/01abc', 200),
            $line('2.2.2.2', 'GET /', 200),
            $line('3.3.3.3', 'GET /', 200, '-', 'Googlebot/2.1'),
            $line('6.6.6.6', 'GET /.env', 404),
            $line('6.6.6.6', 'GET /wp-login.php', 404),
        ];
        foreach (range(1, 5) as $i) {
            $lines[] = $line('7.7.7.7', 'POST /admin/login', 302);
        }
        $file = tempnam(sys_get_temp_dir(), 'log');
        file_put_contents($file, implode("\n", $lines)."\n".$line('9.9.9.9', 'GET /', 200)); // last line unfinished

        $this->artisan('usta:ingest-traffic', ['--file' => $file])->assertSuccessful();
        // Read again: nothing counted twice.
        $this->artisan('usta:ingest-traffic', ['--file' => $file])->assertSuccessful();

        $day = DB::table('traffic_days')->first();
        $this->assertSame(3, (int) $day->views);
        $this->assertSame(2, (int) $day->visitors);
        $this->assertSame(1, (int) $day->bots);
        $this->assertSame(['instagram.com'], DB::table('traffic_counts')->where('kind', 'ref')->pluck('key')->all());
        $this->assertContains('/app/salon/*', DB::table('traffic_counts')->where('kind', 'page')->pluck('key')->all());
        $this->assertEqualsCanonicalizing(['6.6.6.6', '7.7.7.7'], DB::table('traffic_ips')->where('flagged', true)->pluck('ip')->all());
        $this->assertSame(0, DB::table('traffic_ips')->where('ip', '1.1.1.1')->count());

        $admin = new Admin;
        $admin->forceFill(['name' => 'A', 'email' => 'a@example.com', 'password' => 'Secret-pass-123', 'totp_secret' => 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'])->save();
        $this->actingAs($admin, 'admin')->withSession(['admin_seen' => now()->getTimestamp()])
            ->get('/admin/traffic')->assertOk()->assertSee('6.6.6.6')->assertSee('/wp-login.php')->assertSee('instagram.com');
        @unlink($file);
    }
}
