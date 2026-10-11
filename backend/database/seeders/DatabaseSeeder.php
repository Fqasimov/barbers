<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Demo data is for development only. Production starts empty; create the
     * demo account with `php artisan usta:create-user`.
     */
    public function run(): void
    {
        if (app()->environment('local')) {
            $this->call(DemoCatalogueSeeder::class);
        }
    }
}
