<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Http\Resources\ReviewResource;
use App\Http\Resources\SalonResource;
use App\Models\Booking;
use App\Models\Business;
use App\Models\Master;
use App\Models\Review;
use App\Services\Availability;
use App\Services\RatingService;
use App\Support\Baku;
use App\Support\CatalogueCache;
use App\Support\Iso;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class CatalogueController extends Controller
{
    public function __construct(private Availability $availability) {}

    private function salonQuery(): Builder
    {
        return Business::query()->listable()->with(['services', 'masters.services', 'photos']);
    }

    public function salons(Request $request): JsonResponse
    {
        $payload = Cache::remember(CatalogueCache::KEY, CatalogueCache::TTL, fn () => SalonResource::collection(
            $this->salonQuery()->orderBy('name')->get()
        )->resolve($request));

        return response()->json($payload)->header('Cache-Control', 'public, max-age='.CatalogueCache::TTL);
    }

    public function salon(Request $request, string $id): JsonResponse
    {
        $salon = $this->salonQuery()->find($id) ?? throw ApiException::notFound('Salon not found.');

        return response()->json((new SalonResource($salon))->resolve($request))
            ->header('Cache-Control', 'public, max-age='.CatalogueCache::TTL);
    }

    public function reviews(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['page' => ['sometimes', 'integer', 'min:1', 'max:10000']]);
        $salon = Business::query()->listable()->find($id) ?? throw ApiException::notFound('Salon not found.');
        $page = (int) ($data['page'] ?? 1);
        $per = 30;
        $rows = Review::query()->where('business_id', $salon->id)
            ->orderByDesc('created_at')->orderByDesc('id')
            ->offset(($page - 1) * $per)->limit($per + 1)->get();

        return response()->json([
            'data' => ReviewResource::collection($rows->take($per))->resolve($request),
            'next_page' => $rows->count() > $per ? $page + 1 : null,
        ]);
    }

    public function availability(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => ['string', 'max:64'],
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'days' => ['sometimes', 'integer', 'min:1', 'max:14'],
            'master_id' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]);
        $salon = $this->salonQuery()->find($id) ?? throw ApiException::notFound('Salon not found.');

        $ids = array_values(array_unique($data['service_ids']));
        $services = $salon->services->whereIn('id', $ids);
        if ($services->count() !== count($ids)) {
            throw ValidationException::withMessages(['service_ids' => ['One of the services is not offered by this salon.']]);
        }
        $duration = (int) $services->sum('duration_min');

        if (! empty($data['master_id'])) {
            /** @var Master|null $master */
            $master = $salon->masters->firstWhere('id', $data['master_id']);
            if (! $master) {
                throw ValidationException::withMessages(['master_id' => ['This master does not work at this salon.']]);
            }
            if (! $master->doesAll($ids)) {
                throw ValidationException::withMessages(['master_id' => ['This master does not do every chosen service.']]);
            }
            $masters = collect([$master]);
        } else {
            $masters = $this->availability->eligible($salon, $ids);
        }

        $from = isset($data['from']) ? Baku::date($data['from']) : Baku::today();
        $days = (int) ($data['days'] ?? 7);

        return response()->json([
            'masters' => $this->availability->schedules($salon, $masters, $from, $days, $duration),
        ]);
    }

    /** City-wide search: each salon's earliest free start for a service on a date. */
    public function slots(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_key' => ['required', 'string', 'max:40'],
            'date' => ['required', 'date_format:Y-m-d'],
            'from_min' => ['sometimes', 'integer', 'min:0', 'max:1440'],
            'to_min' => ['sometimes', 'integer', 'min:0', 'max:1440'],
        ]);
        $date = Baku::date($data['date']);
        $fromMin = (int) ($data['from_min'] ?? 0);
        $toMin = (int) ($data['to_min'] ?? 1440);
        if (! $this->availability->bookableDate($date)) {
            return response()->json([]);
        }

        $salons = $this->salonQuery()->whereHas('services', fn ($q) => $q->where('key', $data['service_key']))->get();
        $masterIds = $salons->flatMap(fn ($s) => $s->masters->pluck('id'))->all();
        $busy = $this->availability->busy($masterIds, $date, $date->addDay());
        $now = Baku::now();

        $out = [];
        foreach ($salons as $salon) {
            $best = null;
            foreach ($salon->services->where('key', $data['service_key']) as $service) {
                $masters = $this->availability->eligible($salon, [$service->id])
                    ->sortByDesc(fn (Master $m) => RatingService::average((float) $m->base_rating, (int) $m->base_review_count, (int) $m->review_sum, (int) $m->review_count));
                foreach ($masters as $master) {
                    $day = $this->availability->day($salon, $master, $date, (int) $service->duration_min, $busy[$master->id] ?? [], $now);
                    foreach ($day['slots'] as $t) {
                        if ($t < $fromMin || $t > $toMin) {
                            continue;
                        }
                        if ($best === null || $t < $best['start']) {
                            $best = ['salon_id' => $salon->id, 'master_id' => $master->id, 'service_id' => $service->id, 'start' => $t];
                        }
                        break;
                    }
                }
            }
            if ($best) {
                $out[] = $best;
            }
        }
        usort($out, fn ($a, $b) => [$a['start'], $a['salon_id']] <=> [$b['start'], $b['salon_id']]);

        return response()->json($out);
    }

    /** Booked time per master (upcoming bookings only, no client details). */
    public function busy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'days' => ['sometimes', 'integer', 'min:1', 'max:14'],
            'salon_ids' => ['sometimes', 'array', 'max:100'],
            'salon_ids.*' => ['string', 'max:64'],
        ]);
        $from = isset($data['from']) ? Baku::date($data['from']) : Baku::today();
        $days = (int) ($data['days'] ?? 7);
        $salonIds = isset($data['salon_ids']) ? array_values(array_unique($data['salon_ids'])) : null;
        if ($salonIds !== null) {
            sort($salonIds);
        }
        $key = 'catalogue:busy:'.sha1(json_encode([$from->toDateString(), $days, $salonIds]));

        $payload = Cache::remember($key, 30, function () use ($from, $days, $salonIds) {
            $salons = Business::query()->listable()->when($salonIds !== null, fn ($q) => $q->whereIn('id', $salonIds))->pluck('id');

            return Booking::query()
                ->whereIn('business_id', $salons)
                ->where('status', Booking::UPCOMING)
                ->where('start_at', '>=', $from->utc())
                ->where('start_at', '<', $from->addDays($days)->utc())
                ->orderBy('start_at')
                ->get(['master_id', 'start_at', 'end_at'])
                ->map(fn (Booking $b) => [
                    'master_id' => $b->master_id,
                    'start' => Iso::ts($b->start_at),
                    'end' => Iso::ts($b->end_at),
                ])->values()->all();
        });

        return response()->json($payload)->header('Cache-Control', 'public, max-age=30');
    }

    public function plans(): JsonResponse
    {
        $plans = collect(config('usta.plans'))->map(fn ($price, $id) => ['id' => $id, 'price' => (int) $price])->values();

        return response()->json($plans)->header('Cache-Control', 'public, max-age=300');
    }
}
