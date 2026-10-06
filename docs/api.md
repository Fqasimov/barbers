# Usta API: accounts and business sign-up

The app talks to a Laravel API with Sanctum bearer tokens. Until `EXPO_PUBLIC_API_URL` is set, it uses an on-device demo backend (`src/auth/local.ts`) that follows the same contract. This page is that contract. The client is `src/auth/http.ts`, and the types are in `src/auth/types.ts`.

- **Base path:** `/api`. JSON in and out, `snake_case` keys. The app converts them to camelCase.
- **Authenticated calls** send `Authorization: Bearer <token>`.
- **Errors** look like `{ "error": "<code>", "message": "…" }`. Validation failures are Laravel's standard `422 { "message", "errors": { field: [msg] } }`. Codes the app understands:
  `invalid_credentials`, `email_taken`, `not_verified`, `otp_invalid`, `otp_expired`, `too_many_attempts`, `resend_too_soon`, `not_found`, `session_expired`.

## Objects

```jsonc
// User
{ "id": "…", "first_name": "…", "last_name": "…", "email": "…",
  "phone": "+994501234567", "birth_date": "1995-04-06", "gender": "male|female|null",
  "role": "customer|business", "provider": "password|google|apple",
  "email_verified": true, "created_at": "ISO-8601" }

// Business (one per business owner for now)
{ "id": "…", "owner_id": "…", "salon_name": "…", "categories": ["barber","hair","nails","brows","spa","makeup"],
  "district": "…", "address": "…", "audience": "all|women|men",
  "status": "pending_review|live",
  "subscription": null | { "plan": "start|pro|studio", "status": "trialing|active|expired",
                           "started_at": "ISO", "trial_ends_at": "ISO" },
  "created_at": "ISO" }

// Session (returned by every sign-in)
{ "token": "<sanctum token>", "user": User, "business": Business | null }

// OTP challenge (returned when a code is emailed)
{ "email": "…", "purpose": "register|reset", "expires_at": "ISO", "resend_at": "ISO" }
```

## Endpoints

| Method | Path | Body | Success | Notes |
| --- | --- | --- | --- | --- |
| POST | `/auth/register` | `first_name, last_name, phone, birth_date, gender, email, password` | `202` OTP challenge | Creates an **unverified** user and emails a code. `422 email_taken` if a verified account exists. |
| POST | `/business/register` | owner `first_name, last_name, phone, email, password` + `salon_name, categories[], district, address, audience` | `202` OTP challenge | Creates a `business` user and a `pending_review` business. |
| POST | `/auth/email/verify` | `email, code` | `200` Session | Marks the email verified and signs in. |
| POST | `/auth/otp/resend` | `email, purpose` | `202` OTP challenge | `429 resend_too_soon` within the cooldown. |
| POST | `/auth/login` | `email, password` | `200` Session | `401 invalid_credentials` for unknown email or wrong password (same response either way). For an unverified email: `403 not_verified` with a fresh challenge in `otp`. |
| POST | `/auth/password/forgot` | `email` | `202` OTP challenge | Always `202`, even for unknown emails (no account probing). |
| POST | `/auth/password/verify` | `email, code` | `200 { reset_token }` | Single-use, 15-minute token. |
| POST | `/auth/password/reset` | `reset_token, password` | `200` Session | Revokes the user's other tokens. |
| POST | `/auth/social/google` | `id_token` | `200` Session | Verify the token with Google, then find or create the user by verified email. |
| POST | `/auth/social/apple` | `id_token, email?, first_name?, last_name?` | `200` Session | Verify against Apple's JWKS. Apple sends the name and email only on the first sign-in, so store them then. |
| GET | `/me` | — | `200` Session | `401 session_expired` signs the app out. |
| PATCH | `/me` | any of `first_name, last_name, phone, birth_date, gender` | `200` User | Used after social sign-in to fill in missing details. |
| POST | `/business/subscription/trial` | `plan` | `200` Business | Starts the 30-day trial once per business. Calling it again only changes the plan. No card needed. |
| POST | `/auth/logout` | — | `204` | Revokes the current token. |

## Rules the app relies on

- **Validation** (mirror `src/auth/validation.ts`):
  - Names: letters (Latin, Azerbaijani, Cyrillic), spaces, `'` and `-`, 2–40 characters.
  - Phone: an Azerbaijani mobile number in E.164 (`+994` followed by 10/50/51/55/60/70/77/99 and 7 digits).
  - Date of birth: a real date, age 13 or over.
  - Password: 6–64 characters, with at least one letter and one digit.
- **Passwords:** hash with `Hash::make` (bcrypt or argon2id). Never log them, never return them.
- **One-time codes:**
  - Six digits from `random_int`. Store **only a hash** (`Hash::make` or HMAC).
  - Expire after 10 minutes. Allow at most 5 wrong attempts per code; after that the code is dead and a new one must be requested.
  - 60-second resend cooldown.
  - Send with a queued Mailable from the verified domain's address (SPF, DKIM and DMARC set). The email holds the code only, no link.
- **Rate limits** (`RateLimiter`): on `login`, `register`, `forgot`, `verify` and `resend`, both per IP and per email.
- **Tokens:** Sanctum personal access tokens. On the phone, the app keeps the token in the Keychain/Keystore (SecureStore).
- **Gender** is used only to hide venues that don't serve the user (`audience`), and the user can switch that off in Profile.

## Suggested tables

- **`users`**: `id`, `first_name`, `last_name`, `email` (unique), `phone`, `birth_date`, `gender`, `role`, `provider`, `provider_id`, `password` (nullable for social accounts), `email_verified_at`, timestamps.
- **`email_otps`**: `email`, `purpose`, `code_hash`, `attempts`, `expires_at`, `resend_at`.
- **`password_reset_tokens`**: Laravel's default table, holding the hashed `reset_token`.
- **`businesses`**: `id`, `owner_id`, `salon_name`, `categories` (json), `district`, `address`, `audience`, `status`, timestamps.
- **`subscriptions`**: `business_id`, `plan`, `status`, `started_at`, `trial_ends_at`, `provider_ref` (for the payment provider later).

## Social sign-in setup (when the domain exists)

1. **Google Cloud Console:**
   1. Create OAuth client IDs: **iOS** (bundle `app.usta.booking`), **Android** (package `app.usta.booking` plus the signing SHA-1) and **Web**.
   2. Put them in `.env.local` as `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID`.
   3. The backend verifies `id_token` against the same client IDs.
2. **Apple:**
   1. Enable *Sign in with Apple* for the App ID. `app.json` already sets `ios.usesAppleSignIn`.
   2. The backend verifies the identity token's `aud` (bundle ID) and `iss` against Apple's JWKS.
3. Both need a **development build** (`eas build --profile development`). Expo Go can't use your own bundle identifiers.

## Demo account

The demo backend seeds one verified account, **faiq.farid0604@gmail.com**. Only a salted hash of its password is in the code; regenerate it with `node scripts/hash-demo-password.mjs '<password>'`. On the real backend, create the account with `php artisan tinker` or a seeder that reads the password from an environment variable. Never commit it.
