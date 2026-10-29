<?php

namespace App\Http\Resources;

use App\Models\Subscription;
use App\Support\Iso;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Subscription */
class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'plan' => $this->plan,
            'billing_period' => $this->billing_period ?? 'month',
            'status' => $this->status,
            'started_at' => Iso::ts($this->started_at),
            'trial_ends_at' => Iso::ts($this->trial_ends_at ?? $this->started_at),
            'current_period_end' => Iso::ts($this->current_period_end),
            // Until then a lapsed salon stays listed and bookable.
            'grace_ends_at' => Iso::ts($this->graceEndsAt()),
        ];
    }
}
