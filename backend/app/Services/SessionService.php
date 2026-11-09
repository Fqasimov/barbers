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
        $business = app(BusinessAccess::class)->resolve($user)['business'] ?? null;

        return [
            'token' => $token,
            'user' => (new UserResource($user))->resolve($request),
            'business' => $business ? (new BusinessResource($business))->forUser($user)->resolve($request) : null,
            'staff' => self::staff($user),
        ];
    }

    /** The master's cabinet this user holds, if the owner invited them as staff. */
    public static function staff(User $user): ?array
    {
        $seat = app(BusinessAccess::class)->staffSeat($user);

        return $seat ? [
            'salon_id' => $seat->master->business_id,
            'salon_name' => $seat->master->business->name,
            'master_id' => $seat->master_id,
            'master_name' => $seat->master->name,
        ] : null;
    }
}
