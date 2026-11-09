<?php

namespace App\Http\Controllers\Business;

use App\Http\Controllers\Controller;
use App\Models\SalonClick;
use App\Models\WaitlistEntry;
use App\Services\Stats;
use App\Support\Baku;
use App\Support\Iso;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Statistics (one location or all of them), the click report and the waitlist. */
class InsightsController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $data = $request->validate([
            'from' => ['sometimes', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'date_format:Y-m-d'],
            'scope' => ['sometimes', Rule::in(['location', 'all'])],
            'master_id' => ['sometimes', 'nullable', 'string', 'max:64'],
        ]);
        $this->business($request)->requireFeature('stats');
        $to = isset($data['to']) ? Baku::date($data['to']) : Baku::today();
        $from = isset($data['from']) ? Baku::date($data['from']) : $to->subDays(29);
        if ($to->lt($from) || $from->diffInDays($to) > 366) {
            throw ValidationException::withMessages(['to' => ['Pick up to a year, ending after it starts.']]);
        }
        $all = ($data['scope'] ?? 'location') === 'all';
        if ($all) {
            $this->ownerOnly($request);
        }
        $locations = $all ? $this->account($request)->locations() : collect([$this->business($request)]);

        return response()->json(app(Stats::class)->compute($locations, $from, $to, $all ? 'all' : 'location', $data['master_id'] ?? null));
    }

    /** Taps on the salon page per month: views, Book, phone, WhatsApp, directions. */
    public function clicks(Request $request): JsonResponse
    {
        $data = $request->validate(['month' => ['sometimes', 'date_format:Y-m']]);
        $business = $this->business($request);
        $business->requireFeature('click_report');
        $start = isset($data['month']) ? Baku::date($data['month'].'-01') : Baku::today()->startOfMonth();
        $end = $start->addMonth();
        $rows = SalonClick::query()->where('business_id', $business->id)
            ->where('day', '>=', $start->toDateString())->where('day', '<', $end->toDateString())->get();
        $totals = array_fill_keys(SalonClick::KINDS, 0);
        $days = [];
        foreach ($rows as $r) {
            $totals[$r->kind] = ($totals[$r->kind] ?? 0) + $r->taps;
            $d = substr((string) $r->day, 0, 10);
            $days[$d] ??= ['date' => $d] + array_fill_keys(SalonClick::KINDS, 0);
            $days[$d][$r->kind] += $r->taps;
        }
        ksort($days);

        return response()->json(['month' => $start->format('Y-m'), 'totals' => $totals, 'by_day' => array_values($days)]);
    }

    /** Who is waiting for a time, today and later. */
    public function waitlist(Request $request): JsonResponse
    {
        $business = $this->business($request);
        $business->requireFeature('waitlist');
        $rows = WaitlistEntry::query()->where('business_id', $business->id)
            ->where('date', '>=', Baku::today()->toDateString())->with('user')->orderBy('date')->orderBy('created_at')->get();

        return response()->json($rows->map(fn (WaitlistEntry $e) => [
            'id' => $e->id,
            'date' => substr((string) $e->date, 0, 10),
            'from_min' => $e->from_min,
            'to_min' => $e->to_min,
            'master_id' => $e->master_id,
            'service_ids' => array_values($e->service_ids ?? []),
            'client' => ['name' => $e->user?->fullName() ?? '', 'phone' => $e->user?->phone ?? ''],
            'notified_at' => Iso::ts($e->notified_at),
        ])->values()->all());
    }
}
