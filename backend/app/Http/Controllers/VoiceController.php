<?php

namespace App\Http\Controllers;

use App\Exceptions\ApiException;
use App\Models\Business;
use App\Models\Master;
use App\Models\Service;
use App\Services\Availability;
use App\Services\BookingService;
use App\Support\Baku;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Server tools for the voice assistant add-on: an ElevenLabs agent answers the salon's
 * missed calls, asks for a service and a time, checks it here, and books once the caller
 * presses 1. Every call carries the shared secret (X-Voice-Secret) and the salon's id.
 * Answers are short and include a ready Azerbaijani sentence (`say`) the agent can read out.
 */
class VoiceController extends Controller
{
    public function __construct(private Availability $availability, private BookingService $bookings) {}

    /** The start of the call: the salon's name, hours, services and masters. */
    public function info(Request $request, string $salon): JsonResponse
    {
        $b = $this->salon($request, $salon);

        return response()->json([
            'salon' => $b->name,
            'hours' => ['open' => $b->hours_open, 'close' => $b->hours_close],
            'closed_days' => array_values($b->closed_days ?? []),
            'today' => Baku::today()->toDateString(),
            'services' => $b->services->map(fn (Service $s) => [
                'id' => $s->id,
                'name' => $this->name($s->name),
                'minutes' => (int) $s->duration_min,
                'price' => (int) $s->price,
            ])->values()->all(),
            'masters' => $b->masters->map(fn (Master $m) => ['id' => $m->id, 'name' => $m->name])->values()->all(),
        ]);
    }

    /** Is this service free at this time? If not, the nearest free times. */
    public function check(Request $request, string $salon): JsonResponse
    {
        $b = $this->salon($request, $salon);
        $data = $this->ask($request);
        [$service, $masters, $date, $minute] = $this->resolve($b, $data);
        if ($service instanceof JsonResponse) {
            return $service;
        }
        $hit = $this->freeMaster($b, $service, $masters, $date, $minute);
        if ($hit) {
            return response()->json([
                'available' => true,
                'service_id' => $service->id,
                'master_id' => $hit->id,
                'master' => $hit->name,
                'date' => $date->toDateString(),
                'time' => $data['time'],
                'say' => sprintf('%s %s saat %s-da boşdur, usta %s. Təsdiq etmək üçün telefonda 1 düyməsini basın.',
                    $this->name($service->name), $this->day($date), $data['time'], $hit->name),
            ]);
        }

        $options = $this->alternatives($b, $service, $masters, $date, $minute);

        return response()->json([
            'available' => false,
            'service_id' => $service->id,
            'alternatives' => $options,
            'say' => $options
                ? sprintf('Təəssüf, bu vaxt doludur. Ən yaxın boş vaxtlar: %s. Hansı uyğundur?',
                    implode(', ', array_map(fn ($o) => $this->day(Baku::date($o['date'])).' saat '.$o['time'], $options)))
                : 'Təəssüf, yaxın günlərdə bu xidmət üçün boş vaxt yoxdur.',
        ]);
    }

    /** Books the time, but only after the caller pressed 1 to confirm. */
    public function book(Request $request, string $salon): JsonResponse
    {
        $b = $this->salon($request, $salon);
        $data = $this->ask($request, [
            'client_name' => ['required', 'string', 'max:80'],
            'caller_phone' => ['nullable', 'string', 'max:20'],
            'confirm_digit' => ['required', 'string', 'max:2'],
        ]);
        if (trim($data['confirm_digit']) !== '1') {
            return response()->json([
                'booked' => false,
                'say' => 'Bron təsdiqlənmədi. Təsdiq üçün 1 düyməsini basın və ya başqa vaxt deyin.',
            ]);
        }
        [$service, $masters, $date, $minute] = $this->resolve($b, $data);
        if ($service instanceof JsonResponse) {
            return $service;
        }
        $hit = $this->freeMaster($b, $service, $masters, $date, $minute);
        if (! $hit) {
            return response()->json([
                'booked' => false,
                'alternatives' => $this->alternatives($b, $service, $masters, $date, $minute),
                'say' => 'Təəssüf, bu vaxt indicə tutuldu. Başqa vaxt təklif edim?',
            ]);
        }

        $booking = $this->bookings->createBySalon($b, [
            'master_id' => $hit->id,
            'service_ids' => [$service->id],
            'start' => $date->addMinutes($minute)->toIso8601String(),
            'client_name' => $data['client_name'],
            'client_phone' => $this->phone($data['caller_phone'] ?? null),
            'note' => 'Səsli köməkçi ilə telefonla bron',
            'source' => 'voice',
        ]);

        return response()->json([
            'booked' => true,
            'booking_id' => $booking->id,
            'say' => sprintf('Hazırdır! %s, %s saat %s-da, usta %s. Sizi gözləyirik. Sağ olun!',
                $this->name($service->name), $this->day($date), $data['time'], $hit->name),
        ], 201);
    }

    // ------------------------------------------------------------------

    private function salon(Request $request, string $id): Business
    {
        $secret = (string) config('usta.voice.secret');
        if ($secret === '' || ! hash_equals($secret, (string) $request->header('X-Voice-Secret'))) {
            throw ApiException::forbidden('Not allowed.');
        }
        $b = Business::query()->listable()->with(['services', 'masters.services'])->find($id);
        if (! $b || ! $b->hasVoiceAssistant()) {
            throw ApiException::notFound('No voice assistant for this salon.');
        }

        return $b;
    }

    private function ask(Request $request, array $more = []): array
    {
        return $request->validate([
            'service' => ['required', 'string', 'max:80'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'master' => ['nullable', 'string', 'max:80'],
        ] + $more);
    }

    /** @return array{0: Service|JsonResponse, 1: Collection<int, Master>, 2: CarbonImmutable, 3: int} */
    private function resolve(Business $b, array $data): array
    {
        $date = Baku::date($data['date']);
        $minute = Baku::minutes($data['time']);
        $service = $this->findService($b, $data['service']);
        if (! $service instanceof Service) {
            $names = $service->map(fn (Service $s) => $this->name($s->name))->implode(', ');

            return [response()->json([
                'available' => false,
                'booked' => false,
                'service_unclear' => true,
                'say' => $service->isEmpty()
                    ? 'Bu xidməti tapmadım. Xidmətlərimiz: '.$b->services->map(fn (Service $s) => $this->name($s->name))->implode(', ').'.'
                    : "Hansı xidməti nəzərdə tutursunuz: {$names}?",
            ]), collect(), $date, $minute];
        }
        $masters = $this->availability->eligible($b, [$service->id]);
        $wanted = trim(mb_strtolower($data['master'] ?? ''));
        if ($wanted !== '') {
            $pick = $masters->filter(fn (Master $m) => $m->id === $data['master'] || str_contains(mb_strtolower($m->name), $wanted));
            if ($pick->isNotEmpty()) {
                $masters = $pick->values();
            }
        }

        return [$service, $masters, $date, $minute];
    }

    /** By id, then by name in any language; several close names come back as a collection. */
    private function findService(Business $b, string $asked): Service|Collection
    {
        if ($s = $b->services->firstWhere('id', $asked)) {
            return $s;
        }
        $q = mb_strtolower(trim($asked));
        $names = fn (Service $s) => array_map('mb_strtolower', array_values((array) $s->name));
        $exact = $b->services->filter(fn (Service $s) => in_array($q, $names($s), true));
        if ($exact->count() === 1) {
            return $exact->first();
        }
        $near = $b->services->filter(fn (Service $s) => collect($names($s))->contains(fn ($n) => str_contains($n, $q) || str_contains($q, $n)));

        return $near->count() === 1 ? $near->first() : $near->values();
    }

    private function freeMaster(Business $b, Service $service, Collection $masters, CarbonImmutable $date, int $minute): ?Master
    {
        $busy = $this->availability->busy($masters->pluck('id')->all(), $date, $date->addDay());
        foreach ($masters as $m) {
            $day = $this->availability->day($b, $m, $date, (int) $service->duration_min, $busy[$m->id] ?? []);
            if (in_array($minute, $day['slots'], true)) {
                return $m;
            }
        }

        return null;
    }

    /** Up to three free times: the nearest on that day, otherwise the first ones in the next days. */
    private function alternatives(Business $b, Service $service, Collection $masters, CarbonImmutable $date, int $minute): array
    {
        for ($i = 0; $i < 7; $i++) {
            $d = $date->addDays($i);
            $busy = $this->availability->busy($masters->pluck('id')->all(), $d, $d->addDay());
            $found = [];
            foreach ($masters as $m) {
                foreach ($this->availability->day($b, $m, $d, (int) $service->duration_min, $busy[$m->id] ?? [])['slots'] as $t) {
                    $found[$t] ??= $m;
                }
            }
            if ($found) {
                $times = array_keys($found);
                usort($times, fn ($a, $c) => $i === 0 ? abs($a - $minute) <=> abs($c - $minute) : $a <=> $c);

                return array_map(fn ($t) => [
                    'date' => $d->toDateString(),
                    'time' => sprintf('%02d:%02d', intdiv($t, 60), $t % 60),
                    'master' => $found[$t]->name,
                ], array_slice($times, 0, 3));
            }
        }

        return [];
    }

    private function name(mixed $loc): string
    {
        $loc = (array) $loc;

        return (string) ($loc['az'] ?? reset($loc) ?: '');
    }

    private function day(CarbonImmutable $date): string
    {
        $today = Baku::today();
        if ($date->isSameDay($today)) {
            return 'bu gün';
        }
        if ($date->isSameDay($today->addDay())) {
            return 'sabah';
        }
        $months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

        return $date->day.' '.$months[$date->month - 1];
    }

    /** The caller id from the phone line, if it is a real number. */
    private function phone(?string $raw): ?string
    {
        $digits = preg_replace('/\D+/', '', (string) $raw);

        return strlen($digits) >= 7 && strlen($digits) <= 15 ? '+'.ltrim($digits, '+') : null;
    }
}
