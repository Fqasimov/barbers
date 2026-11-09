<?php

namespace App\Http\Controllers\Business;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\BusinessMember;
use App\Models\Master;
use App\Models\User;
use App\Support\Iso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

/**
 * The team, invited by email; each signs in with their own account.
 *  - manager (Pro): runs the salon panel of one branch or all of them
 *  - staff (every plan): one master's own cabinet — check-in/out, schedule, bookings, their numbers
 */
class TeamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->ownerOnly($request);
        $rows = BusinessMember::query()->where('business_id', $this->account($request)->id)->with('user')->orderBy('created_at')->get();

        return response()->json($rows->map(fn ($m) => $this->row($m))->values()->all());
    }

    public function store(Request $request): JsonResponse
    {
        $this->ownerOnly($request);
        $this->normalize($request);
        $data = $request->validate([
            'email' => ['required', 'email:rfc', 'max:191'],
            'branch_id' => ['sometimes', 'nullable', 'string', 'max:64'],
            'role' => ['sometimes', Rule::in([BusinessMember::MANAGER, BusinessMember::STAFF])],
            'master_id' => ['required_if:role,staff', 'nullable', 'string', 'max:64'],
        ]);
        $role = $data['role'] ?? BusinessMember::MANAGER;
        $account = $this->account($request);
        $account->requireFeature($role === BusinessMember::STAFF ? 'staff' : 'managers');
        $master = null;
        if ($role === BusinessMember::STAFF) {
            $master = Master::query()->whereIn('business_id', $account->locations()->pluck('id'))->find($data['master_id']);
            if (! $master) {
                throw ApiException::notFound('Unknown master.');
            }
            $taken = BusinessMember::query()->where('business_id', $account->id)->where('role', BusinessMember::STAFF)
                ->where('master_id', $master->id)->where('email', '!=', $data['email'])->exists();
            if ($taken) {
                throw new ApiException(422, 'master_taken', 'This master already has a cabinet.');
            }
            $data['branch_id'] = $master->business_id;
        }
        if (! empty($data['branch_id']) && ! $account->locations()->contains('id', $data['branch_id'])) {
            throw ApiException::notFound('Unknown location.');
        }
        $owner = $request->user();
        if ($data['email'] === mb_strtolower((string) $owner->email)) {
            throw new ApiException(422, 'own_email', 'That is your own email.');
        }
        $member = BusinessMember::query()->firstOrNew(['business_id' => $account->id, 'email' => $data['email']]);
        $member->forceFill(['branch_id' => $data['branch_id'] ?? null, 'role' => $role, 'master_id' => $master?->id]);
        $user = User::query()->where('email', $data['email'])->first();
        if ($user && $user->isVerified() && ! $member->user_id) {
            $member->forceFill(['user_id' => $user->id, 'accepted_at' => now()]);
        }
        $member->save();

        return response()->json($this->row($member->load('user')), 201);
    }

    public function destroy(Request $request, string $id): Response
    {
        $this->ownerOnly($request);
        BusinessMember::query()->where('business_id', $this->account($request)->id)->findOrFail($id)->delete();

        return response()->noContent();
    }

    private function row(BusinessMember $m): array
    {
        return [
            'id' => (string) $m->id,
            'email' => $m->email,
            'name' => $m->user?->fullName(),
            'branch_id' => $m->branch_id,
            'role' => $m->role,
            'master_id' => $m->master_id,
            // Waits until someone with this email signs in.
            'accepted' => $m->accepted_at !== null,
            'created_at' => Iso::ts($m->created_at),
        ];
    }
}
