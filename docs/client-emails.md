# Client emails: booking confirmation and reminders

Clients who book in a browser get no push notifications, so they now get emails:

| When | To | Subject (start) |
| --- | --- | --- |
| A booking is made (or its deposit is paid) | the client | "bron təsdiqləndi / запись подтверждена / booking confirmed" |
| 24 hours before | the client | "sabah · завтра · tomorrow" |
| 2 hours before | the client | "2 saat sonra · через 2 часа · in 2 hours" |
| The client cancels | the salon owner | "bron ləğv edildi / запись отменена / booking cancelled" |

The salon already got an email for each new booking, and the client already got one when the salon cancels; both are unchanged.

Each client email holds:
- the salon, address, time (Baku), master, services, total and the salon's phone
- the cancellation rule ("free up to 2 hours before"), or "call the salon" in the 2-hour one
- a link to `https://yazilnow.az/app/bookings`

The text is in AZ, RU and EN, like the other emails. Walk-ins the salon adds without a client account get no email.

## Merging into the live code

All changes are small and additive (commit after `7231fb1` on `claude/usta-booking-app`):

| File | What changed |
| --- | --- |
| `backend/app/Services/Notifier.php` | New private `toClient()`. `bookingCreated()` calls it with `confirmed`; `reminder()` calls it with `reminder_24h` / `reminder_2h`; `bookingCancelledByCustomer()` now also emails the owner. |
| `backend/app/Mail/BookingMail.php` | Subjects for the new kinds. |
| `backend/config/usta.php` | `app_web_url` (env `APP_WEB_URL`, default `WEB_URL` + `/app`), used for the link. |
| `backend/tests/Feature/ClientEmailsTest.php` | Tests (130 passing). |

No migration is needed. After merging, run `php artisan config:clear` on the server.

These emails need the two cron jobs (the scheduler and the queue worker, `deploy/cpanel/README-FIRST.txt` step 8) and a working mailbox, as sign-up codes already do. Reminders go out from `usta:send-reminders`, which runs every 5 minutes.
