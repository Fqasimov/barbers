<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Models\Business;
use App\Models\WaitlistEntry;
use App\Support\Baku;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

/** The client's side of the Pro waitlist. */
class WaitlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rows = WaitlistEntry::query()->where('user_id', $request->user()->id)
            ->where('date', '>=', Baku::today()->toDateString())->orderBy('date')->get();

        return response()->json($rows->map(fn ($e) => $this->row($e))->values()->all());
    }

    public function store(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'service_ids' => ['required', 'array', 'min:1', 'max:10'],
            'service_ids.*' => ['string', 'max:64'],
            'master_id' => ['sometimes', 'nullable', 'string', 'max:64'],
            'date' => ['required', 'date_format:Y-m-d'],
            'from_min' => ['sometimes', 'integer', 'min:0', 'max:1440'],
            'to_min' => ['sometimes', 'integer', 'min:0', 'max:1440'],
        ]);
        $salon = Business::query()->bookable()->with(['services', 'masters'])->find($id) ?? throw ApiException::notFound('Salon not found.');
        $salon->requireFeature('waitlist');
        $date = Baku::date($data['date']);
        if ($date->lt(Baku::today()) || $date->gt(Baku::today()->addDays(30))) {
            throw ValidationException::withMessages(['date' => ['Pick a day in the next month.']]);
        }
        $ids = array_values(array_unique($data['service_ids']));
        if ($salon->services->whereIn('id', $ids)->count() !== count($ids)) {
            throw ValidationException::withMessages(['service_ids' => ['One of the services is not offered by this salon.']]);
        }
        if (! empty($data['master_id']) && ! $salon->masters->contains('id', $data['master_id'])) {
            throw ValidationException::withMessages(['master_id' => ['This master does not work at this salon.']]);
        }
        $user = $request->user();
        $active = WaitlistEntry::query()->where('user_id', $user->id)->where('date', '>=', Baku::today()->toDateString())->count();
        if ($active >= (int) config('usta.waitlist.per_user')) {
            throw new ApiException(422, 'waitlist_limit', 'You are already waiting at '.config('usta.waitlist.per_user').' places.');
        }
        $entry = WaitlistEntry::query()->firstOrNew(['business_id' => $salon->id, 'user_id' => $user->id, 'date' => $date->toDateString()]);
        $entry->forceFill([
            'service_ids' => $ids,
            'master_id' => $data['master_id'] ?? null,
            'from_min' => (int) ($data['from_min'] ?? 0),
            'to_min' => (int) ($data['to_min'] ?? 1440),
            'notified_at' => null,
        ])->save();

        return response()->json($this->row($entry), 201);
    }

    public function destroy(Request $request, string $id): Response
    {
        WaitlistEntry::query()->where('user_id', $request->user()->id)->findOrFail($id)->delete();

        return response()->noContent();
    }

    private function row(WaitlistEntry $e): array
    {
        return [
            'id' => $e->id,
            'salon_id' => $e->business_id,
            'date' => substr((string) $e->date, 0, 10),
            'service_ids' => array_values($e->service_ids ?? []),
            'master_id' => $e->master_id,
            'from_min' => $e->from_min,
            'to_min' => $e->to_min,
            'notified' => $e->notified_at !== null,
        ];
    }
}
