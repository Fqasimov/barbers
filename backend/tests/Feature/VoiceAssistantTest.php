<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Business;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Voice assistant add-on: the ElevenLabs agent's tools check a time and book after the caller presses 1. */
class VoiceAssistantTest extends TestCase
{
    private Business $salon;

    private array $h = ['X-Voice-Secret' => 'test-secret'];

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        config(['usta.voice.secret' => 'test-secret']);
        // Monday 16 November 2026, 08:00 in Baku.
        $this->travelTo(CarbonImmutable::parse('2026-11-16 08:00', 'Asia/Baku'));
        $this->salon = $this->makeSalon();
        $this->salon->forceFill(['voice_until' => now()->addDays(30), 'voice_minutes' => 100, 'voice_agent_id' => 'agent_a'])->save();
    }

    private function url(string $tool): string
    {
        return "/api/voice/{$this->salon->id}/{$tool}";
    }

    public function test_needs_the_secret_and_the_add_on(): void
    {
        $this->postJson($this->url('info'))->assertForbidden();
        $this->postJson($this->url('info'), [], ['X-Voice-Secret' => 'wrong'])->assertForbidden();
        $this->postJson($this->url('info'), [], $this->h)->assertOk()
            ->assertJsonPath('salon', 'Test Barbers')
            ->assertJsonPath('services.0.name', 'Kəsim')
            ->assertJsonPath('masters.0.name', 'Rauf Məmmədov');

        $this->salon->forceFill(['voice_until' => now()->subDay()])->save();
        $this->postJson($this->url('info'), [], $this->h)->assertNotFound();
    }

    public function test_checks_a_free_time_by_service_name(): void
    {
        $this->postJson($this->url('check'), ['service' => 'kəsim', 'date' => '2026-11-17', 'time' => '11:00'], $this->h)
            ->assertOk()
            ->assertJsonPath('available', true)
            ->assertJsonPath('master', 'Rauf Məmmədov')
            ->assertJsonPath('say', 'Kəsim sabah saat 11:00-da boşdur, usta Rauf Məmmədov. Təsdiq etmək üçün telefonda 1 düyməsini basın.');

        // Unknown service: the agent hears the list.
        $this->postJson($this->url('check'), ['service' => 'manikür', 'date' => '2026-11-17', 'time' => '11:00'], $this->h)
            ->assertOk()->assertJsonPath('service_unclear', true);
    }

    public function test_a_taken_time_offers_the_nearest_free_ones(): void
    {
        $this->postJson($this->url('book'), [
            'service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '11:00', 'client_name' => 'Elvin', 'confirm_digit' => '1',
        ], $this->h)->assertCreated();

        $res = $this->postJson($this->url('check'), ['service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '11:00'], $this->h)
            ->assertOk()->assertJsonPath('available', false);
        $times = array_column($res->json('alternatives'), 'time');
        $this->assertCount(3, $times);
        $this->assertNotContains('11:00', $times);
        $this->assertContains('12:00', $times);
        // Sunday 22nd: the salon is closed, and Monday the 23rd is past the 7-day booking window.
        $this->postJson($this->url('check'), ['service' => 'Kəsim', 'date' => '2026-11-22', 'time' => '11:00'], $this->h)
            ->assertOk()->assertJsonPath('available', false)->assertJsonPath('alternatives', [])
            ->assertJsonPath('say', 'Təəssüf, yaxın günlərdə bu xidmət üçün boş vaxt yoxdur.');
        // Saturday 21st at 09:00 is before the salon opens: the nearest free times that day.
        $this->postJson($this->url('check'), ['service' => 'Kəsim', 'date' => '2026-11-21', 'time' => '09:00'], $this->h)
            ->assertOk()->assertJsonPath('available', false)->assertJsonPath('alternatives.0.date', '2026-11-21');
    }

    public function test_books_only_after_pressing_one(): void
    {
        $ask = ['service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '15:30', 'client_name' => 'Aysel', 'caller_phone' => '+994 50 123 45 67'];
        $this->postJson($this->url('book'), $ask + ['confirm_digit' => '2'], $this->h)->assertOk()->assertJsonPath('booked', false);
        $this->assertSame(0, Booking::query()->count());

        $this->postJson($this->url('book'), $ask + ['confirm_digit' => '1'], $this->h)->assertCreated()->assertJsonPath('booked', true);
        $b = Booking::query()->sole();
        $this->assertSame('voice', $b->source);
        $this->assertSame('Aysel', $b->client_name);
        $this->assertSame('994501234567', $b->client_phone);
        $this->assertSame('2026-11-17 15:30', CarbonImmutable::parse($b->start_at)->setTimezone('Asia/Baku')->format('Y-m-d H:i'));

        // The same time again is taken.
        $this->postJson($this->url('book'), $ask + ['confirm_digit' => '1'], $this->h)->assertOk()->assertJsonPath('booked', false);
    }

    private function callEnded(string $id, int $seconds, string $agent = 'agent_a'): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/voice/calls?secret=test-secret', [
            'type' => 'post_call_transcription',
            'data' => ['agent_id' => $agent, 'conversation_id' => $id, 'metadata' => [
                'call_duration_secs' => $seconds, 'start_time_unix_secs' => now()->getTimestamp(),
            ]],
        ]);
    }

    public function test_counts_each_call_once_against_the_salons_minutes(): void
    {
        $this->postJson('/api/voice/calls', ['data' => ['agent_id' => 'agent_a', 'conversation_id' => 'c0']])->assertForbidden();
        $this->callEnded('c1', 90)->assertOk()->assertJsonPath('usage.used', 2);
        $this->callEnded('c1', 90)->assertOk()->assertJsonPath('usage.used', 2); // sent twice: counted once
        $this->callEnded('c2', 30)->assertOk()->assertJsonPath('usage.used', 2); // 120 s in total
        $this->callEnded('c3', 5, 'agent_unknown')->assertNotFound();

        $this->getJson('/api/business', ['Authorization' => 'Bearer '.$this->tokenFor($this->salon->owner)])
            ->assertOk()->assertJsonPath('voice.pack', 100)->assertJsonPath('voice.used', 2)
            ->assertJsonPath('voice.extra', 0)->assertJsonPath('voice.cap', 150);
    }

    public function test_extra_minutes_are_charged_and_stop_at_one_and_a_half_times_the_pack(): void
    {
        // 130 minutes on a 100-minute pack: 30 extra at 0.35 ₼.
        $this->callEnded('c1', 130 * 60)->assertOk()
            ->assertJsonPath('usage.extra', 30)->assertJsonPath('usage.owed', 10.5)->assertJsonPath('usage.capped', false);
        $this->postJson($this->url('check'), ['service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '11:00'], $this->h)
            ->assertOk()->assertJsonPath('available', true);

        // 150 minutes: the cap. The agent takes a message instead of booking.
        $this->callEnded('c2', 20 * 60)->assertOk()->assertJsonPath('usage.capped', true)->assertJsonPath('usage.owed', 17.5);
        $this->postJson($this->url('info'), [], $this->h)->assertOk()->assertJsonPath('limit_reached', true);
        $this->postJson($this->url('check'), ['service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '11:00'], $this->h)
            ->assertOk()->assertJsonPath('limit_reached', true)->assertJsonPath('available', false);
        $this->postJson($this->url('book'), [
            'service' => 'Kəsim', 'date' => '2026-11-17', 'time' => '11:00', 'client_name' => 'Elvin', 'confirm_digit' => '1',
        ], $this->h)->assertOk()->assertJsonPath('booked', false);
        $this->assertSame(0, Booking::query()->count());

        // A new month starts from zero.
        $this->travelTo(CarbonImmutable::parse('2026-12-01 09:00', 'Asia/Baku'));
        $this->postJson($this->url('info'), [], $this->h)->assertOk()->assertJsonPath('limit_reached', false);
    }

    public function test_setup_command_and_monthly_report(): void
    {
        $other = $this->makeSalon(['name' => 'Second Barbers']);
        $this->artisan('usta:voice', ['id' => $other->id, '--agent' => 'agent_b'])->assertFailed(); // no pack
        $this->artisan('usta:voice', ['id' => $other->id, '--minutes' => 120, '--agent' => 'agent_b'])->assertFailed();
        $this->artisan('usta:voice', ['id' => $other->id, '--minutes' => 250, '--agent' => 'agent_a'])->assertFailed(); // taken
        $this->artisan('usta:voice', ['id' => $other->id, '--minutes' => 250, '--agent' => 'agent_b'])->assertSuccessful();
        $this->assertSame(250, $other->fresh()->voice_minutes);

        $this->callEnded('c1', 130 * 60);
        $this->artisan('usta:voice-report')
            ->expectsOutputToContain('Voice assistant, 2026-11')
            ->assertSuccessful();
        $this->assertSame(10.5, $this->salon->fresh()->voiceUsage()['owed']);
        $this->assertSame(0, $other->fresh()->voiceUsage()['used']);
    }
}
