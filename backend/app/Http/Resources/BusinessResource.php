<?php

namespace App\Http\Resources;

use App\Support\Iso;
use App\Support\Loc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** The owner's private view. @mixin \App\Models\Business */
class BusinessResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $this->resource->loadMissing(['subscription', 'services', 'masters.services', 'photos']);

        return [
            'id' => $this->id,
            'owner_id' => $this->owner_id,
            'salon_id' => $this->id,
            'salon_name' => $this->name,
            'categories' => array_values($this->categories ?? []),
            'district' => $this->district,
            'address' => $this->address,
            'coords' => $this->latitude !== null && $this->longitude !== null
                ? ['latitude' => (float) $this->latitude, 'longitude' => (float) $this->longitude]
                : null,
            'audience' => $this->audience,
            'about' => Loc::orNull($this->about),
            'phone' => $this->phone,
            'whatsapp' => $this->whatsapp,
            'hours' => ['open' => $this->hours_open, 'close' => $this->hours_close],
            'closed_days' => array_values(array_map('intval', $this->closed_days ?? [])),
            'status' => $this->status,
            'subscription' => $this->subscription ? (new SubscriptionResource($this->subscription))->resolve($request) : null,
            'masters' => MasterResource::collection($this->masters)->resolve($request),
            'services' => ServiceResource::collection($this->services)->resolve($request),
            'photos' => PhotoResource::collection($this->photos)->resolve($request),
            'created_at' => Iso::ts($this->created_at),
        ];
    }
}
