<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The salon's reviews, newest first, and its public replies. */
class BusinessReviewController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate(['page' => ['sometimes', 'integer', 'min:1', 'max:10000']]);
        $page = (int) ($data['page'] ?? 1);
        $per = 30;
        $rows = Review::query()->visible()->where('business_id', $this->business($request)->id)
            ->orderByDesc('created_at')->orderByDesc('id')
            ->offset(($page - 1) * $per)->limit($per + 1)->get();

        return response()->json([
            'data' => ReviewResource::collection($rows->take($per))->resolve($request),
            'next_page' => $rows->count() > $per ? $page + 1 : null,
        ]);
    }

    /** Sets, changes or (with an empty reply) removes the salon's answer. */
    public function reply(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['reply' => ['present', 'nullable', 'string', 'max:1000']]);
        /** @var Review $review */
        $review = $this->owned($request, Review::class, $id);
        $text = trim((string) ($data['reply'] ?? ''));
        $review->forceFill(['reply' => $text === '' ? null : $text, 'replied_at' => $text === '' ? null : now()])->save();

        return response()->json((new ReviewResource($review))->resolve($request));
    }
}
