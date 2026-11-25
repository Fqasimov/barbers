<?php

namespace App\Http\Controllers\Business;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** The WhatsApp pack and how to reach support (Pro gets the phone line). */
class AddonController extends Controller
{
    /** Messages really go out (a WhatsApp account is connected), so a pack is worth selling. */
    public static function whatsappLive(): bool
    {
        return config('usta.whatsapp.driver') === 'meta' || ! app()->isProduction();
    }

    public function whatsapp(Request $request): JsonResponse
    {
        $this->ownerOnly($request);
        $account = $this->account($request);
        $account->requireFeature('whatsapp_addon');
        // Never sell messages that would only be written to a log.
        if (! self::whatsappLive()) {
            throw new ApiException(503, 'whatsapp_unavailable', 'WhatsApp messages are not switched on yet.');
        }

        return response()->json(app(PaymentService::class)->whatsappCheckout($account));
    }

    public function support(Request $request): JsonResponse
    {
        $priority = $this->business($request)->hasFeature('priority_support');

        return response()->json([
            'email' => config('usta.support.email'),
            'hours' => config('usta.support.hours'),
            'priority' => $priority,
            'phone' => $priority ? (config('usta.support.phone') ?: null) : null,
            'whatsapp_pack' => ['price' => (int) config('usta.whatsapp.price'), 'messages' => (int) config('usta.whatsapp.messages'), 'days' => (int) config('usta.whatsapp.days')],
        ]);
    }
}
