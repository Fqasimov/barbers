<?php

namespace App\Http\Resources;

use App\Support\Iso;
use Illuminate\Http\Request;

/** The salon's view: the booking plus the client. @mixin \App\Models\Booking */
class BusinessBookingResource extends BookingResource
{
    public function toArray(Request $request): array
    {
        $user = $this->user;

        $byHand = $this->source === 'salon';

        return parent::toArray($request) + [
            'kind' => $this->kind,
            'source' => $this->source,
            'end' => Iso::ts($this->end_at),
            'client' => [
                'name' => $byHand ? (string) $this->client_name : ($user ? $user->fullName() : 'Deleted user'),
                'phone' => $byHand ? (string) $this->client_phone : ($user?->phone ?? ''),
            ],
        ];
    }

    /** The salon sees the stored status, so it can still mark a past visit done or a no-show. */
    protected function status(): string
    {
        return $this->status;
    }
}
