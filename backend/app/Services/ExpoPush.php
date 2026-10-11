<?php

namespace App\Services;

use App\Models\PushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Sends through Expo's push service and drops tokens Expo says are dead. */
class ExpoPush
{
    public const CHUNK = 100;

    /**
     * @param  list<string>  $tokens
     * @param  array<string, mixed>  $data
     */
    public function send(array $tokens, string $title, string $body, array $data = []): void
    {
        $tokens = array_values(array_unique(array_filter($tokens)));
        foreach (array_chunk($tokens, self::CHUNK) as $chunk) {
            $messages = array_map(fn ($to) => [
                'to' => $to,
                'title' => $title,
                'body' => $body,
                'data' => (object) $data,
                'sound' => 'default',
                // Android notification channel the app registers.
                'channelId' => 'bookings',
            ], $chunk);

            $req = Http::acceptJson()->asJson()->timeout(10);
            if ($token = config('services.expo.access_token')) {
                $req = $req->withToken($token);
            }
            $res = $req->post(config('services.expo.push_url'), $messages);
            if (! $res->successful()) {
                Log::warning('Expo push failed', ['status' => $res->status()]);

                continue;
            }

            $dead = [];
            foreach ((array) $res->json('data', []) as $i => $ticket) {
                if (($ticket['status'] ?? null) === 'error'
                    && ($ticket['details']['error'] ?? null) === 'DeviceNotRegistered'
                    && isset($chunk[$i])) {
                    $dead[] = $chunk[$i];
                }
            }
            if ($dead) {
                PushToken::query()->whereIn('token', $dead)->delete();
            }
        }
    }
}
