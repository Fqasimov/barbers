<?php

namespace App\Http\Resources;

use App\Models\Business;
use App\Services\RatingService;
use App\Support\Catalogue;
use App\Support\Loc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The public venue. Expects services, masters.services and photos loaded.
 *
 * @mixin Business
 */
class SalonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $kind = $this->kind ? Loc::fill($this->kind) : Catalogue::kind($this->categories ?? []);
        $tagline = $this->tagline
            ? Loc::fill($this->tagline)
            : array_map(fn ($k) => trim($k.($this->district ? ' · '.$this->district : '')), $kind);
        $coords = $this->latitude !== null && $this->longitude !== null
            ? ['latitude' => (float) $this->latitude, 'longitude' => (float) $this->longitude]
            : config('usta.default_coords');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'kind' => $kind,
            'categories' => array_values($this->categories ?? []),
            'tagline' => $tagline,
            'about' => Loc::fill($this->about),
            'address' => $this->address,
            'district' => $this->district,
            'coords' => $coords,
            'price_level' => $this->price_level ?: Catalogue::priceLevel($this->services->pluck('price')->all()),
            'tone' => $this->tone ?: Catalogue::tone($this->id),
            'rating' => RatingService::average((float) $this->base_rating, (int) $this->base_review_count, (int) $this->review_sum, (int) $this->review_count),
            'review_count' => (int) $this->base_review_count + (int) $this->review_count,
            'distribution' => RatingService::distribution($this->resource),
            'hours' => ['open' => $this->hours_open, 'close' => $this->hours_close],
            'closed_days' => array_values(array_map('intval', $this->closed_days ?? [])),
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'women_only' => $this->audience === 'women',
            'audience' => $this->audience,
            'amenities' => array_map(fn ($a) => Loc::fill($a), $this->amenities ?? []),
            'photos' => $this->photos->map(fn ($p) => $p->url())->values()->all(),
            'services' => ServiceResource::collection($this->services)->resolve($request),
            'masters' => MasterResource::collection($this->masters)->resolve($request),
        ];
    }
}
