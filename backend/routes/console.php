<?php

use Illuminate\Support\Facades\Schedule;

// Push reminders 24 h and 2 h before each visit (each sent once).
Schedule::command('usta:send-reminders')->everyFiveMinutes()->withoutOverlapping()->onOneServer();

// trialing / active → past_due when the period ends, → expired after the 7-day grace.
Schedule::command('usta:expire-subscriptions')->everyFiveMinutes()->withoutOverlapping()->onOneServer();

// "Trial ends in 3 days" and "ends today": email + push to the owner.
Schedule::command('usta:trial-reminders')->hourly()->withoutOverlapping()->onOneServer();

// Deposit bookings unpaid after 15 minutes give their time back (and tell the waitlist).
Schedule::command('usta:expire-holds')->everyMinute()->withoutOverlapping()->onOneServer();
