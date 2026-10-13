<?php

namespace App\Http\Resources;

use App\Models\Review;
use App\Support\Iso;
use App\Support\Loc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Review */
class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'salon_id' => $this->business_id,
            'master_id' => $this->master_id,
            'author' => $this->author,
            'rating' => (int) $this->rating,
            'text' => $this->text,
            'date' => Iso::ts($this->created_at),
            'service_name' => Loc::orNull($this->service_name),
            'tags' => array_values($this->tags ?? []),
            'booking_id' => $this->booking_id,
            'reply' => $this->reply,
            'replied_at' => $this->replied_at ? Iso::ts($this->replied_at) : null,
        ];
    }
}
