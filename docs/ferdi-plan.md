# Fərdi plan (10 ₼): merge and go-live notes

**What it is.** Fərdi is for one person: a master working solo, or one master inside a salon who wants their own page.
- **Price:** 10 ₼ a month, or 100 ₼ a year, with the same 30-day free trial.
- **Features:** everything in Start: in-app booking, calendar, reminders, QR reviews, gallery, click report and the WhatsApp add-on.
- **One master:** exactly one master and one location.
- **A personal page** at `yazilnow.az/u/<name>` (later `<name>.yazilnow.az`), for example `yazilnow.az/u/orxanosmanov`.

Sadə (10 ₼) stays as it is, so there are four plans: **Sadə 10 · Fərdi 10 · Start 29 · Pro 49**. Start and Pro also get a personal page; Sadə doesn't.

## Merging into the live code

The live server runs code that isn't on GitHub: the staff cabinet, per-day hours, the panel restyle and more. This change was built on the GitHub version (commits after `12f6b5f` on `claude/usta-booking-app`). Merge it into the live code. Don't upload a package built from GitHub, because it would remove the live-only changes.

All changes are additive.

**Backend:**

| File | What changed |
| --- | --- |
| `backend/config/usta.php` | `plans.ferdi` (10/100 ₼); `plan_features.ferdi` = Start + `personal_page`; `personal_page` added to Start and Pro; `master_limit` (`ferdi => 1`); `page_domain`; `reserved_slugs` |
| `backend/database/migrations/2026_11_09_100000_personal_pages.php` | `businesses.slug`: varchar(30), nullable, unique |
| `backend/app/Models/Business.php` | `masterLimit()`, `pageUrl()` |
| `backend/app/Http/Controllers/Business/MasterController.php` | Adding a master past the limit returns 402 `master_limit` |
| `backend/app/Http/Controllers/Business/SubscriptionController.php` | `fitsPlan()`: picking Fərdi with more than one master, or with branches, returns 422 `too_many_masters` |
| `backend/app/Http/Controllers/Business/BusinessController.php` | `slug` field: lowercased, 3–30 characters, `a-z0-9` and single hyphens, not reserved, unique, needs `personal_page` (else 402 `plan_required`) |
| `backend/app/Http/Controllers/CatalogueController.php` | `GET /api/pages/{slug}` returns `{ salon_id, slug, name }` for listed salons; `GET /api/plans` adds `masters` |
| `backend/app/Http/Resources/BusinessResource.php`, `SalonResource.php` | Expose `slug` and `page_url` |
| `backend/routes/api.php` | The `pages/{slug}` route |
| `backend/tests/Feature/FerdiPlanTest.php`, `CatalogueTest.php` | Tests for all of the above (126 passing) |

**App** (`src/`):
- `auth/types.ts`, `auth/plans.ts`: the Fərdi plan, `masterLimit()`, the `personal_page` feature, and `planById` falling back to Pro by id.
- `app/business/details.tsx`: the "Şəxsi səhifə ünvanı" field.
- `app/business/masters.tsx`: hides "Add master" at the limit.
- `app/business/plans.tsx`: the Fərdi note.
- `app/business/index.tsx`: the locked-feature label.
- `app/u/[slug].tsx`: opens a page address.
- `api/catalogue.ts`: the `page()` call.
- `api/client.ts`, `auth/flow.ts`: the new error codes.
- `i18n/strings.ts`: the new texts.
- `auth/local.ts`: demo mode accepts `ferdi`.

**Website and hosting:**
- `web/src/i18n.ts`: Fərdi in the pricing list.
- `web/public/404.js`: forwards `/u/...`.
- `deploy/apache/single-site.htaccess`: redirects `<name>.yazilnow.az` to `/app/u/<name>`, and `/u/<name>` the same way.
- `deploy/apache/site.htaccess`, `deploy/nginx/yazilnow.conf`: forward `/u/...`.

## After merging

```bash
cd backend && php artisan migrate --force     # adds businesses.slug
php artisan config:clear                      # or config:cache, if you cache config
```

Then rebuild and upload the app (`public_html/app`) and the website files.

## Turning on `name.yazilnow.az` (hosting)

Until this is set up, the same page works at **`https://yazilnow.az/u/<name>`**. The app shows the subdomain address; share the `/u/` address meanwhile.

Subdomain pages need three things that the current Hostinq plan doesn't allow (it couldn't even create one subdomain):

1. **Wildcard DNS:** an `A` record for `*` pointing at the server's IP.
2. **A wildcard domain** `*.yazilnow.az` with its document root at `public_html`. In cPanel this is Domains → Create a new domain → `*.yazilnow.az`.
3. **A wildcard SSL certificate** for `*.yazilnow.az`. AutoSSL doesn't issue wildcards on most shared plans. Let's Encrypt can, through a DNS check.

Ask Hostinq whether your plan can enable all three. If not, a plan or VPS that allows wildcard subdomains is needed. The `.htaccess` rule is already in place and tested: once these three exist, `orxanosmanov.yazilnow.az` opens the page with no code change.

## Booking link for every plan that takes bookings

Fərdi, Start and Pro each have a **booking link** on the salon dashboard (Sadə doesn't). Salons copy it into their Instagram bio or send it to clients:
- **The link:** `https://yazilnow.az/u/<address>` if they picked a personal page address, otherwise `https://yazilnow.az/u/<salon id>`. A Pro branch shows the main salon's link.
- **What it opens:** the salon's page in a browser (`/app`), with services, masters, opening hours, free times and booking. On Pro with more than one open location, the client picks a branch first.
- **Later:** the same link opens in the app once it is in the stores.

**Server:**
- `Business::shareUrl()` builds the link, and `BusinessResource` sends it as `share_url`.
- `GET /api/pages/{address-or-id}` returns `branches` for Pro.
- `pageUrl()` now gives `yazilnow.az/u/<address>`. Set `PAGE_SUBDOMAINS=true` in `.env` only after the wildcard subdomain setup below works.

**App:**
- `src/components/business/BookingLinkCard.tsx`: Copy (website) or Share (phone), and Open.
- `src/lib/bookingLink.ts`
- `src/app/u/[slug].tsx`: the branch picker.

**Plan texts:** new lines in `src/auth/plans.ts` and `web/src/i18n.ts`.

The hosting needs no change: `/u/...` already forwards to `/app/u/...` (`deploy/apache/single-site.htaccess`, `web/public/404.js`).
