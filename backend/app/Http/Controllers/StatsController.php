<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Business;
use App\Models\Master;
use App\Services\RatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/**
 * Public figures for the website: the size of the network and how it's used.
 * Only salons that are listed right now count; cached for 10 minutes.
 */
class StatsController extends Controller
{
    public const TTL = 600;

    public function __invoke(): JsonResponse
    {
        $payload = Cache::remember('stats:public', self::TTL, function () {
            $salons = Business::query()->listable()->get(['id', 'district', 'base_rating', 'base_review_count', 'review_sum', 'review_count']);
            $ids = $salons->pluck('id');
            $reviews = 0;
            $stars = 0.0;
            foreach ($salons as $s) {
                $count = (int) $s->base_review_count + (int) $s->review_count;
                $reviews += $count;
                $stars += RatingService::average((float) $s->base_rating, (int) $s->base_review_count, (int) $s->review_sum, (int) $s->review_count) * $count;
            }
            $visits = Booking::query()->where('kind', Booking::VISIT)->where('source', 'customer');

            return [
                'salons' => $salons->count(),
                'masters' => Master::query()->whereIn('business_id', $ids)->count(),
                'districts' => $salons->pluck('district')->filter()->map(fn ($d) => mb_strtolower(trim($d)))->unique()->count(),
                'bookings' => (clone $visits)->where('status', '!=', Booking::CANCELLED)->count(),
                'clients' => (clone $visits)->whereNotNull('user_id')->distinct()->count('user_id'),
                'reviews' => $reviews,
                'average_rating' => $reviews > 0 ? round($stars / $reviews, 2) : null,
                'updated_at' => now()->toIso8601ZuluString(),
            ];
        });

        return response()->json($payload)->header('Cache-Control', 'public, max-age=300');
    }
}
