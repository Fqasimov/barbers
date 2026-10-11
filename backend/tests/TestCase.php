<?php

namespace Tests;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Http;
use Tests\Concerns\BuildsSalons;

abstract class TestCase extends BaseTestCase
{
    use BuildsSalons, RefreshDatabase;

    /** Monday 12 Oct 2026, 10:00 in Baku (06:00 UTC). */
    protected const NOW = '2026-10-12 06:00:00';

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(CarbonImmutable::parse(self::NOW, 'UTC'));
        Http::preventStrayRequests();
    }
}
