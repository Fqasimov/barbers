<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Business;
use App\Models\Master;
use App\Models\WaitlistEntry;
use App\Support\Baku;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Salon numbers for a date range: earnings, clients, bookings by day, master,
 * service and channel. For the owner (one location or all) or for one master
 * (their own cabinet).
 */
class Stats
{
    /** @param  Collection<int, Business>  $locations */
    public function compute(Collection $locations, CarbonImmutable $from, CarbonImmutable $to, string $scope = 'location', ?string $masterId = null): array
    {
        $ids = $locations->pluck('id')->all();
        $rows = Booking::query()->whereIn('business_id', $ids)->where('kind', Booking::VISIT)
            ->where('start_at', '>=', $from->utc())->where('start_at', '<', $to->addDay()->utc())
            ->when($masterId, fn ($q) => $q->where('master_id', $masterId))
            ->limit(50000)->get(['id', 'business_id', 'user_id', 'client_phone', 'master_id', 'services', 'start_at', 'end_at', 'total', 'deposit', 'deposit_status', 'status', 'source', 'channel']);
        $done = fn (Booking $b) => $b->status === Booking::COMPLETED || ($b->status === Booking::UPCOMING && $b->hasEnded());
        $client = fn (Booking $b) => $b->user_id ? 'u:'.$b->user_id : ($b->client_phone ? 'p:'.$b->client_phone : null);

        $earlier = Booking::query()->whereIn('business_id', $ids)->where('kind', Booking::VISIT)
            ->where('start_at', '<', $from->utc())->whereIn('status', [Booking::COMPLETED, Booking::UPCOMING])
            ->when($masterId, fn ($q) => $q->where('master_id', $masterId))
            ->get(['user_id', 'client_phone'])->map($client)->filter()->flip();
        $clients = $rows->filter($done)->map($client)->filter()->unique();
        $masters = Master::query()->whereIn('business_id', $ids)->pluck('name', 'id');

        $visits = $rows->whereNotIn('status', [Booking::PENDING_PAYMENT]);
        $count = fn (string $s) => $visits->where('status', $s)->count();
        $byDay = [];
        for ($d = $from; $d->lte($to); $d = $d->addDay()) {
            $byDay[$d->toDateString()] = ['date' => $d->toDateString(), 'bookings' => 0, 'revenue' => 0];
        }
        foreach ($visits as $b) {
            $day = Baku::local($b->start_at)->toDateString();
            if (isset($byDay[$day])) {
                $byDay[$day]['bookings']++;
                $byDay[$day]['revenue'] += $done($b) ? (int) $b->total : 0;
            }
        }
        $group = fn (Collection $c, callable $key, callable $name) => $c->groupBy($key)->map(fn ($g, $k) => [
            'id' => (string) $k,
            'name' => $name($k, $g),
            'bookings' => $g->count(),
            'revenue' => (int) $g->filter($done)->sum('total'),
        ])->sortByDesc('bookings')->values()->all();

        $services = $visits->flatMap(fn (Booking $b) => collect($b->services)->map(fn ($s) => ['id' => $s['id'], 'name' => $s['name'], 'price' => (int) $s['price'], 'done' => $done($b)]));

        return [
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'scope' => $scope,
            'totals' => [
                'bookings' => $visits->count(),
                'completed' => $visits->filter($done)->count(),
                'cancelled' => $count(Booking::CANCELLED),
                'no_show' => $count(Booking::NO_SHOW),
                'upcoming' => $visits->filter(fn ($b) => $b->status === Booking::UPCOMING && ! $b->hasEnded())->count(),
                'revenue' => (int) $visits->filter($done)->sum('total'),
                'deposits_kept' => (int) $visits->where('deposit_status', 'kept')->sum('deposit'),
                'from_app' => $visits->where('source', 'customer')->count(),
                'by_salon' => $visits->where('source', 'salon')->count(),
                'from_web' => $visits->where('source', 'customer')->where('channel', 'web')->count(),
                'from_phone' => $visits->where('source', 'customer')->whereIn('channel', ['ios', 'android'])->count(),
                'clients' => $clients->count(),
                'new_clients' => $clients->reject(fn ($c) => $earlier->has($c))->count(),
                'waitlist' => WaitlistEntry::query()->whereIn('business_id', $ids)->whereBetween('date', [$from->toDateString(), $to->toDateString()])->count(),
            ],
            'by_day' => array_values($byDay),
            // How clients booked: the app on a phone, the website, or the salon entered it (call, walk-in).
            'by_channel' => collect([
                ['id' => 'phone', 'bookings' => $visits->where('source', 'customer')->whereIn('channel', ['ios', 'android'])],
                ['id' => 'web', 'bookings' => $visits->where('source', 'customer')->where('channel', 'web')],
                ['id' => 'app', 'bookings' => $visits->where('source', 'customer')->whereNull('channel')],
                ['id' => 'salon', 'bookings' => $visits->where('source', 'salon')],
            ])->map(fn ($r) => ['id' => $r['id'], 'bookings' => $r['bookings']->count(), 'revenue' => (int) $r['bookings']->filter($done)->sum('total')])
                ->filter(fn ($r) => $r['bookings'] > 0 || in_array($r['id'], ['phone', 'web', 'salon'], true))->values()->all(),
            'by_master' => $group($visits, fn ($b) => $b->master_id, fn ($k) => $masters[$k] ?? '—'),
            'by_service' => $services->groupBy('id')->map(fn ($g, $k) => [
                'id' => (string) $k, 'name' => $g->first()['name'], 'bookings' => $g->count(),
                'revenue' => (int) $g->where('done', true)->sum('price'),
            ])->sortByDesc('bookings')->values()->take(20)->all(),
            'by_location' => $locations->map(fn (Business $l) => [
                'id' => $l->id,
                'name' => $l->name,
                'bookings' => $visits->where('business_id', $l->id)->count(),
                'revenue' => (int) $visits->where('business_id', $l->id)->filter($done)->sum('total'),
                'rating' => RatingService::score($l),
            ])->values()->all(),
        ];
    }
}
