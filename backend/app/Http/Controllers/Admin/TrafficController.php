<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

/** Website visits, sign-ups and suspicious addresses (from usta:ingest-traffic). */
class TrafficController extends Controller
{
    public function index(): View
    {
        $tz = 'Asia/Baku';
        $today = now($tz)->toDateString();
        $from = now($tz)->subDays(13)->toDateString();
        $weekFrom = now($tz)->subDays(6)->toDateString();

        $days = DB::table('traffic_days')->where('day', '>=', $from)->get()->keyBy(fn ($r) => substr((string) $r->day, 0, 10));
        $signups = fn ($q) => $q->where('created_at', '>=', now($tz)->subDays(13)->startOfDay()->utc())->get(['created_at'])
            ->countBy(fn ($r) => $r->created_at->setTimezone($tz)->toDateString());
        $customers = $signups(User::query()->where('role', 'customer'));
        $salons = $signups(Business::query()->whereNull('parent_id'));

        $rows = collect(range(0, 13))->map(function ($i) use ($tz, $days, $customers, $salons) {
            $d = now($tz)->subDays($i)->toDateString();

            return (object) [
                'day' => $d,
                'visitors' => (int) ($days[$d]->visitors ?? 0),
                'views' => (int) ($days[$d]->views ?? 0),
                'bots' => (int) ($days[$d]->bots ?? 0),
                'customers' => (int) ($customers[$d] ?? 0),
                'salons' => (int) ($salons[$d] ?? 0),
            ];
        });
        $week = $rows->filter(fn ($r) => $r->day >= $weekFrom);
        $top = fn (string $kind) => DB::table('traffic_counts')->where('kind', $kind)->where('day', '>=', $weekFrom)
            ->selectRaw('`key`, sum(n) as n')->groupBy('key')->orderByDesc('n')->limit(10)->get();

        return view('admin.traffic.index', [
            'stats' => [
                'visitorsToday' => $rows->first()->visitors,
                'viewsToday' => $rows->first()->views,
                'visitorsWeek' => $week->sum('visitors'),
                'viewsWeek' => $week->sum('views'),
                'customersWeek' => $week->sum('customers'),
                'salonsWeek' => $week->sum('salons'),
                'customersAll' => User::query()->where('role', 'customer')->count(),
                'flagged' => DB::table('traffic_ips')->where('flagged', true)->count(),
            ],
            'rows' => $rows,
            'pages' => $top('page'),
            'refs' => $top('ref'),
            'ips' => DB::table('traffic_ips')->where('flagged', true)->orderByDesc('last_seen')->limit(50)->get(),
            'today' => $today,
            'updated' => is_file($f = storage_path('app/traffic-offset.json')) ? \Carbon\Carbon::createFromTimestamp(filemtime($f)) : null,
        ]);
    }
}
