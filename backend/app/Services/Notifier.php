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

    public const DASHBOARD_URL = '/business';

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

    /**
     * Email with what to do, plus a push that opens the dashboard. The push
     * names no price or payment link: it also reaches iOS, where the app
     * shows plan status only.
     */
    public function trialEnding(Business $business, int $daysLeft): void
    {
        $owner = $business->owner;
        $sub = $business->subscription;
        if (! $owner || ! $sub?->trial_ends_at) {
            return;
        }
        Mail::to($owner->email)->queue(new TrialEndingMail(
            $business->name,
            $daysLeft,
            Baku::local($sub->trial_ends_at)->format('d.m.Y'),
            Baku::local($sub->graceEndsAt())->format('d.m.Y'),
        ));

        [$title, $body] = $daysLeft > 0
            ? ["Sınaq {$daysLeft} gün sonra bitir · Пробный период: {$daysLeft} дн. · Trial ends in {$daysLeft} days",
                'AZ: Ödəniş üsulunu əlavə edin, ətraflı e-poçtda. RU: Добавьте способ оплаты, подробности в письме. EN: Add a payment method, details in your email.']
            : ['Sınaq bu gün bitir · Пробный период заканчивается · Trial ends today',
                'AZ: Salon daha 7 gün görünəcək. RU: Салон виден ещё 7 дней. EN: Your salon stays visible for 7 more days.'];
        dispatch(new SendPush($owner->id, $title, $body, ['type' => 'trial_ending', 'days_left' => $daysLeft, 'url' => self::DASHBOARD_URL]));
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
