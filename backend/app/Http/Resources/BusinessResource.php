<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\BusinessAccess;
use App\Support\Iso;
use App\Support\Loc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** The owner's (or a manager's) private view of one location. @mixin \App\Models\Business */
class BusinessResource extends JsonResource
{
    private ?User $viewer = null;

    /** Whose view this is when the request has no signed-in user yet (sign-in responses). */
    public function forUser(User $user): static
    {
        $this->viewer = $user;

        return $this;
    }

    public function toArray(Request $request): array
    {
        $this->resource->loadMissing(['services', 'masters.services', 'photos']);
        $account = $this->resource->account();
        $account->loadMissing('subscription');
        $sub = $account->subscription;
        $plan = $sub?->plan;
        $viewer = $this->viewer ?? $request->user();
        $role = $viewer && $viewer->id === $this->owner_id ? 'owner' : 'manager';
        $locations = $viewer
            ? app(BusinessAccess::class)->locations($viewer)->map(fn ($row) => [
                'id' => $row['business']->id,
                'name' => $row['business']->name,
                'address' => $row['business']->address,
                'district' => $row['business']->district,
                'status' => $row['business']->status,
                'is_main' => $row['business']->parent_id === null,
                'role' => $row['role'],
            ])->values()->all()
            : [];
        $packLive = $account->whatsapp_until && $account->whatsapp_until->isFuture();

        return [
            'id' => $this->id,
            'owner_id' => $this->owner_id,
            'salon_id' => $this->id,
            // A Pro branch: billed through the main salon.
            'parent_id' => $this->parent_id,
            'role' => $role,
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
            'booking_url' => $this->booking_url,
            'hours' => ['open' => $this->hours_open, 'close' => $this->hours_close],
            'closed_days' => array_values(array_map('intval', $this->closed_days ?? [])),
            'status' => $this->status,
            'subscription' => $sub ? (new SubscriptionResource($sub))->resolve($request) : null,
            'features' => $plan ? array_values(config("usta.plan_features.{$plan}", [])) : [],
            'locations' => $locations,
            'whatsapp_pack' => [
                'left' => $packLive ? max(0, (int) $account->whatsapp_quota - (int) $account->whatsapp_used) : 0,
                'until' => $packLive ? Iso::ts($account->whatsapp_until) : null,
            ],
            'masters' => MasterResource::collection($this->masters)->resolve($request),
            'services' => ServiceResource::collection($this->services)->resolve($request),
            'photos' => PhotoResource::collection($this->photos)->resolve($request),
            'created_at' => Iso::ts($this->created_at),
        ];
    }
}
