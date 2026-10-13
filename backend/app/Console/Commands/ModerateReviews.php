<?php

namespace App\Console\Commands;

use App\Models\Business;
use App\Models\Master;
use App\Models\Review;
use App\Models\ReviewReport;
use App\Services\RatingService;
use Illuminate\Console\Command;

/**
 * Reported reviews. Without options: lists the ones waiting for a decision.
 * Store rules ask that reports are acted on quickly (Apple: within 24 hours).
 */
class ModerateReviews extends Command
{
    protected $signature = 'usta:reviews {--hide= : Review id to hide} {--restore= : Review id to show again}';

    protected $description = 'List reported reviews, or hide / restore one';

    public function handle(RatingService $ratings): int
    {
        $id = $this->option('hide') ?? $this->option('restore');
        if ($id) {
            $review = Review::query()->find($id);
            if (! $review) {
                $this->error('No such review.');

                return self::FAILURE;
            }
            $hide = (bool) $this->option('hide');
            $review->forceFill($hide ? ['hidden_at' => $review->hidden_at ?? now()] : ['hidden_at' => null, 'report_count' => 0])->save();
            ReviewReport::query()->where('review_id', $review->id)->whereNull('resolved_at')->update(['resolved_at' => now()]);
            if ($b = Business::withTrashed()->find($review->business_id)) {
                $ratings->refreshBusiness($b);
            }
            if ($review->master_id && ($m = Master::query()->find($review->master_id))) {
                $ratings->refreshMaster($m);
            }
            $this->info($hide ? "Review {$review->id} is hidden." : "Review {$review->id} is visible again.");

            return self::SUCCESS;
        }

        $open = ReviewReport::query()->whereNull('resolved_at')->with('review')->orderBy('created_at')->get()->groupBy('review_id');
        if ($open->isEmpty()) {
            $this->info('No reports waiting.');

            return self::SUCCESS;
        }
        $this->table(['Review', 'Salon', 'Stars', 'Text', 'Reports', 'Reasons', 'Hidden'], $open->map(fn ($reports) => [
            $reports->first()->review_id,
            $reports->first()->review?->business_id,
            $reports->first()->review?->rating,
            mb_strimwidth((string) $reports->first()->review?->text, 0, 60, '…'),
            $reports->count(),
            $reports->pluck('reason')->unique()->implode(', '),
            $reports->first()->review?->hidden_at ? 'yes' : 'no',
        ])->values()->all());

        return self::SUCCESS;
    }
}
