<?php

namespace App\Http\Resources;

use App\Models\Master;
use App\Services\RatingService;
use App\Support\Catalogue;
use App\Support\Loc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin Master */
class MasterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $photo = null;
        if ($this->photo_path) {
            $photo = Storage::disk(config('usta.photo_disk'))->url($this->photo_path);
            $photo = str_starts_with($photo, 'http') ? $photo : url($photo);
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'role' => Loc::fill($this->role),
            'years' => (int) $this->years,
            'rating' => RatingService::average((float) $this->base_rating, (int) $this->base_review_count, (int) $this->review_sum, (int) $this->review_count),
            'review_count' => (int) $this->base_review_count + (int) $this->review_count,
            'service_ids' => $this->serviceIds(),
            'work_days' => array_values(array_map('intval', $this->work_days ?? [])),
            'shift' => ['start' => $this->shift_start, 'end' => $this->shift_end],
            'tone' => $this->tone ?: Catalogue::tone($this->id),
            'languages' => array_values($this->languages ?? []),
            'photo_url' => $photo,
        ];
    }
}
