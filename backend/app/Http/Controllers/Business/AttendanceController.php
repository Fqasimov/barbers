<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Master;
use App\Support\AttendanceRow;
use App\Support\Baku;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** When each master checked in and out, against their planned shift. */
class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d'],
            'master_id' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]);
        $business = $this->business($request);
        $business->requireFeature('staff');
        $to = isset($data['to']) ? Baku::date($data['to']) : Baku::today();
        $from = isset($data['from']) ? Baku::date($data['from']) : $to->subDays(6);
        if ($to->lt($from) || $from->diffInDays($to) > 92) {
            throw ValidationException::withMessages(['to' => ['Pick up to three months, ending after it starts.']]);
        }
        $masters = Master::query()->where('business_id', $business->id)->orderBy('position')->get()->keyBy('id');
        $rows = Attendance::query()->where('business_id', $business->id)
            ->whereBetween('day', [$from->toDateString(), $to->toDateString()])
            ->when($data['master_id'] ?? null, fn ($q, $id) => $q->where('master_id', $id))
            ->orderByDesc('check_in_at')->limit(2000)->get();

        $byMaster = $masters->map(function (Master $m) use ($rows) {
            $mine = $rows->where('master_id', $m->id);
            $done = $mine->whereNotNull('check_out_at');

            return [
                'master_id' => $m->id,
                'name' => $m->name,
                'days' => $mine->pluck('day')->map(fn ($d) => (string) $d)->unique()->count(),
                'minutes' => (int) $done->sum(fn ($a) => intdiv($a->check_out_at->getTimestamp() - $a->check_in_at->getTimestamp(), 60)),
                'late' => $mine->filter(fn ($a) => AttendanceRow::make($a, $m)['late_minutes'] > 0)->count(),
                'checked_in' => $mine->contains(fn ($a) => $a->check_out_at === null && $a->check_in_at->gt(now()->subHours(20))),
            ];
        })->values()->all();

        return response()->json([
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'by_master' => $byMaster,
            'rows' => $rows->map(fn ($a) => AttendanceRow::make($a, $masters[$a->master_id] ?? null))->values()->all(),
        ]);
    }
}
