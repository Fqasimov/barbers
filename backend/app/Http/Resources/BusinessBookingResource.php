<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/** The salon's view: the booking plus the client. @mixin \App\Models\Booking */
class BusinessBookingResource extends BookingResource
{
    public function toArray(Request $request): array
    {
        $user = $this->user;

        return parent::toArray($request) + [
            'client' => [
                'name' => $user ? $user->fullName() : 'Deleted user',
                'phone' => $user?->phone ?? '',
            ],
        ];
    }

    /** The salon sees the stored status, so it can still mark a past visit done or a no-show. */
    protected function status(): string
    {
        return $this->status;
    }
}
