<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Http\Resources\MasterResource;
use App\Models\Booking;
use App\Models\Master;
use App\Rules\LocText;
use App\Rules\V;
use App\Services\Photos\PhotoProcessor;
use App\Support\Loc;
use App\Support\PhotoUpload;
use App\Support\PublicFile;
use App\Support\Week;
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

    /** A master's portrait, shown on the salon page and in booking. */
    public function photo(Request $request, PhotoProcessor $processor, string $id): JsonResponse
    {
        $master = $this->owned($request, Master::class, $id);
        $path = PhotoUpload::store($request, $processor, "salons/{$master->business_id}/masters", 800);
        $old = $master->photo_path;
        $master->forceFill(['photo_path' => $path])->save();
        if ($old && ! str_starts_with($old, 'http')) {
            PublicFile::delete($old);
        }

        return response()->json((new MasterResource($master->fresh('services')))->resolve($request));
    }

    public function deletePhoto(Request $request, string $id): JsonResponse
    {
        $master = $this->owned($request, Master::class, $id);
        $old = $master->photo_path;
        $master->forceFill(['photo_path' => null])->save();
        PublicFile::delete($old);

        return response()->json((new MasterResource($master->fresh('services')))->resolve($request));
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
            // Either a per-day schedule, or the older work days + one shift.
            'work_days' => [$creating ? 'required_without:schedule' : 'sometimes', 'array', 'max:7'],
            'work_days.*' => ['integer', 'distinct', 'between:0,6'],
            'shift' => [$creating ? 'required_without:schedule' : 'sometimes', 'array'],
            ...Week::rules('schedule', 'start', 'end'),
            'shift.start' => ['required_with:shift', ...V::clock()],
            'shift.end' => ['required_with:shift', ...V::clock()],
            'languages' => ['sometimes', 'array', 'max:4'],
            'languages.*' => ['string', 'distinct', Rule::in(['az', 'ru', 'en', 'tr'])],
        ]);
        if (isset($data['shift']) && $data['shift']['end'] <= $data['shift']['start']) {
            throw ValidationException::withMessages(['shift.end' => ['The shift must end after it starts.']]);
        }
        if (! empty($data['schedule'])) {
            $data['schedule'] = Week::normalize($data['schedule'], 'schedule', 'start', 'end');
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
        if (array_key_exists('schedule', $data)) {
            if ($data['schedule'] === null) {
                $out['schedule'] = null;
            } else {
                [$off, $start, $end] = Week::summary($data['schedule'], 'start', 'end');
                // Keep work days + one shift in step for app versions that only read those.
                $out['schedule'] = $data['schedule'];
                $out['work_days'] = array_values(array_diff(range(0, 6), $off));
                $out['shift_start'] = $start ?? '10:00';
                $out['shift_end'] = $end ?? '19:00';
            }
        } elseif (isset($out['work_days']) || isset($out['shift_start'])) {
            $out['schedule'] = null;
        }
        if (isset($data['languages'])) {
            $out['languages'] = array_values($data['languages']);
        }

        return $out;
    }
}
