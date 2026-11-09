<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Http\Resources\MasterResource;
use App\Models\Attendance;
use App\Models\Booking;
use App\Models\BusinessMember;
use App\Services\BusinessAccess;
use App\Services\Stats;
use App\Support\AttendanceRow;
use App\Support\Baku;
use App\Support\Iso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * A master's own cabinet: check in when the shift starts, check out when it ends,
 * see the week's schedule, their bookings and what they earned. Only for team
 * members the owner invited as staff and linked to a master.
 */
class StaffController extends Controller
{
    public function __construct(private BusinessAccess $access) {}

    public function show(Request $request): JsonResponse
    {
        $seat = $this->seat($request);
        $master = $seat->master;
        $salon = $master->business;
        $today = Baku::today();
        $open = $this->openShift($seat);
        $todayRows = Attendance::query()->where('master_id', $master->id)->where('day', $today->toDateString())
            ->orderBy('check_in_at')->get();
        $recent = Attendance::query()->where('master_id', $master->id)->where('day', '>=', $today->subDays(13)->toDateString())
            ->orderByDesc('check_in_at')->limit(40)->get();
        $bookings = Booking::query()->where('master_id', $master->id)->where('kind', Booking::VISIT)
            ->whereIn('status', [Booking::UPCOMING, Booking::COMPLETED])
            ->where('start_at', '>=', $today->utc())->where('start_at', '<', $today->addDays(7)->utc())
            ->orderBy('start_at')->limit(200)->get();

        return response()->json([
            'salon' => [
                'id' => $salon->id,
                'name' => $salon->name,
                'address' => $salon->address,
                'logo_url' => $salon->logoUrl(),
                'hours_week' => $salon->weekHours(),
            ],
            'master' => (new MasterResource($master->load('services')))->resolve($request),
            'checked_in' => $open !== null,
            'open_shift' => $open ? AttendanceRow::make($open, $master) : null,
            'today' => $todayRows->map(fn ($a) => AttendanceRow::make($a, $master))->values()->all(),
            'recent' => $recent->map(fn ($a) => AttendanceRow::make($a, $master))->values()->all(),
            'bookings' => $bookings->map(fn (Booking $b) => [
                'id' => $b->id,
                'start_at' => Iso::ts($b->start_at),
                'end_at' => Iso::ts($b->end_at),
                'services' => collect($b->services)->pluck('name')->values()->all(),
                'total' => (int) $b->total,
                'status' => $b->status,
                'client' => $b->client_name ?: ($b->user?->first_name ?? null),
                'source' => $b->source,
            ])->values()->all(),
            'stats' => app(Stats::class)->compute(collect([$salon]), $today->startOfMonth(), $today, 'location', $master->id),
        ]);
    }

    public function stats(Request $request): JsonResponse
    {
        $seat = $this->seat($request);
        $data = $request->validate([
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d'],
        ]);
        $to = isset($data['to']) ? Baku::date($data['to']) : Baku::today();
        $from = isset($data['from']) ? Baku::date($data['from']) : $to->subDays(29);
        if ($to->lt($from) || $from->diffInDays($to) > 366) {
            throw ValidationException::withMessages(['to' => ['Pick up to a year, ending after it starts.']]);
        }

        return response()->json(app(Stats::class)->compute(collect([$seat->master->business]), $from, $to, 'location', $seat->master_id));
    }

    public function checkIn(Request $request): JsonResponse
    {
        $seat = $this->seat($request);
        $row = DB::transaction(function () use ($seat, $request) {
            // One open shift at a time, even with two taps at once.
            BusinessMember::query()->whereKey($seat->id)->lockForUpdate()->first();
            if ($this->openShift($seat)) {
                throw new ApiException(409, 'already_checked_in', 'You are already checked in.');
            }
            $now = now();
            $a = new Attendance;
            $a->forceFill([
                'business_id' => $seat->master->business_id,
                'master_id' => $seat->master_id,
                'user_id' => $request->user()->id,
                'day' => Baku::local($now)->toDateString(),
                'check_in_at' => $now,
            ])->save();

            return $a;
        });

        return response()->json(AttendanceRow::make($row, $seat->master), 201);
    }

    public function checkOut(Request $request): JsonResponse
    {
        $seat = $this->seat($request);
        $open = $this->openShift($seat);
        if (! $open) {
            throw new ApiException(409, 'not_checked_in', 'You are not checked in.');
        }
        $open->forceFill(['check_out_at' => now()])->save();

        return response()->json(AttendanceRow::make($open, $seat->master));
    }

    private function seat(Request $request): BusinessMember
    {
        $seat = $this->access->staffSeat($request->user());
        if (! $seat) {
            throw ApiException::forbidden('You don’t have a staff cabinet.');
        }

        return $seat;
    }

    /** A shift checked in during the last 20 hours and not yet checked out. */
    private function openShift(BusinessMember $seat): ?Attendance
    {
        return Attendance::query()->where('master_id', $seat->master_id)->whereNull('check_out_at')
            ->where('check_in_at', '>', now()->subHours(20))->latest('check_in_at')->first();
    }
}
