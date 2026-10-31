<?php

namespace App\Http\Controllers\Business;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\BusinessMember;
use App\Models\User;
use App\Support\Iso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/** Pro: managers. Invited by email; they sign in with their own account. */
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
        ]);
        $account = $this->account($request);
        $account->requireFeature('managers');
        if (! empty($data['branch_id']) && ! $account->locations()->contains('id', $data['branch_id'])) {
            throw ApiException::notFound('Unknown location.');
        }
        $owner = $request->user();
        if ($data['email'] === mb_strtolower((string) $owner->email)) {
            throw new ApiException(422, 'own_email', 'That is your own email.');
        }
        $member = BusinessMember::query()->firstOrNew(['business_id' => $account->id, 'email' => $data['email']]);
        $member->forceFill(['branch_id' => $data['branch_id'] ?? null, 'role' => BusinessMember::MANAGER]);
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
            // Waits until someone with this email signs in.
            'accepted' => $m->accepted_at !== null,
            'created_at' => Iso::ts($m->created_at),
        ];
    }
}
