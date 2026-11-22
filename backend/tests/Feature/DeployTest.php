<?php

namespace Tests\Feature;

use Tests\TestCase;

class DeployTest extends TestCase
{
    public function test_off_without_a_key(): void
    {
        config(['app.deploy_key' => '']);
        $this->postJson('/api/deploy/migrate')->assertNotFound();
    }

    public function test_wrong_key_is_refused(): void
    {
        config(['app.deploy_key' => str_repeat('a', 40)]);
        $this->postJson('/api/deploy/migrate', [], ['X-Deploy-Key' => str_repeat('b', 40)])->assertNotFound();
    }

    public function test_right_key_migrates(): void
    {
        config(['app.deploy_key' => str_repeat('a', 40)]);
        $this->postJson('/api/deploy/migrate', [], ['X-Deploy-Key' => str_repeat('a', 40)])
            ->assertOk()->assertJson(['ok' => true]);
    }
}
