# Deploy handoff: yazılnow on Hostinq cPanel

Read this first if you are picking up the deployment. It records what is decided, what was tested, and the traps already hit on this host.

## The host (facts, not assumptions)

- **Provider:** Hostinq Azərbaycan, plan **Ekonomik X1**, cPanel 138, server `hh7.hostinq.net`.
- **cPanel user:** `yazilmaf`. Home is `/home/yazilmaf`, web root `/home/yazilmaf/public_html`.
- **Domain:** `yazilnow.az`, the account's main domain, with document root `/public_html`.
- **No subdomains.** Creating one fails with "Error: You must specify a subdomain", and the document root field is locked to start with `/public_html/`. So everything runs on the one domain (below).
- **PHP:** the domain uses **cPanel MultiPHP, PHP 8.3 (ea-php83)**, shown as "8.3 (account default)".
  - The CloudLinux "PHP Selector" page shows `native (8.2)` with locked extensions. Ignore it and don't change it.
  - The CLI binary is `/opt/cpanel/ea-php83/root/usr/bin/php`. Plain `php` in Terminal may be a different version.
- **Site isolation (CageFS)** is disabled by the host. That's normal; ignore the warning.
- **Not yet confirmed:**
  - Terminal access works.
  - The PHP extensions are present. Check with `/opt/cpanel/ea-php83/root/usr/bin/php -m`; it needs pdo_mysql, mbstring, intl, gd, fileinfo, exif, curl, zip, bcmath, openssl, tokenizer, xml.
  - The `ln -s` symlink is allowed.

## Layout: one domain, `LAYOUT=single`

| URL | What | Files on the server |
| --- | --- | --- |
| `https://yazilnow.az/` | Website (`web/`) | `~/public_html/` |
| `https://yazilnow.az/app/` | Expo web export of the app: salon panel `/app/panel`, QR reviews `/app/r/<code>`, client app | `~/public_html/app/`, built with `experiments.baseUrl=/app` (`EXPO_WEB_BASE_URL`) |
| `/api/*`, `/admin*`, `/up`, `/billing/*`, `/storage/*`, `/admin-assets/*` | Laravel | `~/yazilnow-api/`, outside public_html. Reached through the symlink `~/public_html/server -> ~/yazilnow-api/public` |

- **Routing:** `deploy/apache/single-site.htaccess` becomes `public_html/.htaccess`. It does five things:
  1. Forces HTTPS and redirects www to the bare domain.
  2. Passes the Authorization header through.
  3. Rewrites server paths to `server/index.php`; Laravel sees the original URI because the base URL resolves to empty.
  4. 302s `/r|s|salon/<id>` and `/panel` into `/app/...`.
  5. Returns 404 for direct `/server/` requests, guarded by `REDIRECT_STATUS` to avoid an internal loop.
- **CSP:** the website's CSP is skipped for the app and server paths; those send their own.
- **The app folder:** `deploy/apache/single-app.htaccess` becomes `public_html/app/.htaccess`. It's the SPA fallback with `RewriteBase /app/`, and carries the app's CSP.
- **Laravel `.env`:** `APP_URL=https://yazilnow.az`, `WEB_URL=https://yazilnow.az` (QR links are `/r/<code>`), `SESSION_DOMAIN` empty, `CORS_ALLOWED_ORIGINS=https://yazilnow.az,https://www.yazilnow.az`. The app calls `https://yazilnow.az/api` on the same origin.

## Build the upload

From the repo root, on a machine with Node 22 and PHP 8.3 + Composer:

```bash
DOMAIN=yazilnow.az deploy/package-cpanel.sh                 # first install → deploy/out/yazilnow-cpanel.zip
UPDATE=1 DOMAIN=yazilnow.az deploy/package-cpanel.sh        # later: same zip without .env
SKIP_BUILD=1 DOMAIN=yazilnow.az deploy/package-cpanel.sh    # repackage without rebuilding site/app
```

What `package-cpanel.sh` does:
1. Runs `deploy/build.sh` with `LAYOUT=single`.
2. Copies `backend/` without tests, `.env`, sqlite files, logs or photos, plus `vendor/` without `.git`, then runs `composer install --no-dev -o`.
3. Writes `yazilnow-api/.env` from `deploy/backend.env.production` with a **freshly generated APP_KEY** and cPanel defaults: DB `CPANELUSER_yazilnow`, mail `mail.yazilnow.az:465` as `no-reply@yazilnow.az`.
4. Zips `public_html/`, `yazilnow-api/` and `README-FIRST.txt`. The result is about 29 MB.

**The zip contains APP_KEY.** Never commit it. Keep the same key forever once live, because changing it logs everyone out and breaks encrypted admin TOTP secrets. Update zips (`UPDATE=1`) carry no `.env`.

Build traps already fixed (don't undo them):
- **Metro cache.** It caches inlined `EXPO_PUBLIC_*` values, so `build.sh` uses `expo export --clear` and fails if the bundle still contains `localhost:8000` or lacks the API host.
- **No rsync.** Some machines don't have it, so the copy uses `tar`.
- **Huge local vendor.** A local `backend/vendor` installed with `--prefer-source` is about 6 GB; the packager strips `.git`.

## Server steps (the user does these; full text in `deploy/cpanel/README-FIRST.txt`)

1. In File Manager, turn on Show Hidden Files, then upload the zip to `/home/yazilmaf` (not public_html) and Extract. Delete the host's default `public_html/index.html` first.
2. In Terminal, create the server link and check it:
   `ln -s ~/yazilnow-api/public ~/public_html/server && ls -la ~/public_html | grep server`
3. Use the MySQL Database Wizard to create `yazilmaf_yazilnow` with user `yazilmaf_yazilnow` and ALL PRIVILEGES.
4. In Email Accounts, create `no-reply@yazilnow.az` and `support@yazilnow.az`. Then open Email Deliverability and Repair SPF and DKIM.
5. Edit `~/yazilnow-api/.env` and set `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` and `MAIL_PASSWORD`.
6. In Terminal, with `PHP=/opt/cpanel/ea-php83/root/usr/bin/php`:
   1. `cd ~/yazilnow-api`
   2. `$PHP artisan migrate --force`
   3. `$PHP artisan storage:link`
   4. `$PHP artisan usta:create-admin`, which is interactive and prints the TOTP key for Google Authenticator.
7. Add two cron jobs, every minute:
   - `cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan schedule:run >> /dev/null 2>&1`
   - `cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan queue:work --max-time=55 --sleep=1 --tries=3 >> /dev/null 2>&1`

   The second one is the email and push worker; shared hosting has no supervisor.
8. In SSL/TLS Status, run AutoSSL for `yazilnow.az` and `www.yazilnow.az`. Then go to Domains and turn on Force HTTPS.
9. Check:
   - `/up` returns 200.
   - `/` shows the website.
   - `/app/panel`: register a test salon; the code arrives by email.
   - `/admin`: sign in, then approve the salon.
   - Scan the Review QR; it opens `/app/r/<code>`.

Errors are logged in `~/yazilnow-api/storage/logs/laravel-*.log`; `LOG_CHANNEL=daily`.

## Tested, and how

- The exact zip, extracted into a fake home folder on **Apache 2.4 + mod_php 8.3** with `AllowOverride All` and `SymLinksIfOwnerMatch`, served over HTTPS:
  - Every route above.
  - The redirects.
  - The API with the Authorization header.
  - Salon sign-up.
  - The admin login page and its CSS.
  - The app bundle.
  - `/server/` gives 404 and `.env` gives 403.
  - Correct CSP per area.
- A browser run (Playwright) of the website, `/panel` → `/app/panel`, a QR link → `/app/r/…`, and sign-in under `/app`: no CSP violations.
- Production mode (`APP_ENV=production`, `PAYMENT_DRIVER=provider`, `PAYMENTS_ENABLED=false`):
  - Sign-up codes aren't echoed back.
  - Errors are generic JSON.
  - Bookings work.
  - The fake payment page is refused.
- Backend tests: 121 passing (`cd backend && php artisan test`). App: `npx tsc --noEmit`, `npx expo lint` and `npx jest` all pass.

## Not done yet (launch scope)

- **Payments are off.** `ProviderGateway.php` is a stub, so nothing can be charged and deposits and the WhatsApp pack are hidden. Connect a provider before the first 30-day trials end.
- **Google and Apple sign-in** need `GOOGLE_CLIENT_IDS` and `APPLE_CLIENT_IDS` in `.env`, plus the `EXPO_PUBLIC_GOOGLE_*` values in the app build.
- **Phone apps** (EAS builds and store review) aren't done: see `docs/launch.md`. Universal links need `APPLE_TEAM_ID` and `ANDROID_SHA256` passed to `build.sh`, which writes `.well-known` files into public_html.
- **Footer legal details** (`company` in `public_html/config.js`) and a lawyer's check of the privacy policy and terms are still needed.
- **Decided:** Pro includes **3 locations** (`usta.branches.included`); the deck and docs agree.
- **The security audit** is in `docs/security-audit.md`. The remaining npm advisories need the Expo SDK 58 upgrade.

## Where things are

- `deploy/package-cpanel.sh`, `deploy/build.sh`: the build.
- `deploy/apache/single-*.htaccess`: the cPanel configs in use.
- `deploy/apache/site|app.htaccess`, `deploy/nginx/`: the subdomain and VPS variant, not used on this host.
- `deploy/backend.env.production`: the `.env` template.
- `deploy/cpanel/README-FIRST.txt`: the user's step-by-step instructions.
- `docs/deploy.md`: the general guide.
- `docs/security-audit.md`: the security audit.
- `docs/launch.md`: store launch.
- `docs/go-live.md`: product checklist.
