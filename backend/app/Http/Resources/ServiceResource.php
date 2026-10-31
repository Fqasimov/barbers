<?php

namespace App\Http\Resources;

use App\Models\Service;
use App\Support\Loc;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Service */
class ServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'name' => Loc::fill($this->name),
            'description' => Loc::orNull($this->description),
            'category' => $this->category,
            'duration_min' => (int) $this->duration_min,
            'price' => (int) $this->price,
            // Pro salons: paid when booking, refunded on a timely cancel, kept on a no-show.
            'deposit' => ['type' => $this->deposit_type ?? 'none', 'value' => (int) $this->deposit_value],
        ];
    }
}
