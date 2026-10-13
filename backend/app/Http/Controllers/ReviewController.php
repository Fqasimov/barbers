<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Models\Business;
use App\Models\Master;
use App\Models\Review;
use App\Models\ReviewReport;
use App\Services\RatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    public function __construct(private RatingService $ratings) {}

    /**
     * Anyone signed in can report a review once. After enough reports it is
     * hidden until someone checks it (php artisan usta:reviews).
     */
    public function report(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', Rule::in(ReviewReport::REASONS)],
            'note' => ['nullable', 'string', 'max:500'],
        ]);
        $user = $request->user();
        $review = Review::query()->visible()->find($id) ?? throw ApiException::notFound('Review not found.');

        DB::transaction(function () use ($review, $user, $data) {
            $report = ReviewReport::query()->firstOrNew(['review_id' => $review->id, 'user_id' => $user->id]);
            $fresh = ! $report->exists;
            $report->forceFill(['reason' => $data['reason'], 'note' => $data['note'] ?? null])->save();
            if (! $fresh) {
                return;
            }
            $review = Review::query()->whereKey($review->id)->lockForUpdate()->first();
            $count = $review->report_count + 1;
            $hide = $count >= config('usta.reviews.auto_hide_reports');
            $review->forceFill(['report_count' => $count] + ($hide ? ['hidden_at' => now()] : []))->save();
            if ($hide) {
                $this->refresh($review);
            }
        });

        return response()->json(['ok' => true]);
    }

    private function refresh(Review $review): void
    {
        if ($b = Business::withTrashed()->find($review->business_id)) {
            $this->ratings->refreshBusiness($b);
        }
        if ($review->master_id && ($m = Master::query()->find($review->master_id))) {
            $this->ratings->refreshMaster($m);
        }
    }
}
