<?php

namespace App\Services;

use App\Http\Resources\BusinessResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class SessionService
{
    public function open(User $user, Request $request): array
    {
        $name = mb_substr((string) ($request->userAgent() ?: 'app'), 0, 120);
        $token = $user->createToken($name)->plainTextToken;

        return $this->payload($user, $token, $request);
    }

    public function payload(User $user, string $token, Request $request): array
    {
        $business = $user->business()->first();

        return [
            'token' => $token,
            'user' => (new UserResource($user))->resolve($request),
            'business' => $business ? (new BusinessResource($business))->resolve($request) : null,
        ];
    }
}
