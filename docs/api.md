# Usta API

The app talks to a Laravel API (`backend/`) with Sanctum bearer tokens. Until `EXPO_PUBLIC_API_URL` is set, the app runs on an on-device demo backend and bundled sample venues instead. This page is the contract between the two. The app's types are in `src/auth/types.ts`, `src/api/types.ts` and `src/data/types.ts`.

## Conventions

- **Base path:** `/api`. JSON in and out, `snake_case` keys on the wire. The app converts them to camelCase, so **never use ids or other data as object keys**: return arrays of objects instead.
- **Authenticated calls** send `Authorization: Bearer <token>`.
- **Errors** look like `{ "error": "<code>", "message": "…" }`. Validation failures are Laravel's standard `422 { "message", "errors": { field: [msg] } }`.
- **Error codes the app understands:**
  - accounts: `invalid_credentials`, `email_taken`, `not_verified`, `otp_invalid`, `otp_expired`, `too_many_attempts`, `resend_too_soon`, `not_found`, `session_expired`
  - bookings: `slot_taken`, `too_late_to_cancel`, `not_reviewable`
  - salons: `forbidden` (not the owner), `subscription_required`
- **Multilingual text** (`Loc`) is an object `{ "az": "…", "ru": "…", "en": "…" }`. Salon owners usually type one language. The server stores what they type and fills the missing languages with it, so every `Loc` it returns has all three keys.
- **Times:**
  - Timestamps are ISO-8601 in UTC.
  - Clock times are `"HH:MM"` strings in **Asia/Baku**.
  - Calendar dates are `YYYY-MM-DD`, in Baku.
  - Weekdays are numbers, 0 = Sunday … 6 = Saturday.
- **Money** is AZN in whole manat (integer).

## Objects

```jsonc
// User
{ "id": "…", "first_name": "…", "last_name": "…", "email": "…",
  "phone": "+994501234567", "birth_date": "1995-04-06", "gender": "male|female|null",
  "role": "customer|business", "provider": "password|google|apple",
  "email_verified": true, "created_at": "ISO" }

// Session (returned by every sign-in)
{ "token": "<sanctum token>", "user": User, "business": Business | null }

// OTP challenge (returned when a code is emailed)
{ "email": "…", "purpose": "register|reset", "expires_at": "ISO", "resend_at": "ISO" }

// Service
{ "id": "…", "key": "fade", "name": Loc, "description": Loc | null,
  "category": "barber|hair|nails|brows|spa|makeup", "duration_min": 45, "price": 30 }

// Master
{ "id": "…", "name": "Rauf Məmmədov", "role": Loc, "years": 8,
  "rating": 4.9, "review_count": 112,
  "service_ids": ["…"], "work_days": [1,2,3,4,5,6],
  "shift": { "start": "10:00", "end": "20:00" },
  "tone": "oxblood", "languages": ["az","ru","en","tr"], "photo_url": "https://…" | null }

// Salon: the public venue, exactly what the app renders
{ "id": "…", "name": "…", "kind": Loc, "categories": ["barber"], "tagline": Loc, "about": Loc,
  "address": "…", "district": "…", "coords": { "latitude": 40.37, "longitude": 49.83 },
  "price_level": 1|2|3, "tone": "navy",
  "rating": 4.8, "review_count": 340, "distribution": [0.82, 0.12, 0.04, 0.01, 0.01],
  "hours": { "open": "09:00", "close": "21:00" }, "closed_days": [0],
  "phone": "+994…", "whatsapp": "994…", "women_only": false, "audience": "all|women|men",
  "amenities": [Loc], "photos": ["https://…"],
  "services": [Service], "masters": [Master] }

// Review
{ "id": "…", "salon_id": "…", "master_id": "…" | null, "author": "Aysel M.",
  "rating": 5, "text": "…", "date": "ISO", "service_name": Loc | null,
  "tags": ["skilled","punctual","friendly","clean","value","relaxing"], "booking_id": "…" | null }

// Booking (the customer's view)
{ "id": "…", "salon_id": "…", "master_id": "…", "service_ids": ["…"],
  "start": "ISO", "duration_min": 75, "total": 45, "note": "…" | null,
  "status": "upcoming|completed|cancelled|no_show", "cancelled_by": "customer|salon" | null,
  "reviewed": false, "created_at": "ISO" }

// BusinessBooking (the salon's view): Booking plus the client
{ ...Booking, "client": { "name": "Aysel Məmmədova", "phone": "+994…" } }

// Subscription
{ "plan": "start|pro|studio", "status": "trialing|active|past_due|expired",
  "started_at": "ISO", "trial_ends_at": "ISO", "current_period_end": "ISO" | null }

// Business: the owner's private view of their salon
{ "id": "…", "owner_id": "…", "salon_id": "…",
  "salon_name": "…", "categories": [...], "district": "…", "address": "…",
  "coords": { "latitude": …, "longitude": … } | null, "audience": "all|women|men",
  "about": Loc | null, "phone": "+994…", "whatsapp": "994…",
  "hours": { "open": "09:00", "close": "21:00" }, "closed_days": [0],
  "status": "pending_review|live|suspended",
  "subscription": Subscription | null,
  "masters": [Master], "services": [Service], "photos": [Photo],
  "created_at": "ISO" }

// Photo
{ "id": "…", "url": "https://…" }

// Plan (what the server sells)
{ "id": "start|pro|studio", "price": 29 }
```

## Accounts

| Method | Path | Body | Success | Notes |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | `first_name, last_name, phone, birth_date, gender, email, password` | `202` OTP challenge | Creates an **unverified** user and emails a code. `422 email_taken` if a verified account exists. |
| POST | `/business/register` | owner `first_name, last_name, phone, email, password` + `salon_name, categories[], district, address, audience` | `202` OTP challenge | Creates a `business` user and a `pending_review` business. |
| POST | `/auth/email/verify` | `email, code` | `200` Session | Marks the email verified and signs in. |
| POST | `/auth/otp/resend` | `email, purpose` | `202` OTP challenge | `429 resend_too_soon` within the cooldown. |
| POST | `/auth/login` | `email, password` | `200` Session | `401 invalid_credentials` for an unknown email or a wrong password (same response either way). Unverified email: `403 not_verified` with a fresh challenge in `otp`. |
| POST | `/auth/password/forgot` | `email` | `202` OTP challenge | Always `202`, even for unknown emails, so accounts can't be probed. |
| POST | `/auth/password/verify` | `email, code` | `200 { reset_token }` | Single-use, valid for 15 minutes. |
| POST | `/auth/password/reset` | `reset_token, password` | `200` Session | Revokes the user's other tokens. |
| POST | `/auth/social/google` | `id_token` | `200` Session | Verify the token with Google, then find or create the user by verified email. |
| POST | `/auth/social/apple` | `id_token, email?, first_name?, last_name?` | `200` Session | Verify against Apple's JWKS. Apple sends the name and email only on the first sign-in, so store them then. |
| GET | `/me` | — | `200` Session | `401 session_expired` signs the app out. |
| PATCH | `/me` | any of `first_name, last_name, phone, birth_date, gender` | `200` User | Fills in missing details after social sign-in. |
| DELETE | `/me` | `password` (password accounts only) | `204` | **Deletes the account** (App Store rule 5.1.1(v)). See "Account deletion". |
| POST | `/auth/logout` | — | `204` | Revokes the current token. |
| POST | `/me/push-tokens` | `token, platform: ios\|android` | `204` | An Expo push token. Upsert; one row per token. |
| DELETE | `/me/push-tokens` | `token` | `204` | Called on sign-out. |

### Account deletion

- **Who** can delete: any signed-in user. Password accounts confirm with their password; social accounts are already authenticated by their token.
- **Deleted at once:**
  - the user row and its personal data (name, email, phone, birth date)
  - tokens, push tokens and OTPs
- **Upcoming bookings** are cancelled (`cancelled_by: customer`), and each salon is notified.
- **Past bookings and reviews stay**, so salons keep their history. They're anonymised: the client becomes "Deleted user" and review authors become "İstifadəçi".
- **A business owner** also gets the business deleted:
  - the salon is unpublished and its future bookings are cancelled, with customers notified
  - its photos are removed from storage

## Catalogue (public, no token)

| Method | Path | Query | Success | Notes |
| --- | --- | --- | --- | --- |
| GET | `/salons` | — | `200 [Salon]` | Every `live` salon with an active or trialing subscription. The app filters, sorts and ranks on the device. Cache for 60 s. |
| GET | `/salons/{id}` | — | `200` Salon | `404 not_found` if unknown or not live. |
| GET | `/salons/{id}/reviews` | `page` | `200 { data: [Review], next_page: 2 \| null }` | Newest first, 30 per page. |
| GET | `/salons/{id}/availability` | `service_ids[]`, `from` (date), `days` (1–14, default 7), `master_id?` | `200 { masters: [{ master_id, days: [{ date, off, slots: [minutes] }] }] }` | See "Availability". Without `master_id`, every master who does all the services. |
| GET | `/slots` | `service_key`, `date`, `from_min?`, `to_min?` | `200 [{ salon_id, master_id, service_id, start: minutes }]` | City-wide free-slot search: every live salon's earliest start for that service on that date, within the time window. |
| GET | `/busy` | `from` (date, default today), `days` (1–14, default 7), `salon_ids[]?` | `200 [{ master_id, start: ISO, end: ISO }]` | Time each master is already booked (`upcoming` bookings only; no client details). The app computes free slots from this with the same rules as "Availability", so lists, search and compare work offline-first. Without `salon_ids`, every live salon. Cache for 30 s. |
| GET | `/plans` | — | `200 [Plan]` | Prices in AZN per month. The app shows these on Android; see "Payments". |

### Availability

The app and the server compute it the same way (`src/data/availability.ts`):

- A master's working window on a date is their shift intersected with the salon's hours. There's none on the salon's closed days or the master's days off.
- Candidate starts run every **30 minutes** from the window's start. A start is free when `start + duration ≤ window end` and it doesn't overlap any `upcoming` booking of that master.
- **Duration** is the sum of the chosen services' `duration_min`.
- Same-day starts must be at least **30 minutes** from now.
- Bookings open **7 days** ahead (including today).
- `slots` are minutes after midnight, Baku time.

## Bookings (customer, token required)

| Method | Path | Body | Success | Notes |
| --- | --- | --- | --- | --- |
| GET | `/bookings` | — | `200 [Booking]` | The user's bookings, newest first. Past `upcoming` bookings are returned as `completed`. |
| POST | `/bookings` | `salon_id, master_id, service_ids[], start (ISO), note?` | `201` Booking | The server recomputes `duration_min` and `total` from its own prices. Checks the master does every service and the slot is free **inside a transaction with a row lock on the master**: `409 slot_taken` when someone got there first. Notifies the salon. |
| POST | `/bookings/{id}/cancel` | — | `200` Booking | Allowed until 2 hours before the start (`422 too_late_to_cancel`). Notifies the salon. |
| POST | `/bookings/{id}/review` | `rating (1–5), text, tags[], master_id?` | `201` Review | Only for the booking's own customer, once, after the visit has ended (`422 not_reviewable`). Updates the salon's and master's rating. |

## Salon tools (business owner, token required)

Every path acts on the signed-in owner's business; another user's business gives `403 forbidden`.

| Method | Path | Body | Success | Notes |
| --- | --- | --- | --- | --- |
| GET | `/business` | — | `200` Business | |
| PATCH | `/business` | any of `salon_name, about, phone, whatsapp, address, district, coords, categories, audience, hours, closed_days` | `200` Business | |
| POST | `/business/masters` | `name, role, years, service_ids[], work_days[], shift, languages[]` | `201` Master | **No limit and no charge per master.** |
| PATCH | `/business/masters/{id}` | any of the above | `200` Master | |
| DELETE | `/business/masters/{id}` | — | `204` | Refused with `422` while the master has upcoming bookings. |
| POST | `/business/services` | `name, category, duration_min (5–480), price (0–10000), description?` | `201` Service | `key` is derived from the name. |
| PATCH | `/business/services/{id}` | any of the above | `200` Service | |
| DELETE | `/business/services/{id}` | — | `204` | Also removed from every master's `service_ids`. |
| POST | `/business/photos` | multipart `photo` (JPEG, PNG or HEIC, ≤ 8 MB) | `201` Photo | Re-encoded as a 1600 px JPEG; metadata (GPS) stripped. At most 12. |
| DELETE | `/business/photos/{id}` | — | `204` | |
| GET | `/business/bookings` | `from?`, `to?` (dates, default today … +7 days), `status?` | `200 [BusinessBooking]` | Sorted by start. |
| POST | `/business/bookings/{id}/cancel` | `reason?` | `200` BusinessBooking | `cancelled_by: salon`. The customer is notified. |
| POST | `/business/bookings/{id}/complete` | — | `200` BusinessBooking | |
| POST | `/business/bookings/{id}/no-show` | — | `200` BusinessBooking | Only after the start time. |
| POST | `/business/subscription/trial` | `plan` | `200` Business | Starts the 30-day trial once per business. Calling it again only changes the plan. No card. |
| POST | `/business/subscription/checkout` | `plan` | `200 { checkout_url, payment_id }` | See "Payments". |
| GET | `/business/subscription` | — | `200` Subscription | |

### Going live

- New businesses are `pending_review`. A Usta admin approves them in the admin panel, which sets `live`.
- A salon appears in `/salons` only when **all** of these hold:
  - it is `live`
  - it has at least one service and one master
  - its subscription is `trialing` or `active`
- When a trial ends without payment, the status becomes `expired`. The salon disappears from search, but existing bookings stay valid.

## Payments

- The server talks to the payment provider and keeps every secret. **The app never sees card data or provider keys.**
- **Checkout flow:**
  1. The app calls `POST /business/subscription/checkout`.
  2. The server creates an order with the provider and returns its hosted `checkout_url`.
  3. The app opens it in the system browser (an auth session). The provider redirects to `https://<domain>/billing/return?payment_id=…`, which redirects to `usta://billing/return`.
  4. The app then re-reads `GET /business/subscription`.
- **The provider's callback** goes to `POST /payments/{provider}/callback`. The server verifies the provider's signature and the amount and currency, and treats the callback as **idempotent** (the same payment can be reported twice). On success it sets `status: active` and extends `current_period_end` by a month from `max(now, current_period_end)`.
- **Prices** come from `/plans`. The app's `src/auth/plans.ts` is only the fallback.
- **On iOS:** the app shows the current plan and the trial, but **no prices and no buy button**. Apple requires in-app purchase for digital subscriptions bought inside an iOS app, so salons pay on Android or on the website. Decide with Apple review before turning a buy button on (`EXPO_PUBLIC_IOS_CHECKOUT`).

## Notifications

The server sends these through Expo's push service (`https://exp.host/--/api/v2/push/send`) and email, from a queue:

| When | Who | What |
| --- | --- | --- |
| Booking created | Salon owner | Push and email: client, services, time. |
| Booking cancelled by the customer | Salon owner | Push. |
| Booking cancelled by the salon | Customer | Push and email. |
| 24 hours and 2 hours before the start | Customer | Push reminder (scheduler, every 5 minutes; sent once). |
| Trial ends in 3 days, and on the day it ends | Salon owner | Email. |

Tokens that Expo reports as `DeviceNotRegistered` are deleted.

## Rules the app relies on

- **Validation** (mirror `src/auth/validation.ts`):
  - Names: letters (Latin, Azerbaijani, Cyrillic), spaces, `'` and `-`, 2–40 characters.
  - Phone: an Azerbaijani mobile number in E.164 (`+994` followed by 10/50/51/55/60/70/77/99 and 7 digits).
  - Date of birth: a real date, age 13 or over.
  - Password: 8–64 characters, with at least one letter and one digit. The demo backend accepts 6, for the demo account.
- **Passwords:** hash with `Hash::make` (bcrypt or argon2id). Never log them, never return them.
- **One-time codes:**
  - Six digits from `random_int`. Store **only a hash**.
  - Expire after 10 minutes. Allow at most 5 wrong attempts per code; after that the code is dead and a new one must be requested.
  - 60-second resend cooldown.
  - Sent from a queued Mailable, from the domain's own address (SPF, DKIM and DMARC set).
- **Rate limits:** on `login`, `register`, `forgot`, `verify` and `resend`, both per IP and per email; on `POST /bookings`, per user.
- **Gender** is used only to hide venues that don't serve the user (`audience`), and the user can switch that off in Profile.

## Social sign-in setup

1. **Google Cloud Console:**
   1. Create OAuth client IDs: **iOS** (the bundle ID), **Android** (the package plus the signing SHA-1 from `eas credentials`) and **Web**.
   2. Put them in the EAS environment as `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`, and give the backend the same IDs (`GOOGLE_CLIENT_IDS`), so it can check `aud`.
2. **Apple:**
   1. Enable *Sign in with Apple* for the App ID; `app.json` already sets `ios.usesAppleSignIn`.
   2. The backend checks the identity token's `aud` (bundle ID) and `iss` against Apple's JWKS.
3. Both need a real build (`eas build`); Expo Go can't use your own bundle IDs.

## Demo account

- The demo backend seeds one verified account, **faiq.farid0604@gmail.com**.
- Only a salted hash of its password is in the code. Regenerate it with `node scripts/hash-demo-password.mjs '<password>'`.
- On the real backend, `php artisan usta:create-user` creates it, reading the password from a prompt. Never commit it.
