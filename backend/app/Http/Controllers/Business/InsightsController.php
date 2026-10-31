<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Master;
use App\Models\SalonClick;
use App\Models\WaitlistEntry;
use App\Services\RatingService;
use App\Support\Baku;
use App\Support\Iso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Pro statistics (one location or all of them), the click report (every plan) and the waitlist. */
class InsightsController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d'],
            'scope' => ['sometimes', Rule::in(['location', 'all'])],
        ]);
        $this->business($request)->requireFeature('stats');
        $to = isset($data['to']) ? Baku::date($data['to']) : Baku::today();
        $from = isset($data['from']) ? Baku::date($data['from']) : $to->subDays(29);
        if ($to->lt($from) || $from->diffInDays($to) > 366) {
            throw ValidationException::withMessages(['to' => ['Pick up to a year, ending after it starts.']]);
        }
        $all = ($data['scope'] ?? 'location') === 'all';
        if ($all) {
            $this->ownerOnly($request);
        }
        $locations = $all ? $this->account($request)->locations() : collect([$this->business($request)]);
        $ids = $locations->pluck('id')->all();

        $rows = Booking::query()->whereIn('business_id', $ids)->where('kind', Booking::VISIT)
            ->where('start_at', '>=', $from->utc())->where('start_at', '<', $to->addDay()->utc())
            ->limit(50000)->get(['id', 'business_id', 'user_id', 'client_phone', 'master_id', 'services', 'start_at', 'end_at', 'total', 'deposit', 'deposit_status', 'status', 'source']);
        $done = fn (Booking $b) => $b->status === Booking::COMPLETED || ($b->status === Booking::UPCOMING && $b->hasEnded());
        $client = fn (Booking $b) => $b->user_id ? 'u:'.$b->user_id : ($b->client_phone ? 'p:'.$b->client_phone : null);

        $earlier = Booking::query()->whereIn('business_id', $ids)->where('kind', Booking::VISIT)
            ->where('start_at', '<', $from->utc())->whereIn('status', [Booking::COMPLETED, Booking::UPCOMING])
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

        return response()->json([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'scope' => $all ? 'all' : 'location',
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
                'clients' => $clients->count(),
                'new_clients' => $clients->reject(fn ($c) => $earlier->has($c))->count(),
                'waitlist' => WaitlistEntry::query()->whereIn('business_id', $ids)->whereBetween('date', [$from->toDateString(), $to->toDateString()])->count(),
            ],
            'by_day' => array_values($byDay),
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
        ]);
    }

    /** Taps on the salon page per month: views, Book, phone, WhatsApp, directions. */
    public function clicks(Request $request): JsonResponse
    {
        $data = $request->validate(['month' => ['sometimes', 'date_format:Y-m']]);
        $business = $this->business($request);
        $business->requireFeature('click_report');
        $start = isset($data['month']) ? Baku::date($data['month'].'-01') : Baku::today()->startOfMonth();
        $end = $start->addMonth();
        $rows = SalonClick::query()->where('business_id', $business->id)
            ->where('day', '>=', $start->toDateString())->where('day', '<', $end->toDateString())->get();
        $totals = array_fill_keys(SalonClick::KINDS, 0);
        $days = [];
        foreach ($rows as $r) {
            $totals[$r->kind] = ($totals[$r->kind] ?? 0) + $r->taps;
            $d = substr((string) $r->day, 0, 10);
            $days[$d] ??= ['date' => $d] + array_fill_keys(SalonClick::KINDS, 0);
            $days[$d][$r->kind] += $r->taps;
        }
        ksort($days);

        return response()->json(['month' => $start->format('Y-m'), 'totals' => $totals, 'by_day' => array_values($days)]);
    }

    /** Who is waiting for a time, today and later. */
    public function waitlist(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $business->requireFeature('waitlist');
        $rows = WaitlistEntry::query()->where('business_id', $business->id)
            ->where('date', '>=', Baku::today()->toDateString())->with('user')->orderBy('date')->orderBy('created_at')->get();

        return response()->json($rows->map(fn (WaitlistEntry $e) => [
            'id' => $e->id,
            'date' => substr((string) $e->date, 0, 10),
            'from_min' => $e->from_min,
            'to_min' => $e->to_min,
            'master_id' => $e->master_id,
            'service_ids' => array_values($e->service_ids ?? []),
            'client' => ['name' => $e->user?->fullName() ?? '', 'phone' => $e->user?->phone ?? ''],
            'notified_at' => Iso::ts($e->notified_at),
        ])->values()->all());
    }
}
