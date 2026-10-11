<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Support\Iso;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            // Empty strings until the user fills them in (social sign-in), as the app expects.
            'phone' => $this->phone ?? '',
            'birth_date' => $this->birth_date?->format('Y-m-d') ?? '',
            'gender' => $this->gender,
            'role' => $this->role,
            'provider' => $this->provider,
            'email_verified' => $this->email_verified_at !== null,
            'created_at' => Iso::ts($this->created_at),
        ];
    }
}
