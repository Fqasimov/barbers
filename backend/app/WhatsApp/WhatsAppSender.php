<?php

namespace App\WhatsApp;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Sends a WhatsApp template message. Driver "log" (default) only writes the
 * message to the log; "meta" uses the WhatsApp Cloud API with approved
 * templates (WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID).
 */
class WhatsAppSender
{
    /** @param list<string> $params the template's body variables, in order */
    public function send(string $phone, string $template, array $params): bool
    {
        $c = config('usta.whatsapp');
        $to = preg_replace('/\D+/', '', $phone);
        if (($c['driver'] ?? 'log') !== 'meta') {
            Log::info('WhatsApp (log driver)', ['to' => $to, 'template' => $template, 'params' => $params]);

            return true;
        }
        $res = Http::timeout(10)->withToken((string) $c['token'])
            ->post("https://graph.facebook.com/v21.0/{$c['phone_number_id']}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $template,
                    'language' => ['code' => $c['template_lang']],
                    'components' => [['type' => 'body', 'parameters' => array_map(fn ($p) => ['type' => 'text', 'text' => (string) $p], $params)]],
                ],
            ]);
        if (! $res->successful()) {
            Log::warning('WhatsApp send failed', ['status' => $res->status(), 'body' => mb_substr($res->body(), 0, 500)]);
        }

        return $res->successful();
    }
}
