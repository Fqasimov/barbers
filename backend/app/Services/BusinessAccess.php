<?php

namespace App\Services;

use App\Models\Business;
use App\Models\BusinessMember;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Who can run which salon. The owner runs the main salon and, on Pro, its
 * branches. A manager the owner invited runs one branch or all of them.
 */
class BusinessAccess
{
    /**
     * Every location the user may work on, the owner's own first.
     *
     * @return Collection<int, array{business: Business, role: string, member: ?BusinessMember}>
     */
    public function locations(User $user): Collection
    {
        $this->claimInvites($user);
        $out = collect();
        $main = Business::query()->where('owner_id', $user->id)->whereNull('parent_id')->first();
        if ($main) {
            foreach ($main->locations() as $b) {
                $out->push(['business' => $b, 'role' => 'owner', 'member' => null]);
            }
        }
        $members = BusinessMember::query()->where('user_id', $user->id)->whereNotNull('accepted_at')->with('business')->get();
        foreach ($members as $m) {
            if (! $m->business || ! $m->business->hasFeature('managers')) {
                continue;
            }
            foreach ($m->business->locations() as $b) {
                if ($m->covers($b) && ! $out->contains(fn ($row) => $row['business']->id === $b->id)) {
                    $out->push(['business' => $b, 'role' => 'manager', 'member' => $m]);
                }
            }
        }

        return $out;
    }

    /** The location to act on: the one asked for (X-Branch), else the first. */
    public function resolve(User $user, ?string $id = null): ?array
    {
        $all = $this->locations($user);

        return $id ? $all->first(fn ($row) => $row['business']->id === $id) : $all->first();
    }

    /** Invites wait for the invited email; a verified account with that email takes them. */
    public function claimInvites(User $user): void
    {
        if (! $user->email || ! $user->isVerified()) {
            return;
        }
        BusinessMember::query()->whereNull('user_id')->where('email', mb_strtolower($user->email))
            ->update(['user_id' => $user->id, 'accepted_at' => now(), 'updated_at' => now()]);
    }
}
