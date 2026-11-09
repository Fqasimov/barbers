<?php

namespace App\Http\Resources;

use App\Models\Master;
use App\Services\RatingService;
use App\Support\Catalogue;
use App\Support\Loc;
use App\Support\PublicFile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Master */
class MasterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $photo = PublicFile::url($this->photo_path);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'role' => Loc::fill($this->role),
            'years' => (int) $this->years,
            'rating' => RatingService::score($this->resource),
            'review_count' => (int) $this->base_review_count + (int) $this->review_count,
            'service_ids' => $this->serviceIds(),
            'work_days' => array_values(array_map('intval', $this->work_days ?? [])),
            'shift' => ['start' => $this->shift_start, 'end' => $this->shift_end],
            // Per weekday, index 0 = Sunday: {start, end} or null on a day off.
            'schedule' => $this->resource->weekSchedule(),
            'tone' => $this->tone ?: Catalogue::tone($this->id),
            'languages' => array_values($this->languages ?? []),
            'photo_url' => $photo,
        ];
    }
}
