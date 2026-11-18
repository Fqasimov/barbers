<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Reads Apache "combined" access-log lines into daily counts and a list of suspicious addresses.
 * Page views: successful GETs of website and app pages by people (not files, the API or bots).
 */
class Traffic
{
    private const BOT = '/bot|crawl|spider|slurp|curl|wget|python|go-http|java\/|okhttp|httpclient|headless|scrapy|axios|node-fetch|libwww|facebookexternalhit|preview|monitor|uptime|scan/i';

    /** Paths no visitor of this site asks for: someone looking for weak spots. */
    private const PROBE = '#(\.env|\.git|wp-|wordpress|xmlrpc|phpmyadmin|pma|\.php|cgi-bin|\.aws|\.ssh|config\.(json|ya?ml)|/vendor/|/\.well-known/security|actuator|boaform|\.asp|\.jsp|/etc/passwd|\.\./)#i';

    private const LINE = '/^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+)[^"]*" (\d{3}) \S+ "([^"]*)" "([^"]*)"/';

    /** @var array<string, array<string, mixed>> */
    private array $days = [];

    /** @var array<string, true> The team's own addresses (traffic_ignored_ips): not counted. */
    private array $ignore;

    /** @param  list<string>|null  $ignore  Addresses to skip; null reads traffic_ignored_ips. */
    public function __construct(?array $ignore = null)
    {
        $ignore ??= DB::table('traffic_ignored_ips')->pluck('ip')->all();
        $this->ignore = array_fill_keys($ignore, true);
    }

    /** @var array<string, array<string, mixed>> */
    private array $ips = [];

    /** @var array<string, array<string, bool>> */
    private array $agentsPerIp = [];

    public function line(string $line): void
    {
        if (! preg_match(self::LINE, $line, $m)) {
            return;
        }
        [, $ip, $when, $method, $uri, $status, $ref, $agent] = $m;
        if (isset($this->ignore[$ip])) {
            return;
        }
        $at = CarbonImmutable::createFromFormat('d/M/Y:H:i:s O', $when);
        if (! $at) {
            return;
        }
        $day = $at->setTimezone('Asia/Baku')->toDateString();
        $path = strtolower(strtok($uri, '?') ?: '/');
        $status = (int) $status;
        $bot = $agent === '' || $agent === '-' || preg_match(self::BOT, $agent);

        $d = &$this->days[$day];
        $d ??= ['views' => 0, 'bots' => 0, 'visitors' => [], 'pages' => [], 'refs' => []];

        $page = $method === 'GET' && $status === 200 && $this->isPage($path);
        if ($page && $bot) {
            $d['bots']++;
        } elseif ($page) {
            $d['views']++;
            // One address with many browsers is a few people behind one network, not thousands:
            // after 5 different browsers it counts as one more visitor at most.
            $seen = &$this->agentsPerIp[$day.'|'.$ip];
            $seen ??= [];
            $id = count($seen) < 5 || isset($seen[$agent]) ? $agent : '*';
            $seen[$id] = true;
            $d['visitors'][sha1($ip.'|'.$id.'|'.$day)] = true;
            $key = $this->pageKey($path);
            $d['pages'][$key] = ($d['pages'][$key] ?? 0) + 1;
            $host = parse_url($ref, PHP_URL_HOST);
            if (is_string($host) && $host !== '' && ! str_ends_with($host, 'yazilnow.az')
                && preg_match('/^[a-z0-9.-]{1,100}$/i', $host) && (isset($d['refs'][$host]) || count($d['refs']) < 200)) {
                $host = preg_replace('/^(www|m|l|lm)\./', '', strtolower($host));
                $d['refs'][$host] = ($d['refs'][$host] ?? 0) + 1;
            }
        }

        $s = &$this->ips[$ip];
        $s ??= ['hits' => 0, 'probes' => 0, 'not_found' => 0, 'admin_posts' => 0, 'sample' => null, 'agent' => null, 'first' => $at, 'last' => $at];
        $s['hits']++;
        $s['last'] = $at;
        $s['agent'] = mb_substr($agent, 0, 190);
        if (preg_match(self::PROBE, $path)) {
            $s['probes']++;
            $s['sample'] = mb_substr($uri, 0, 190);
        } elseif ($status === 404) {
            $s['not_found']++;
            $s['sample'] ??= mb_substr($uri, 0, 190);
        }
        if ($method === 'POST' && str_starts_with($path, '/admin/login')) {
            $s['admin_posts']++;
        }
    }

    /** Website and app screens, not files (images, scripts), the API, the server or the admin. */
    private function isPage(string $path): bool
    {
        if (preg_match('#^/(api|server|admin|admin-assets|assets|_expo|img|tools|fonts|data|storage|up)(/|$)#', $path)) {
            return false;
        }
        $last = basename($path);

        return ! str_contains($last, '.') || str_ends_with($last, '.html');
    }

    /**
     * Known pages only: /app/salon/01abc… → /app/salon/*; anything else counts as "other", so
     * made-up addresses can't fill the table.
     */
    private function pageKey(string $path): string
    {
        $path = preg_replace('#/index\.html$#', '/', $path);
        $path = preg_replace('#^/app/(salon|book|u|r|review|s)/[^/]+.*$#', '/app/$1/*', $path);
        $path = rtrim($path, '/') ?: '/';
        $known = '#^/($|help|privacy|terms|billing|delete-account|app($|/(\*|panel|business(/[a-z-]+)?|staff|auth(/[a-z-]+)?|account(/[a-z-]+)?|(salon|book|u|r|review|s)/\*)$))#';

        return preg_match($known, $path) ? $path : 'other';
    }

    public function save(): void
    {
        DB::transaction(function () {
            foreach ($this->days as $day => $d) {
                foreach (array_keys($d['visitors']) as $hash) {
                    DB::table('traffic_visitors')->insertOrIgnore(['day' => $day, 'hash' => $hash]);
                }
                DB::table('traffic_days')->insertOrIgnore(['day' => $day, 'views' => 0, 'visitors' => 0, 'bots' => 0]);
                DB::table('traffic_days')->where('day', $day)->update([
                    'views' => DB::raw('views + '.(int) $d['views']),
                    'bots' => DB::raw('bots + '.(int) $d['bots']),
                    'visitors' => DB::table('traffic_visitors')->where('day', $day)->count(),
                ]);
                foreach (['page' => $d['pages'], 'ref' => $d['refs']] as $kind => $counts) {
                    foreach ($counts as $key => $n) {
                        DB::table('traffic_counts')->insertOrIgnore(['day' => $day, 'kind' => $kind, 'key' => $key, 'n' => 0]);
                        DB::table('traffic_counts')->where(['day' => $day, 'kind' => $kind, 'key' => $key])->increment('n', $n);
                    }
                }
            }
            foreach ($this->ips as $ip => $s) {
                $row = DB::table('traffic_ips')->where('ip', $ip)->first();
                $t = [
                    'hits' => ($row->hits ?? 0) + $s['hits'],
                    'probes' => ($row->probes ?? 0) + $s['probes'],
                    'not_found' => ($row->not_found ?? 0) + $s['not_found'],
                    'admin_posts' => ($row->admin_posts ?? 0) + $s['admin_posts'],
                ];
                $flagged = $t['probes'] > 0 || $t['admin_posts'] >= 5 || $t['not_found'] >= 30;
                // Only addresses worth a look are kept; ordinary visitors are counted, not stored.
                if (! $flagged && ! $row) {
                    continue;
                }
                DB::table('traffic_ips')->upsert([[
                    'ip' => $ip, ...$t,
                    'sample' => $s['sample'] ?? $row->sample ?? null,
                    'agent' => $s['agent'],
                    'flagged' => $flagged,
                    'first_seen' => $row->first_seen ?? $s['first']->utc(),
                    'last_seen' => $s['last']->utc(),
                ]], ['ip']);
            }
        });
        $this->days = [];
        $this->ips = [];
        $this->agentsPerIp = [];
    }
}
