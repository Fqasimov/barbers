<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Master;
use App\Models\Review;

/**
 * Ratings = imported base aggregate (seeded venues) + real reviews.
 * The review totals are denormalised onto businesses/masters on every change.
 */
class RatingService
{
    public function refreshBusiness(Business $business): void
    {
        $rows = Review::query()->where('business_id', $business->id)
            ->selectRaw('rating, count(*) as n')->groupBy('rating')->get();
        $stars = [0, 0, 0, 0, 0];
        $sum = 0;
        $count = 0;
        foreach ($rows as $row) {
            $r = max(1, min(5, (int) $row->rating));
            $stars[5 - $r] += (int) $row->n;
            $sum += $r * (int) $row->n;
            $count += (int) $row->n;
        }
        $business->forceFill(['review_count' => $count, 'review_sum' => $sum, 'review_stars' => $stars])->saveQuietly();
    }

    public function refreshMaster(Master $master): void
    {
        $agg = Review::query()->where('master_id', $master->id)
            ->selectRaw('count(*) as n, coalesce(sum(rating), 0) as s')->first();
        $master->forceFill(['review_count' => (int) $agg->n, 'review_sum' => (int) $agg->s])->saveQuietly();
    }

    public static function average(float $baseRating, int $baseCount, int $sum, int $count): float
    {
        $total = $baseCount + $count;

        return $total > 0 ? round(($baseRating * $baseCount + $sum) / $total, 2) : 0.0;
    }

    /** Fractions for 5★ … 1★ that sum to 1 (all zeros without reviews). */
    public static function distribution(Business $b): array
    {
        $baseCount = (int) $b->base_review_count;
        $stars = $b->review_stars ?: [0, 0, 0, 0, 0];
        $total = $baseCount + (int) $b->review_count;
        if ($total === 0) {
            return [0, 0, 0, 0, 0];
        }
        $base = $b->base_distribution;
        if (! is_array($base) || count($base) !== 5) {
            $base = [0, 0, 0, 0, 0];
            $base[5 - max(1, min(5, (int) round($b->base_rating ?: 5)))] = 1;
        }
        $out = [];
        for ($i = 0; $i < 5; $i++) {
            $out[] = round(((float) $base[$i] * $baseCount + (int) ($stars[$i] ?? 0)) / $total, 4);
        }

        return $out;
    }
}
