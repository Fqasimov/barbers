<?php

namespace App\Services;

use App\Models\Business;
use App\Models\Master;
use App\Models\Review;
use App\Models\ReviewReport;

/** Acting on reported reviews, from `usta:reviews` or the admin panel. Every decision closes the open reports. */
class ReviewModeration
{
    public function __construct(private RatingService $ratings) {}

    public function hide(Review $review): void
    {
        $review->forceFill(['hidden_at' => $review->hidden_at ?? now()])->save();
        $this->settle($review);
    }

    /** Visible again, report count reset. */
    public function restore(Review $review): void
    {
        $review->forceFill(['hidden_at' => null, 'report_count' => 0])->save();
        $this->settle($review);
    }

    /** The reports were unfounded: keep the review as it is. */
    public function dismiss(Review $review): void
    {
        $this->settle($review);
    }

    private function settle(Review $review): void
    {
        ReviewReport::query()->where('review_id', $review->id)->whereNull('resolved_at')->update(['resolved_at' => now()]);
        if ($b = Business::withTrashed()->find($review->business_id)) {
            $this->ratings->refreshBusiness($b);
        }
        if ($review->master_id && ($m = Master::query()->find($review->master_id))) {
            $this->ratings->refreshMaster($m);
        }
    }
}
