# Usta API

Laravel 13 backend for the Usta app (bookings for barbershops and beauty salons in Baku). The contract is [`../docs/api.md`](../docs/api.md). This server implements every endpoint in it.

- PHP 8.3+, Laravel 13, Sanctum bearer tokens, `firebase/php-jwt` for Google/Apple id_tokens.
- SQLite for development and tests. MySQL 8 or PostgreSQL in production (the test suite also passes on PostgreSQL 16).
- Timestamps are stored and returned in UTC. Clock times, dates and weekdays are in Asia/Baku (`config/usta.php`).

## Setup

```bash
cd backend
composer install            # in this sandbox: COMPOSER_PROCESS_TIMEOUT=900 composer install --prefer-source
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed  # with APP_ENV=local this seeds the app's 15 demo salons and 86 reviews
php artisan storage:link    # serves salon photos from storage/app/public
php artisan usta:create-user   # e.g. the demo account faiq.farid0604@gmail.com; asks for the password
```

## Running locally

```bash
php artisan serve --host=0.0.0.0 --port=8000   # API at http://<your-LAN-IP>:8000/api (point the app at http://<your-LAN-IP>:8000)
php artisan queue:work                          # mail and push (QUEUE_CONNECTION=database)
php artisan schedule:work                       # reminders, trial emails, subscription expiry
```

Point the app at it with `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:8000`. With `APP_ENV=local`:

- every OTP challenge also returns `demo_code`, so the app's demo banner shows the code;
- mail goes to `storage/logs/laravel.log` (`MAIL_MAILER=log`);
- payments use the fake gateway. `checkout_url` is a signed page on this server that pays at once and redirects to `usta://billing/return?payment_id=…`.

Tests: `php artisan test` (SQLite in memory). Formatting: `./vendor/bin/pint`.

## Commands

| Command | What it does |
| --- | --- |
| `usta:approve-business {id}` | Review passed: `pending_review` → `live`. Warns if the salon still can't be listed (no service, master or plan). |
| `usta:suspend-business {id}` | `suspended`: hidden from search. Existing bookings stay. |
| `usta:create-user [--email= --first-name= --last-name= --role=customer]` | Creates a verified password account, or resets the password of an existing one. The password is read from a hidden prompt. |
| `usta:send-reminders` | Every 5 min. Push reminders 24 h and 2 h before a visit, each once. |
| `usta:expire-subscriptions` | Every 5 min. `trialing` / `active` → `past_due` when the period ends, → `expired` 7 days later. |
| `usta:trial-reminders` | Hourly. Email + push "trial ends in 3 days" and "trial ends today". |

The schedule is in `routes/console.php`.

### Subscription states

| State | Meaning | Listed in `/salons` |
| --- | --- | --- |
| `trialing` | Free 30-day trial (once per business), until `trial_ends_at`. | yes, then 7 more days as `past_due` |
| `active` | Paid until `current_period_end`. | yes, then 7 more days as `past_due` |
| `past_due` | The trial or the paid period ended unpaid. 7-day grace to pay (`usta.grace_days`). | yes, for the 7 days |
| `expired` | The grace ran out. No new bookings; existing bookings stay valid. | no |

A paid callback always sets `active` and `current_period_end = max(now, what the salon already has) + 1 month` (12 for a yearly payment, which costs 10 months). "What it already has" is the paid period or the rest of the trial, so paying early loses nothing. Listing checks the dates in real time, so a lapsed salon disappears even before the scheduler updates its stored status.

## Deploying (production checklist)

1. `.env`:
   - `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.<domain>`, `php artisan key:generate`.
   - `DB_*` for MySQL 8 or PostgreSQL. DB sessions are pinned to UTC in `config/database.php`.
   - `QUEUE_CONNECTION=database` or `redis`, `CACHE_STORE=redis` or `database`.
   - `MAIL_*`, sending from the domain's own address.
   - `GOOGLE_CLIENT_IDS`, `APPLE_CLIENT_IDS`, `CORS_ALLOWED_ORIGINS`, `TRUSTED_PROXIES`, `PHOTO_DISK`.
   - `PAYMENT_DRIVER=provider` with `PAYMENT_*`. The fake driver refuses to boot in production.
2. `composer install --no-dev --optimize-autoloader`, then `php artisan migrate --force`, `php artisan storage:link`, and `php artisan config:cache route:cache event:cache`.
3. Don't seed in production. `DatabaseSeeder` only seeds when `APP_ENV=local`. Create real accounts with `usta:create-user`.
4. Queue worker under supervisor or systemd:
   ```ini
   [program:usta-queue]
   command=php /var/www/usta/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
   autostart=true
   autorestart=true
   user=www-data
   numprocs=2
   stopwaitsecs=60
   ```
   Run `php artisan queue:restart` after each deploy.
5. Cron for the scheduler: `* * * * * cd /var/www/usta/backend && php artisan schedule:run >> /dev/null 2>&1`.
6. HTTPS only (TLS at nginx or the load balancer). The document root is `backend/public`.
7. Mail DNS: SPF, DKIM and DMARC (`p=quarantine` or stricter) for the sending domain. Codes are emailed, so deliverability matters.
8. Photos: `PHOTO_DISK=public` (local disk plus `storage:link`) or `s3` with `AWS_URL` pointing to a CDN. URLs are always absolute. Back up the disk or bucket and the database.
9. Logs: ship `storage/logs` and watch failed jobs (`php artisan queue:failed`).

## Payment provider integration

The provider (an Azerbaijani card acquirer) isn't chosen yet, so `app/Payments/ProviderGateway.php` is a documented stub. To integrate one:

1. Implement `createCheckout()`: create the order through the provider's API and return `CheckoutResult(url, providerRef)`. Use `/billing/return?payment_id=…` as the return URL.
2. Implement `verifyCallback()`: verify the provider's signature, or re-query the order status server to server. Return `CallbackResult(paymentId, status, amount, currency)`. Throw `InvalidCallback` if verification fails.
3. Set `PAYMENT_DRIVER=provider`, `PAYMENT_PROVIDER_NAME=<name>` and the `PAYMENT_*` keys. Register the callback URL `https://<domain>/api/payments/<name>/callback` with the provider.
4. Add a feature test with `Http::fake()` and a signed sample callback.

`PaymentService` already handles the rest:

- the `payments` row (`pending` → `paid` or `failed`, with the raw callback stored)
- idempotency
- amount and currency checks (`422 amount_mismatch`)
- subscription extension

## Decisions and deviations from the contract

- **Ids.** Seeded salons, masters, services and reviews keep the app's ids (`old-town-barbers.m1`). New rows get lowercase ULIDs. Payments use UUIDs. The business and its public salon are one row, so `Business.id == Business.salon_id`.
- **Ratings.** The rating, `review_count` and `distribution` come from an imported base aggregate (`base_rating`, `base_review_count`, `base_distribution`; seeded venues only) plus the real reviews. Each review updates denormalised totals. The seeder subtracts the 86 sample reviews from the base, so seeded salons show exactly the app's numbers. A salon or master without reviews shows `rating: 0`.
- **Derived values.** If an owner hasn't set them:
  - `price_level` comes from the average service price (under 25 AZN → 1, under 60 → 2, else 3);
  - `tone` is picked deterministically from the id;
  - `kind` comes from the categories;
  - `tagline` is "kind · district";
  - `coords` fall back to Baku centre in the public Salon. The Business keeps `null`.
- **New businesses** default to 09:00–20:00 with no closed days, and their WhatsApp number defaults to the owner's phone. `women_only` is `audience == "women"`.
- **Service `key`.** It's matched from keywords in any of the three languages against the app's catalogue keys (fade, cut, beard, mani…). Otherwise it's a slug of the name.
- **Availability.**
  - It follows `src/data/availability.ts`, except that the app's synthetic "existing appointments" are replaced by real `upcoming` bookings.
  - Days outside the 7-day window, or in the past, are returned with `slots: []`. Requests may ask for up to 14 days.
  - An explicit `master_id` that doesn't do every service is a 422. So is a service that isn't offered.
- **`/slots`.** Starts are matched with `from_min ≤ start ≤ to_min`. There's one result per salon: the earliest start, with the best-rated master on ties. Results are sorted by start.
- **`/busy`.** "Live salons" means the listable set, the same as `/salons`. The answer is cached for 30 s, and changes may take up to 30 s to show.
- **Booking `start`** must be one of the computed slots (on the 30-minute grid, inside the window, lead time and 7 days). Otherwise it's a 422 on `start`. An overlap is a `409 slot_taken`. Booking a salon that isn't listed is a 404.
- **"Past"** means the booking's end time has passed:
  - the customer list shows such `upcoming` bookings as `completed`;
  - a review is allowed only after the end time.
  The salon's view (`/business/bookings`) shows the stored status, so the owner can still mark a no-show or a completed visit. A review also marks the booking `completed`.
- **Cancelling.**
  - Cancelling an already-cancelled booking returns it unchanged (200).
  - The customer can't cancel a completed or no-show booking (`too_late_to_cancel`).
  - Salon complete/no-show on the wrong status is a standard 422 (`errors.status`).
- **Error statuses the contract leaves open:**
  - `otp_invalid`, `otp_expired`, `too_many_attempts`: 422.
  - An expired or used reset token: `422 otp_expired`, as in `src/auth/local.ts`.
  - Rate limiting: `429 too_many_attempts`.
  - `GET /business/subscription` without a plan: `402 subscription_required`.
  - Non-owners on `/business/*`: `403 forbidden`. Another business's master, service, photo or booking is a 403; an unknown id is a 404.
  - Payment callbacks: `400 invalid_callback`, `422 amount_mismatch`.
  - A wrong password on `DELETE /me`: `422` with `error: invalid_credentials` and `errors.password`.
- **`email_taken`** also carries `errors.email`, so the app can show it on the field.
- **OTP rules** follow `local.ts`:
  - register, business register, the login `not_verified` path and forgot always issue a fresh code;
  - only `/auth/otp/resend` enforces the 60 s cooldown (`429 resend_too_soon`, plus `resend_at`).
  Codes are HMAC-SHA256 (keyed by `APP_KEY`), compared in constant time.
- **No account probing.** For unknown emails, forgot and resend return a decoy challenge and send nothing. Login on an unknown email still runs a bcrypt check.
- **Passwords** are 8–64 characters with a letter and a digit, as the contract says. The app's demo backend accepts 6.
- **Social sign-in.**
  - Accounts are found by provider `sub` first, then by the token's verified email.
  - The Apple body `email` is never trusted. Only the body's name is stored, on the first sign-in.
  - An unverified password sign-up with the same email is taken over, and its password is cleared, because whoever set it never proved they own the inbox.
  - A token that fails any check gets `401 invalid_credentials`.
  - JWKS are cached for 6 h and refetched once when the token has an unknown `kid`.
- **Account deletion of an owner.**
  - The business is unpublished and soft-deleted, and its subscription expires.
  - Customers' past bookings keep pointing at the salon id.
  - Future bookings are cancelled with `cancelled_by: salon`.
- **Photos.**
  - Re-encoding uses GD, the extension available here: EXIF orientation is applied, the image is scaled to 1600 px on the long side and written as a fresh JPEG at quality 82, so no metadata is kept.
  - GD can't decode HEIC, so a HEIC upload is a 422 asking for JPEG or PNG, unless the `imagick` extension (with libheif) is installed. Then `ImagickPhotoProcessor` is used automatically. It isn't tested here.
  - The upload must still be JPEG, PNG or HEIC and at most 8 MB, with at most 12 photos.
- **Notifications** go through the queue: an Expo push job, and queued Mailables written in AZ, RU and EN together. Only push tickets are checked for `DeviceNotRegistered`; receipts are not polled.
  - Reminders: a reminder isn't sent if the booking was made after its moment.
  - Trial emails go out at most once each.
- **Rate limits:**
  - auth endpoints: 30/min per IP and 10/min per email;
  - `POST /bookings`: 10/min and 60/day per user;
  - public endpoints: 240/min per IP.

## Not done / follow-ups

- **Admin panel.** Approval is through the artisan commands above. Filament would be the natural next step.
- **Real payment provider.** `ProviderGateway` is a stub; see the TODOs in it.
- **Master photo upload.** The contract has `photo_url` but no endpoint for it, so it's always `null` for now.
- **Expo push receipts.** Polling them would catch late `DeviceNotRegistered` errors.
- **Localised emails.** Users have no locale, so emails are trilingual.
