<?php

namespace Tests\Concerns;

use App\Models\Booking;
use App\Models\Business;
use App\Models\Master;
use App\Models\Service;
use App\Models\Subscription;
use App\Models\User;
use Carbon\CarbonImmutable;

trait BuildsSalons
{
    /** A live, listable salon: 10:00–20:00, closed Sundays, one 60-min service, one master Mon–Sat 09:00–18:00. */
    protected function makeSalon(array $attrs = [], ?User $owner = null, string $subscription = Subscription::TRIALING): Business
    {
        $owner ??= User::factory()->business()->create();
        $business = new Business;
        $business->forceFill($attrs + [
            'owner_id' => $owner->id,
            'name' => 'Test Barbers',
            'categories' => ['barber'],
            'district' => 'Nəsimi',
            'address' => 'Test küç. 1',
            'audience' => 'all',
            'hours_open' => '10:00',
            'hours_close' => '20:00',
            'closed_days' => [0],
            'phone' => '+994125550000',
            'whatsapp' => '994505550000',
            'status' => Business::LIVE,
        ])->save();

        if ($subscription) {
            (new Subscription)->forceFill([
                'business_id' => $business->id,
                'plan' => 'start',
                'status' => $subscription,
                'started_at' => now()->subDay(),
                'trial_ends_at' => now()->addDays(29),
                'current_period_end' => $subscription === Subscription::ACTIVE ? now()->addMonth() : null,
            ])->save();
        }

        $service = $this->makeService($business);
        $this->makeMaster($business, [$service->id]);

        return $business->fresh();
    }

    protected function makeService(Business $business, array $attrs = []): Service
    {
        $s = new Service;
        $s->forceFill($attrs + [
            'business_id' => $business->id,
            'key' => 'cut',
            'name' => ['az' => 'Kəsim', 'ru' => 'Стрижка', 'en' => 'Cut'],
            'category' => 'barber',
            'duration_min' => 60,
            'price' => 30,
        ])->save();

        return $s;
    }

    protected function makeMaster(Business $business, array $serviceIds, array $attrs = []): Master
    {
        $m = new Master;
        $m->forceFill($attrs + [
            'business_id' => $business->id,
            'name' => 'Rauf Məmmədov',
            'role' => ['az' => 'Bərbər', 'ru' => 'Барбер', 'en' => 'Barber'],
            'years' => 5,
            'work_days' => [1, 2, 3, 4, 5, 6],
            'shift_start' => '09:00',
            'shift_end' => '18:00',
            'languages' => ['az'],
        ])->save();
        $m->services()->sync($serviceIds);

        return $m;
    }

    protected function makeBooking(Business $business, Master $master, User $user, CarbonImmutable|string $start, array $attrs = []): Booking
    {
        $start = CarbonImmutable::parse($start)->utc();
        $service = $business->services()->first();
        $duration = $attrs['duration_min'] ?? $service->duration_min;
        $b = new Booking;
        $b->forceFill($attrs + [
            'business_id' => $business->id,
            'user_id' => $user->id,
            'master_id' => $master->id,
            'services' => [['id' => $service->id, 'name' => $service->name, 'duration_min' => $service->duration_min, 'price' => $service->price]],
            'start_at' => $start,
            'end_at' => $start->addMinutes($duration),
            'duration_min' => $duration,
            'total' => $service->price,
            'status' => Booking::UPCOMING,
        ])->save();

        return $b;
    }

    protected function tokenFor(User $user): string
    {
        return $user->createToken('test')->plainTextToken;
    }
}
