<?php

use Illuminate\Support\Facades\Schedule;

// Push reminders 24 h and 2 h before each visit (each sent once).
Schedule::command('usta:send-reminders')->everyFiveMinutes()->withoutOverlapping()->onOneServer();

// trialing → expired, active → past_due → expired.
Schedule::command('usta:expire-subscriptions')->everyFiveMinutes()->withoutOverlapping()->onOneServer();

// "Trial ends in 3 days" and "ends today" emails.
Schedule::command('usta:trial-reminders')->hourly()->withoutOverlapping()->onOneServer();
