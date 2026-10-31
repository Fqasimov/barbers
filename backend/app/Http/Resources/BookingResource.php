<?php

namespace App\Http\Resources;

use App\Models\Booking;
use App\Support\Iso;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** The customer's view. @mixin \App\Models\Booking */
class BookingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'salon_id' => $this->business_id,
            'master_id' => $this->master_id,
            'service_ids' => $this->serviceIds(),
            'start' => Iso::ts($this->start_at),
            'duration_min' => (int) $this->duration_min,
            'total' => (int) $this->total,
            'note' => $this->note,
            'status' => $this->status(),
            'cancelled_by' => $this->cancelled_by,
            'reviewed' => $this->reviewed(),
            // Pro salons: pending (pay to confirm) | paid | refunded | refund_due | kept | applied | expired.
            'deposit' => (int) $this->deposit,
            'deposit_status' => $this->deposit_status,
            'hold_until' => $this->status === Booking::PENDING_PAYMENT ? Iso::ts($this->hold_until) : null,
            'checkout_url' => $this->checkout_url ?? null,
            'created_at' => Iso::ts($this->created_at),
        ];
    }

    protected function status(): string
    {
        return $this->customerStatus();
    }

    protected function reviewed(): bool
    {
        if (isset($this->review_exists)) {
            return (bool) $this->review_exists;
        }

        return $this->relationLoaded('review') ? $this->review !== null : $this->review()->exists();
    }
}
