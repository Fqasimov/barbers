# Security audit: yazılnow app, website, API and admin (November 2026)

**Method:** the Cloudflare security-audit skill (github.com/cloudflare/security-audit-skill), standard profile.
- Four parallel source reviews: access and data separation, sign-in and sessions, website and app, uploads/abuse/hosting.
- Every candidate was then checked against the code before fixing.
- No live attacks were run. Live settings were read over SSH only.

**Reviewed:** commit 144d75e. **Fixed in:** 89dfa74, deployed 15 Nov 2026.

## Confirmed and fixed

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | High | A salon paying for Sadə/Fərdi/Start could switch itself to **Pro for free** through the trial endpoint. | The trial endpoint now refuses paid (active / past_due) plans with `409 plan_change_needs_payment`. Test added. |
| 2 | Medium | The **owner, managers or staff could book their own salon and leave "verified" 5★ reviews**. | Same own-salon check as QR reviews (`Business::isTeam`). Test added. |
| 3 | Medium | **Three accounts could hide any review**, including the salon's own owner reporting a bad review. | Owner and team can't report their own salon's reviews. Only accounts at least a week old count toward auto-hide. Every report still reaches the admin. Tests added. |
| 4 | Medium | **Managers could change the salon's phone, WhatsApp, links, page address and logo**, so client contact could be redirected. | These are now owner-only. Managers keep calendar, hours, masters, services and reviews. |
| 5 | Medium | Your **real email and a weakly hashed password were in the public app code** (demo mode data, shipped in every bundle). | Replaced with `demo@yazilnow.az` and a random, discarded password. Verified the new live bundle no longer contains it. |
| 6 | Medium | **Password guessing from many IPs was never cut off**: about 14,000 tries a day per account. | At most 30 wrong passwords per email per day, whatever the IP. Test added. |
| 7 | Medium | **Google/Apple sign-in and password reset shared one global limit**, so anyone could block everyone's sign-in with 10 requests a minute. | Requests without an email are limited per IP only. Test added. |
| 8 | Medium | **The city-wide time search could be cache-busted**, forcing heavy database work on every request (overload risk on shared hosting). | Computed once per service/day/minute and filtered afterwards. Expired cache rows are cleared hourly. `service_ids` is capped at 10. |
| 9 | Low–Medium | **Admin sign-in with an unknown email crashed (500) instead of a normal error**. That revealed which admin emails exist and skipped the attempt counter. | Uses a real dummy hash, so every answer is the same. Test added. |
| 10 | Low–Medium | **Resetting an admin's password didn't end that admin's existing sessions.** | Sessions are bound to the password and authenticator, and a reset signs every old session out. Test added. |
| 11 | Low | One authenticator code could be used by two parallel sign-ins. | The code's time step is claimed in one database statement. |
| 12 | Low | Parallel wrong email codes could exceed the 5-tries-per-code limit. | Tries are counted atomically. |
| 13 | Low | Anyone could **wipe someone else's sign-up that was still waiting for its code**. | A pending sign-up is kept until its code expires (10 minutes). |
| 14 | Low | Some plan limits weren't enforced: Sadə could use the calendar, and accounts with no plan could reply to reviews or upload photos. | `requireFeature` checks added. Test added. |
| 15 | Low | A branch manager could see every location and the Pro price. | The branch list is owner-only. Test added. |
| 16 | Low | **The `/server/` folder could be opened directly.** The rule meant to block it never ran, because that folder's own rules take over. Nothing sensitive was exposed. | Rule moved into `backend/public/.htaccess`. Verified on the live site: `/server/…` gives 404, including encoded paths. |
| 17 | Low | The traffic stats could be filled with made-up page names, referrers and browsers, growing the database without limit. | Pages from an allowlist, capped referrers, at most 5 browsers per IP, old rows deleted. |
| 18 | Low | Made-up Google/Apple key IDs forced a refetch of their keys on every request. | At most one refetch per minute. |

## Checked and sound (summary)

- **Data separation:** every salon, booking, master, service, photo, team and staff query is limited to the caller. The `X-Branch` header can't reach another account. Customers only see their own bookings. Public pages expose no customer contact details.
- **Sign-in:** email codes are random, stored hashed, expire, have attempt limits and email limits. Unknown emails get decoys. Google/Apple tokens are fully verified. API tokens are stored hashed and revoked on sign-out, reset and deletion. Admin sign-in needs password, authenticator and attempt limits, signs out after 30 minutes idle, and has a separate login from customers.
- **Encryption and secrets:**
  - HTTPS everywhere, with HSTS.
  - Sessions are encrypted, cookies are Secure, HttpOnly and SameSite=strict, and the authenticator secrets are encrypted in the database.
  - Passwords use bcrypt with 12 rounds.
  - The server settings file has permissions 600 and isn't in the git history.
- **Website and app:**
  - No HTML injection points. A strict script policy (CSP) is set everywhere, and pages can't be put inside other sites.
  - No open redirects. Deep links can't change anything without a tap and a login.
  - On phones the login token is kept in the secure keychain.
- **Uploads:** photos are checked by their contents, size-limited and re-saved as JPEG, which removes location data. No SVG or HTML can be uploaded. File names are chosen by the server.
- **Server:**
  - Debug mode is off and logs record warnings only.
  - No public backups.
  - The API is open to yazilnow.az only (CORS), and proxy headers aren't trusted, so IP-based limits can't be dodged.
  - Payments fail closed until a real provider is connected.

## Accepted / for you to decide

- **Registration reveals that an email is already registered** ("an account with this email exists"). This is common and helpful for users. Hiding it would mean a "check your email" step instead.
- **On the website, the login token is in localStorage.** It's only reachable through an injection bug, and none was found; the strict CSP blocks the usual ones. Moving it to a cookie is possible later.
- **A device's push token moves to whoever registers it last.** That is intended for phones that change owner, and it only matters if a token leaks.
- **Your old password hash is still in the git history.** If that password is used anywhere (email, admin, the API), change it there.
- **CIA summary:**
  - Confidentiality: strong after fixes 5, 9 and 16.
  - Integrity: reviews and plans were the weak spots, fixed in 1–4 and 14.
  - Availability: rate limits and the heavy search, fixed in 6–8, 17 and 18. Shared hosting has no DDoS shield, so Cloudflare in front of the site would be the next step.
