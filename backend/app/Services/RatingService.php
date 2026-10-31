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
    /** Weight of a review in tenths: a booked visit counts fully, a QR review a little less. */
    public static function weight(?string $source): int
    {
        return $source === 'qr' ? (int) config('usta.qr_reviews.weight') : 10;
    }

    public function refreshBusiness(Business $business): void
    {
        $rows = Review::query()->visible()->where('business_id', $business->id)
            ->selectRaw('rating, source, count(*) as n')->groupBy('rating', 'source')->get();
        $stars = [0, 0, 0, 0, 0];
        $sum = 0;
        $count = 0;
        $weight = 0;
        $weighted = 0;
        foreach ($rows as $row) {
            $r = max(1, min(5, (int) $row->rating));
            $n = (int) $row->n;
            $w = self::weight($row->source);
            $stars[5 - $r] += $n;
            $sum += $r * $n;
            $count += $n;
            $weight += $w * $n;
            $weighted += $w * $r * $n;
        }
        $business->forceFill([
            'review_count' => $count,
            'review_sum' => $sum,
            'review_stars' => $stars,
            'review_weight' => $weight,
            'review_weighted_sum' => $weighted,
        ])->saveQuietly();
    }

    public function refreshMaster(Master $master): void
    {
        $rows = Review::query()->visible()->where('master_id', $master->id)
            ->selectRaw('coalesce(master_rating, rating) as r, source, count(*) as n')
            ->groupByRaw('coalesce(master_rating, rating), source')->get();
        $count = 0;
        $sum = 0;
        $weight = 0;
        $weighted = 0;
        foreach ($rows as $row) {
            $r = max(1, min(5, (int) $row->r));
            $n = (int) $row->n;
            $w = self::weight($row->source);
            $count += $n;
            $sum += $r * $n;
            $weight += $w * $n;
            $weighted += $w * $r * $n;
        }
        $master->forceFill([
            'review_count' => $count,
            'review_sum' => $sum,
            'review_weight' => $weight,
            'review_weighted_sum' => $weighted,
        ])->saveQuietly();
    }

    /**
     * The average shown for a salon or master: the imported base plus real
     * reviews, each review weighted (weights in tenths).
     */
    public static function average(float $baseRating, int $baseCount, int $weightedSum, int $weight): float
    {
        $total = $baseCount * 10 + $weight;

        return $total > 0 ? round(($baseRating * $baseCount * 10 + $weightedSum) / $total, 2) : 0.0;
    }

    public static function score(Business|Master $m): float
    {
        return self::average((float) $m->base_rating, (int) $m->base_review_count, (int) $m->review_weighted_sum, (int) $m->review_weight);
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
