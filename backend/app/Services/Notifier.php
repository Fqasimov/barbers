<?php

namespace App\Services;

use App\Jobs\SendPush;
use App\Mail\BookingMail;
use App\Mail\TrialEndingMail;
use App\Models\Booking;
use App\Models\Business;
use App\Support\Baku;
use Illuminate\Support\Facades\Mail;

/** Every notification in the contract's table; all of it goes through the queue. */
class Notifier
{
    /** In-app routes a tapped push opens (data.url). */
    public const CUSTOMER_URL = '/bookings';

    public const OWNER_URL = '/business/bookings';

    public function bookingCreated(Booking $b): void
    {
        $owner = $b->business?->owner;
        if (! $owner) {
            return;
        }
        $client = $b->user?->fullName() ?? 'Deleted user';
        $when = $this->when($b);
        $services = $this->services($b);
        dispatch(new SendPush($owner->id, 'Yeni bron · Новая запись', "{$client} · {$services} · {$when}", ['type' => 'booking_created', 'booking_id' => $b->id, 'url' => self::OWNER_URL]));
        Mail::to($owner->email)->queue(new BookingMail($b, 'created', [
            "Müştəri / Клиент / Client: {$client}".($b->user?->phone ? " ({$b->user->phone})" : ''),
            "Xidmətlər / Услуги / Services: {$services}",
            "Vaxt / Время / Time: {$when}",
            'Usta / Мастер / Master: '.($b->master?->name ?? '—'),
            "Məbləğ / Сумма / Total: {$b->total} AZN",
        ]));
    }

    public function bookingCancelledByCustomer(Booking $b): void
    {
        $owner = $b->business?->owner;
        if (! $owner) {
            return;
        }
        $client = $b->user?->fullName() ?? 'Deleted user';
        dispatch(new SendPush($owner->id, 'Bron ləğv edildi · Запись отменена', "{$client} · {$this->when($b)}", ['type' => 'booking_cancelled', 'booking_id' => $b->id, 'url' => self::OWNER_URL]));
    }

    public function bookingCancelledBySalon(Booking $b): void
    {
        $user = $b->user;
        if (! $user) {
            return;
        }
        $salon = $b->business?->name ?? 'Usta';
        dispatch(new SendPush($user->id, 'Bron ləğv edildi · Запись отменена', "{$salon} · {$this->when($b)}", ['type' => 'booking_cancelled', 'booking_id' => $b->id, 'url' => self::CUSTOMER_URL]));
        Mail::to($user->email)->queue(new BookingMail($b, 'cancelled_by_salon', array_filter([
            "AZ: {$salon} bronunuzu ləğv etdi: {$this->when($b)}.",
            "RU: {$salon} отменил вашу запись: {$this->when($b)}.",
            "EN: {$salon} cancelled your booking: {$this->when($b)}.",
            $b->cancel_reason ? "— {$b->cancel_reason}" : null,
        ])));
    }

    public function reminder(Booking $b, string $which): void
    {
        if (! $b->user_id) {
            return;
        }
        $salon = $b->business?->name ?? 'Usta';
        $title = $which === '24h' ? 'Sabah · Завтра · Tomorrow' : '2 saat · 2 часа · 2 hours';
        dispatch(new SendPush($b->user_id, $title, "{$salon} · {$this->when($b)}", ['type' => 'booking_reminder', 'booking_id' => $b->id, 'url' => self::CUSTOMER_URL]));
    }

    public function trialEnding(Business $business, int $daysLeft): void
    {
        $owner = $business->owner;
        $ends = $business->subscription?->trial_ends_at;
        if (! $owner || ! $ends) {
            return;
        }
        Mail::to($owner->email)->queue(new TrialEndingMail($business->name, $daysLeft, Baku::local($ends)->format('d.m.Y')));
    }

    private function when(Booking $b): string
    {
        return Baku::local($b->start_at)->format('d.m.Y H:i');
    }

    private function services(Booking $b): string
    {
        return collect($b->services ?? [])->map(fn ($s) => $s['name']['az'] ?? $s['name']['en'] ?? '')->filter()->implode(', ');
    }
}
