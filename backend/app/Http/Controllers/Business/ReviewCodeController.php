<?php

namespace App\Http\Controllers\Business;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Master;
use App\Models\ReviewCode;
use App\Support\Iso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/** "Rəy QR": a new one-time code for the client in the chair. */
class ReviewCodeController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['master_id' => ['sometimes', 'nullable', 'string', 'max:64']]);
        $business = $this->business($request);
        $business->requireFeature('qr_reviews');
        $master = ! empty($data['master_id']) ? $this->owned($request, Master::class, $data['master_id']) : null;
        // More codes than visits a day would only feed fake reviews.
        $today = ReviewCode::query()->where('business_id', $business->id)->where('created_at', '>', now()->subDay())->count();
        if ($today >= (int) config('usta.qr_reviews.codes_per_day', 150)) {
            throw new ApiException(429, 'code_limit', 'That is a lot of review codes for one day. Try again tomorrow or contact support.');
        }

        $code = Str::random(24);
        $row = new ReviewCode;
        $row->forceFill([
            'business_id' => $business->id,
            'master_id' => $master?->id,
            'created_by' => $request->user()->id,
            'token_hash' => ReviewCode::hash($code),
            'expires_at' => now()->addHours((int) config('usta.qr_reviews.ttl_hours')),
        ])->save();

        $web = rtrim((string) config('usta.web_url'), '/');

        return response()->json([
            'code' => $code,
            'url' => "{$web}/r/{$code}",
            'expires_at' => Iso::ts($row->expires_at),
            'master_id' => $master?->id,
            // The fixed wall QR: opens the salon page, never leaves a review.
            'wall_url' => "{$web}/s/{$business->id}",
        ], 201);
    }
}
