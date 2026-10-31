<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Http\Resources\ReviewResource;
use App\Models\Business;
use App\Models\BusinessMember;
use App\Models\Master;
use App\Models\Review;
use App\Models\ReviewCode;
use App\Services\RatingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * One-time QR reviews. After a visit the master shows a fresh code; the
 * client scans it, signs in and rates the salon and the master. A code
 * works once and for a day. These reviews weigh a little less than ones
 * after a visit booked here, and each account is limited.
 */
class QrReviewController extends Controller
{
    public function __construct(private RatingService $ratings) {}

    /** Public: what the code is for, so the page can say "Review Test Barbers · Rauf". */
    public function show(string $code): JsonResponse
    {
        $row = $this->find($code);

        return response()->json([
            'salon_id' => $row->business_id,
            'salon_name' => $row->business?->name,
            'master_id' => $row->master_id,
            'master_name' => $row->master?->name,
            'usable' => $row->usable(),
        ]);
    }

    public function store(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'master_rating' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:5'],
            'text' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'tags' => ['sometimes', 'array', 'max:6'],
            'tags.*' => ['string', Rule::in(config('usta.review_tags'))],
        ]);
        $user = $request->user();
        $row = $this->find($code);

        $review = DB::transaction(function () use ($row, $user, $data) {
            $row = ReviewCode::query()->whereKey($row->id)->lockForUpdate()->first();
            if (! $row->usable()) {
                throw new ApiException(410, 'code_used', 'This code was already used or has expired. Ask for a new one.');
            }
            $salon = Business::query()->listable()->find($row->business_id)
                ?? throw ApiException::notFound('This salon is not on the map now.');
            $own = $salon->account()->owner_id === $user->id
                || BusinessMember::query()->where('business_id', $salon->account()->id)->where('user_id', $user->id)->exists();
            if ($own) {
                throw new ApiException(422, 'own_salon', 'You can’t review your own salon.');
            }
            $recent = Review::query()->where('user_id', $user->id)->where('source', 'qr')
                ->where('business_id', $salon->id)->where('created_at', '>', now()->subDays((int) config('usta.qr_reviews.per_salon_days')))->exists();
            $today = Review::query()->where('user_id', $user->id)->where('source', 'qr')
                ->where('created_at', '>', now()->subDay())->count();
            if ($recent || $today >= (int) config('usta.qr_reviews.per_day')) {
                throw new ApiException(429, 'review_limit', 'You’ve left a review here recently.');
            }

            $master = $row->master_id ? Master::query()->where('business_id', $salon->id)->find($row->master_id) : null;
            $review = new Review;
            $review->forceFill([
                'business_id' => $salon->id,
                'master_id' => $master?->id,
                'user_id' => $user->id,
                'source' => 'qr',
                'author' => $user->shortName() ?: 'İstifadəçi',
                'rating' => (int) $data['rating'],
                'master_rating' => $master ? ($data['master_rating'] ?? null) : null,
                'text' => trim((string) ($data['text'] ?? '')),
                'tags' => array_values(array_unique($data['tags'] ?? [])),
            ])->save();
            $row->forceFill(['used_at' => now(), 'review_id' => $review->id])->save();

            $this->ratings->refreshBusiness($salon);
            if ($master) {
                $this->ratings->refreshMaster($master);
            }

            return $review;
        });

        return response()->json((new ReviewResource($review))->resolve($request), 201);
    }

    private function find(string $code): ReviewCode
    {
        if (! preg_match('/^[A-Za-z0-9]{16,64}$/', $code)) {
            throw ApiException::notFound('Unknown code.');
        }

        return ReviewCode::query()->with(['business', 'master'])->where('token_hash', ReviewCode::hash($code))->first()
            ?? throw ApiException::notFound('Unknown code.');
    }
}
