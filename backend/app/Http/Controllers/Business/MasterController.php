<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Http\Resources\MasterResource;
use App\Models\Booking;
use App\Models\Master;
use App\Rules\LocText;
use App\Rules\V;
use App\Support\Loc;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** No limit and no charge per master. */
class MasterController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request, creating: true);
        $business = $this->business($request);

        $master = DB::transaction(function () use ($data, $business) {
            $master = new Master;
            $master->forceFill($this->attributes($data) + [
                'business_id' => $business->id,
                'years' => $data['years'] ?? 0,
                'languages' => $data['languages'] ?? ['az'],
                'position' => (int) Master::query()->where('business_id', $business->id)->max('position') + 1,
            ])->save();
            $master->services()->sync($data['service_ids'] ?? []);

            return $master;
        });

        return response()->json((new MasterResource($master->load('services')))->resolve($request), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $master = $this->owned($request, Master::class, $id);
        $data = $this->validated($request, creating: false, master: $master);

        DB::transaction(function () use ($master, $data) {
            $master->forceFill($this->attributes($data))->save();
            if (array_key_exists('service_ids', $data)) {
                $master->services()->sync($data['service_ids']);
            }
        });

        return response()->json((new MasterResource($master->fresh('services')))->resolve($request));
    }

    public function destroy(Request $request, string $id): Response
    {
        $master = $this->owned($request, Master::class, $id);
        $busy = Booking::query()->where('master_id', $master->id)->where('status', Booking::UPCOMING)
            ->where('end_at', '>', now())->exists();
        if ($busy) {
            throw ValidationException::withMessages(['master' => ['This master still has upcoming bookings. Cancel or finish them first.']]);
        }
        $master->delete();

        return response()->noContent();
    }

    private function validated(Request $request, bool $creating, ?Master $master = null): array
    {
        $req = $creating ? 'required' : 'sometimes';
        $businessId = $this->business($request)->id;
        $data = $request->validate([
            'name' => [$req, 'string', 'min:2', 'max:80'],
            'role' => [$req, new LocText(80)],
            'years' => ['sometimes', 'integer', 'min:0', 'max:80'],
            'service_ids' => ['sometimes', 'array'],
            'service_ids.*' => ['string', 'distinct', Rule::exists('services', 'id')->where('business_id', $businessId)],
            'work_days' => [$req, 'array', 'max:7'],
            'work_days.*' => ['integer', 'distinct', 'between:0,6'],
            'shift' => [$req, 'array'],
            'shift.start' => ['required_with:shift', ...V::clock()],
            'shift.end' => ['required_with:shift', ...V::clock()],
            'languages' => ['sometimes', 'array', 'max:4'],
            'languages.*' => ['string', 'distinct', Rule::in(['az', 'ru', 'en', 'tr'])],
        ]);
        if (isset($data['shift']) && $data['shift']['end'] <= $data['shift']['start']) {
            throw ValidationException::withMessages(['shift.end' => ['The shift must end after it starts.']]);
        }

        return $data;
    }

    private function attributes(array $data): array
    {
        $out = [];
        if (isset($data['name'])) {
            $out['name'] = trim($data['name']);
        }
        if (isset($data['role'])) {
            $out['role'] = Loc::from($data['role']);
        }
        if (isset($data['years'])) {
            $out['years'] = (int) $data['years'];
        }
        if (isset($data['work_days'])) {
            $out['work_days'] = array_values(array_map('intval', $data['work_days']));
        }
        if (isset($data['shift'])) {
            $out['shift_start'] = $data['shift']['start'];
            $out['shift_end'] = $data['shift']['end'];
        }
        if (isset($data['languages'])) {
            $out['languages'] = array_values($data['languages']);
        }

        return $out;
    }
}
