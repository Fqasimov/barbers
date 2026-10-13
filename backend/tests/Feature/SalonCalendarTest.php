<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Business;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Bookings the salon adds itself (phone calls, walk-ins) and time off. */
class SalonCalendarTest extends TestCase
{
    private Business $salon;

    private array $h;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        $this->salon = $this->makeSalon();
        $this->h = ['Authorization' => 'Bearer '.$this->tokenFor($this->salon->owner)];
    }

    private function manual(array $over = [])
    {
        return $this->postJson('/api/business/bookings', $over + [
            'master_id' => $this->salon->masters()->first()->id,
            'service_ids' => [$this->salon->services()->first()->id],
            'start' => '2026-10-13T08:15:00.000Z', // off the 30-minute grid: fine for the salon
            'client_name' => 'Elçin',
            'client_phone' => '+994 50 111 22 33',
        ], $this->h);
    }

    public function test_salon_adds_a_phone_booking_that_blocks_the_app(): void
    {
        $this->manual()->assertStatus(201)
            ->assertJsonPath('kind', 'visit')->assertJsonPath('source', 'salon')
            ->assertJsonPath('client.name', 'Elçin')->assertJsonPath('client.phone', '994501112233')
            ->assertJsonPath('total', 30)->assertJsonPath('duration_min', 60);
        Mail::assertNothingQueued();

        $busy = $this->getJson('/api/busy?salon_ids[]='.$this->salon->id)->assertOk()->json();
        $this->assertSame('2026-10-13T08:15:00.000Z', $busy[0]['start']);

        // A customer can't take 12:00 Baku (08:00 UTC) any more: it overlaps 12:15–13:15.
        $customer = User::factory()->create();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/bookings', [
            'salon_id' => $this->salon->id,
            'master_id' => $this->salon->masters()->first()->id,
            'service_ids' => [$this->salon->services()->first()->id],
            'start' => '2026-10-13T08:00:00.000Z',
        ], ['Authorization' => 'Bearer '.$this->tokenFor($customer)])
            ->assertStatus(409)->assertJsonPath('error', 'slot_taken');

        // Nor can the salon double-book it.
        $this->app['auth']->forgetGuards();
        $this->manual(['start' => '2026-10-13T08:30:00.000Z'])->assertStatus(409)->assertJsonPath('error', 'slot_taken');
    }

    public function test_salon_booking_rules(): void
    {
        $this->manual(['start' => '2026-10-13T08:07:00.000Z'])->assertStatus(422);
        $this->manual(['start' => '2026-10-12T05:00:00.000Z'])->assertStatus(422); // an hour ago
        $this->manual(['start' => '2027-03-01T08:00:00.000Z'])->assertStatus(422); // too far
        $this->manual(['client_name' => ''])->assertStatus(422);
        $this->manual(['master_id' => 'nobody'])->assertStatus(422);
        // A walk-in who sat down 10 minutes ago, two weeks out of the app's window are both fine.
        $this->manual(['start' => '2026-10-12T05:50:00.000Z'])->assertStatus(201);
        $this->manual(['start' => '2026-10-26T08:00:00.000Z', 'client_phone' => null])->assertStatus(201)
            ->assertJsonPath('client.phone', '');
    }

    public function test_time_off_for_one_master_and_the_whole_salon(): void
    {
        $other = $this->makeMaster($this->salon, [$this->salon->services()->first()->id], ['name' => 'Elvin']);

        // Lunch break for the first master.
        $this->postJson('/api/business/blocks', [
            'master_id' => $this->salon->masters()->first()->id,
            'start' => '2026-10-13T09:00:00.000Z',
            'end' => '2026-10-13T10:00:00.000Z',
            'note' => 'Nahar',
        ], $this->h)->assertStatus(201)->assertJsonCount(1)
            ->assertJsonPath('0.kind', 'block')->assertJsonPath('0.duration_min', 60)->assertJsonPath('0.note', 'Nahar');

        // Holiday for everyone, three days, beginning tomorrow.
        $this->postJson('/api/business/blocks', [
            'start' => '2026-10-14T00:00:00.000Z',
            'end' => '2026-10-17T00:00:00.000Z',
        ], $this->h)->assertStatus(201)->assertJsonCount(2);

        $day = $this->getJson('/api/salons/'.$this->salon->id.'/availability?service_ids[]='.$this->salon->services()->first()->id.'&from=2026-10-15&days=1&master_id='.$other->id)
            ->assertOk()->json('masters.0.days.0');
        $this->assertSame([], $day['slots']);

        // Busy from a later window still sees the holiday that began before it.
        $busy = collect($this->getJson('/api/busy?from=2026-10-15&days=1')->json());
        $this->assertCount(2, $busy);

        // The list for the 15th shows the holiday that started on the 14th.
        $list = $this->getJson('/api/business/bookings?from=2026-10-15&to=2026-10-15', $this->h)->assertOk()->json();
        $this->assertCount(2, $list);
        $this->assertSame('block', $list[0]['kind']);

        // Time off can be removed, but not marked done.
        $id = $list[0]['id'];
        $this->postJson("/api/business/bookings/{$id}/complete", [], $this->h)->assertStatus(422);
        $this->postJson("/api/business/bookings/{$id}/cancel", [], $this->h)->assertOk()->assertJsonPath('status', 'cancelled');
    }

    public function test_time_off_never_covers_a_booking(): void
    {
        $master = $this->salon->masters()->first();
        $this->makeBooking($this->salon, $master, User::factory()->create(), '2026-10-13T08:00:00Z');

        $this->postJson('/api/business/blocks', [
            'start' => '2026-10-13T00:00:00.000Z',
            'end' => '2026-10-14T00:00:00.000Z',
        ], $this->h)->assertStatus(409)->assertJsonPath('error', 'overlaps_bookings');
        $this->assertSame(1, Booking::query()->count());

        $this->postJson('/api/business/blocks', ['start' => '2026-10-13T10:00:00.000Z', 'end' => '2026-10-13T09:00:00.000Z'], $this->h)->assertStatus(422);
        $this->postJson('/api/business/blocks', ['start' => '2026-10-13T10:00:00.000Z', 'end' => '2026-12-13T09:00:00.000Z'], $this->h)->assertStatus(422);
    }

    public function test_the_customer_never_sees_salon_entries(): void
    {
        $customer = User::factory()->create();
        $this->manual()->assertStatus(201);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/bookings', ['Authorization' => 'Bearer '.$this->tokenFor($customer)])->assertOk()->assertJsonCount(0);
    }
}
