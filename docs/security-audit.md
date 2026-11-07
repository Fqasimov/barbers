# Security audit: November 2026

**Scope:** the whole repository.
- **API and admin panel:** `backend/`, Laravel.
- **Mobile app, and the same code in a browser:** `src/`, Expo.
- **Website:** `web/`.
- **Hosting configs:** `deploy/`.

**Method:** the [openai/codex-security](https://github.com/openai/codex-security) workflow, run by hand. The CLI needs an OpenAI API key, and none was available, so its published process was followed instead:
1. Map the threat model.
2. Trace each entry point from attacker-controlled input to the sensitive operation it reaches.
3. Check for embedded secrets.
4. Validate every candidate against the source.
5. Fix, then prove each fix with a test.

## Threat model

| Who | Wants | Entry points |
| --- | --- | --- |
| Anonymous visitor | Probe accounts, take over one, overload the server | `/api/auth/*`, public catalogue, `/api/slots`, QR lookups |
| Signed-in client | See or change someone else's bookings; fake reviews; avoid paying a deposit | `/api/bookings*`, `/api/reviews/*`, waitlist |
| Salon owner or manager | Reach another salon's data; push their own rating; bypass plan limits | `/api/business/*` with `X-Branch`, photo upload, review codes |
| Competitor | Bury a salon's reviews, flood it with junk | review reports, QR codes, bookings |
| Payment provider callback | Forged "paid" notices | `/api/payments/{provider}/callback` |
| Staff impostor | Admin panel | `/admin/login` |

## Findings and fixes

| # | Severity | Finding | Fix | Proof |
| --- | --- | --- | --- | --- |
| 1 | **High** | **Password-reset codes could be brute-forced.** Each "forgot password" request issued a fresh 6-digit code with 5 new guesses, so with the 10/min per-email limit an attacker got about 8 guesses a minute indefinitely (roughly 1% chance per day of taking over any account). The same loop let anyone send a victim hundreds of emails an hour. | Wrong codes are counted per email for 24 hours across all codes (15 a day). Asking again within the cooldown reuses the code already sent. At most 6 code emails per address per hour. | `SecurityHardeningTest::test_asking_for_new_reset_codes_never_buys_more_guesses`, `…_cap_the_emails` |
| 2 | **Medium** | **Paying a deposit twice kept both payments.** Opening the payment page twice and paying both confirmed the booking once and silently kept the second charge. Later, a cancellation could "refund" the duplicate instead of the real deposit. | A second paid deposit for a confirmed booking is refunded at once, without touching the booking. A refund always picks the deposit still held. Failed refunds are logged for staff. | `test_a_second_paid_deposit_is_refunded_and_the_booking_stays_paid` |
| 3 | **Medium** | **Seven known vulnerabilities in Symfony components** (http-foundation, http-kernel, routing, mime). They include a host-header issue that could make generated URLs point elsewhere, and an email header injection. | Updated to patched versions. `composer audit` is now clean. | `composer audit` |
| 4 | **Medium** | **Image "decompression bomb" upload.** An 8 MB PNG can claim 10 000 × 10 000 pixels and exhaust server memory while being resized. | Images over 50 megapixels are refused before decoding, for both GD and Imagick. | `test_a_photo_that_unpacks_to_too_many_pixels_is_refused_before_decoding` |
| 5 | **Medium** | **The city-wide free-time search was unlimited, uncached work.** `/api/slots` computed every master's day for every matching salon on each request, at 240 requests/min per IP. That made it the cheapest way to overload the API. | Results are cached for 30 seconds and dropped by any booking or catalogue change, so they are never stale after a booking. | `test_city_wide_search_is_cached_until_a_booking_changes_it` |
| 6 | Low | **Admin sign-in was limited only per email + IP pair**, so rotating IPs allowed unlimited password guesses. A TOTP code is still required, but this is defence in depth. | Also locked per account: 20 failures lock it for 15 minutes. | Code review; existing `AdminTest` passes |
| 7 | Low | **No limit on review QR codes.** An owner could mint codes without limit to feed sock-puppet reviews. | At most 150 codes per location per day. The existing limits stay: one QR review per account per salon per 30 days, 3 a day, and QR reviews weigh less. | `test_review_codes_are_capped_per_day` |
| 8 | Low | **API responses lacked security headers**, and personal answers (bookings, account) could be stored by shared caches. | Every `/api` answer now sends `nosniff`, `DENY` framing, `no-referrer`, a deny-all CSP and HSTS over HTTPS. Anything not explicitly public is `no-store`. | `test_api_answers_carry_security_headers` |
| 9 | Low | **The website ran inline scripts**, so a strict Content-Security-Policy was impossible. | Inline scripts moved to files. The website and the app are both served with `script-src 'self'` (`deploy/nginx`, `deploy/apache`), verified in a browser with no violations. | Manual browser check under the production headers |
| 10 | Low | **Deploys could silently ship a localhost API.** The web build reused Metro's cache, so a "production" bundle still called `http://localhost:8000`. | `deploy/build.sh` clears the cache and refuses a bundle that doesn't point at the real API. | Reproduced, then fixed |

## Checked and sound

- **Authorization:**
  - Every `/business` route goes through `EnsureBusinessOwner` and `BusinessAccess`.
  - Objects are fetched with an ownership check (`owned()`), so another salon's id gives 403 or 404.
  - Clients only ever see their own bookings and waitlist (`where user_id`).
  - Billing, branches and the team are owner-only.
- **Mass assignment:** models use explicit `forceFill` with validated fields. `User` has a short `$fillable`, and roles are never mass-assigned.
- **Injection:** there is no raw SQL with user input; the four `whereRaw`/`selectRaw` calls are constant or parameterised. Blade has no unescaped output, and the React code has no `dangerouslySetInnerHTML`.
- **Passwords and tokens:**
  - Passwords are bcrypt-hashed. Sign-up codes are stored as HMACs and compared in constant time.
  - Reset tokens are single-use and expire after 15 minutes. A password change signs out every device.
  - Login gives the same answer and takes the same time for an unknown email or a wrong password.
- **Google and Apple sign-in:** the signature is checked against the provider's keys, along with issuer, audience and expiry. Accounts are linked only by the email inside the signed token.
- **Payments:**
  - Callbacks must be signed. Amount and currency must match the order.
  - Applying a callback is idempotent and runs under a row lock.
  - The fake gateway refuses to run in production. Its test page is a signed URL.
- **Admin panel:**
  - Sign-in needs password + TOTP. TOTP secrets are encrypted at rest.
  - 30-minute idle timeout, CSRF tokens, strict CSP, no framing, `no-store`.
  - Every change goes to the activity log.
- **Uploads:** the MIME type and extension are checked, and every photo is re-encoded to a fresh JPEG, which drops all metadata, including GPS location. Files get random names.
- **Secrets:** no keys, passwords or private keys in any tracked file. `.env` files are ignored by git.
- **Production mode, smoke-tested:**
  - Sign-up codes are not echoed.
  - Errors are generic JSON with no stack traces.
  - Bookings work with payments off.
  - The fake payment page is refused.

## What remains, and why

| Item | Risk | Recommendation |
| --- | --- | --- |
| npm advisories in Expo's own tooling (`glob`, `minimatch`, `@expo/fingerprint`) and in `expo-router`'s URL parser (`query-string` → `decode-uri-component`) | Build-time tools are never shipped. The router issue is a client-side slowdown from a deliberately malformed link. | They clear with Expo SDK 58. Upgrade when you next update Expo, and don't force it now: it's a breaking upgrade. |
| Sign-in tokens on the web are kept in `localStorage` | Only reachable through an XSS bug, and the strict CSP blocks injected scripts. | Keep the CSP. Tokens expire after 90 days with `SANCTUM_EXPIRATION_MINUTES` (set in the production template). |
| Sock-puppet reviews from someone with many verified email accounts | Inherent to any review system. | Admin → Reviews shows reports. QR reviews are capped and weigh less. Watch for salons whose QR reviews spike. |
| Review reports can hide a review after 3 reports | A competitor with 3 accounts can hide a review until staff check it. | Check the admin "Reviews" queue daily (go-live checklist). Raise `auto_hide_reports` if it's abused. |
| Real payment provider not implemented | Payments are switched off (`PAYMENTS_ENABLED=false`), so nothing can be charged. | When adding the provider, follow the TODO in `ProviderGateway.php`: verify the signature, or re-query the order status server-to-server. |
| Server hardening outside the code | Depends on the host. | Use the `deploy/` configs as they are: HTTPS only, HSTS, firewall (only 22/80/443), `.env` mode 600, daily off-server backups. |

## How to re-check

```bash
cd backend && php artisan test && composer audit
cd .. && npx tsc --noEmit && npx expo lint && npx jest && npm audit --omit=dev
```

With an OpenAI API key you can also run the original tool: `npx @openai/codex-security scan .`
