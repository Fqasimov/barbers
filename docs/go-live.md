# Going live: using the app

This covers the product, not the build: what customers and salons do in the app, the rules behind it, and what has to be ready on day one. For servers, builds and store accounts, see [launch.md](launch.md).

## Done in the app

**Customers**
- **Find a place:** the home feed, the map and the search.
- **Search by service and time:** for example "skin fade, today after 18:00".
- **Compare** up to three places.
- **Book:** pick a service, a master and a time.
- **Get reminders** 24 hours and 2 hours before.
- **Manage a booking:**
  - message the salon on WhatsApp
  - get directions
  - cancel up to 2 hours before
- **Review:** rate a finished visit, once.
- **Report a review.** The person who reported it stops seeing it straight away.
- **Saved places and followed masters.**
- **Account:**
  - sign up with email, Google or Apple
  - forgot password
  - edit details
  - delete account
- **Settings:** AZ / RU / EN, plus light and dark mode.

**Salons**
- **Sign up:** register and get a 30-day trial with no card.
- **Set up the salon:**
  - services, masters, hours, photos and details
  - a "go live" checklist shows what's missing
- **Bookings inbox:**
  - today and the next 14 days
  - mark a visit done or a no-show
  - call the client
  - cancel (the client is notified)
- **New:**
  - **phone calls and walk-ins:** written into the calendar so the app can't sell the same time
  - **time off:** lunch, a day off, a holiday, for one master or everyone. It can't cover an existing booking; cancel that first.
  - **reply to reviews:** one public reply per review
- **Alerts:** a push and an email for every new booking, and a push when a client cancels.
- **Subscription:** pay on Android (or later the website). On iPhone the app shows the plan, without a price or a buy button.

**You (admin), from the server command line**
- `php artisan usta:approve-business <id>` approves a new salon.
- `php artisan usta:suspend-business <id>` takes a salon down.
- `php artisan usta:reviews` lists reported reviews.
  - Add `--hide=<id>` or `--restore=<id>` to decide one.
  - Apple expects reports to be handled quickly; aim for **24 hours**.
- `php artisan usta:create-user` creates the App Review demo account.

## Decide before launch

These are business rules the app already enforces. The current value works, but it should be your choice.

| Rule | Now | Where it changes |
| --- | --- | --- |
| How far ahead customers can book | 7 days | `window_days` in `backend/config/usta.php` and `BOOKING_WINDOW_DAYS` in `src/data/availability.ts` (keep them equal). Many salons take bookings 2–4 weeks out; 14 is a common choice. |
| Free cancellation until | 2 hours before | `cancel_until_hours` in `backend/config/usta.php`. The text in the app says "2 hours" (`policy` and `errTooLateToCancel` in `src/i18n/strings.ts`), so change both. |
| Slot grid | every 30 minutes | `slot_step`. 15 minutes fits short services such as beard trims and brows. |
| Earliest same-day booking | 30 minutes from now | `lead_minutes` |
| No-shows | Recorded only; no penalty | Decide whether repeat no-shows get blocked. Not built yet. |
| Reports that hide a review | 3 | `auto_hide_reports` |
| Payment | At the salon, no card | Shown on the confirm screen (`policy`). |
| Grace after an unpaid trial or a missed payment | 7 days still listed and bookable, then hidden | `grace_days`. The dashboard and the email name the date. |
| Plans | Start 29 / Pro 59 ₼ a month (yearly 290 / 590 ₼), 30-day trial with no card | See below. |

### Plans: what is real today

Two plans: **Start** (29 ₼/month, for a single salon) and **Pro** (59 ₼/month, recommended, for growing salons). Studio was retired; its subscriptions moved to Pro.

Every salon currently gets the same working features:
- unlimited masters
- online booking and the calendar
- phone bookings and time off
- reminders
- review replies

These are promised but **not built**, and the plans screen marks them "coming soon":
- Start: WhatsApp confirmations
- Pro: deposits and no-show protection, the waitlist, statistics

Until they exist, Pro costs more for the same tools. Build at least deposits or statistics before you push salons towards Pro.

## Prepare the content

The app only feels alive when the first screen is full.

- [ ] **Real salons at launch.** Aim for 30+ live salons in Baku before announcing it to customers.
  - The home feed, the map and "free today" all need variety.
  - Use [salon-guide.md](salon-guide.md) when signing them up.
- [ ] **For each salon:**
  - 4+ real photos (front, interior, work)
  - every service with its real price and duration
  - every master with their real days and shift
  - hours, the address pin, and a WhatsApp number
  - Salons type names in one language, and the app shows that text in all three. For RU/EN customers, ask salons to write service names the way their clients say them; translation can come later.
- [ ] **Remove the sample venues.** The demo catalogue (`DemoCatalogueSeeder`) is for testing only. **Never run it on the production database.**
- [ ] **A native speaker reads every screen in AZ and RU.** All texts are in `src/i18n/strings.ts`.
  - The drafts are good, but they weren't written by a native speaker.
  - Pay most attention to the booking confirmation, the cancellation policy and the error messages.
- [ ] **Store listing:** the texts are ready in [store-listing.md](store-listing.md). Still needed:
  - screenshots from a real phone with real salons
  - the 1024×500 Play feature graphic
- [ ] **Help page on the website:** [help.md](help.md) holds the customer FAQ. Publish it at `/help` and link it as the support URL.

## Set up the operations

- [ ] **Support inbox:** `support@<domain>` (the app's "Contact support" opens it). Decide who answers it and how quickly; one working day is a good goal.
- [ ] **Salon approval:**
  - Decide what you check before running `approve-business`: a real address, real photos, a phone number that answers.
  - Approve within a day, or owners lose interest.
- [ ] **Review reports:** someone checks `usta:reviews` every day.
- [ ] **Salon support:** a WhatsApp number for owners, printed in the salon guide.
- [ ] **Trial ending:** owners get an email and a push 3 days before and on the last day; then the 7-day grace starts. Decide whether someone also calls salons in their last trial week; it converts far better than email.
- [ ] **Salons cancelling on clients:** the client gets a push and an email. Watch salons that cancel often.

## Test with real people (one week)

Do this before the public launch, on the internal test track.

- [ ] **Five salons** use the app for a full week, alongside their notebook. Watch for:
  - a phone call they forgot to write in
  - a master's day off that wasn't set
  - a booking that came in and nobody saw
- [ ] **Twenty customers** each book a real visit. Ask them what confused them.
- [ ] **A salon cancels a booking.** Does the client understand the message?
- [ ] **A customer doesn't show up.** The salon marks the no-show, and the customer sees "No-show".
- [ ] **A customer leaves a review and the salon replies.**
- [ ] **Someone reports a review, and you hide it.**
- [ ] **Payment:** one Android salon pays, and the dashboard shows "Paid until …".

## Next to build

Not needed for day one.

1. **Rescheduling.** Today a customer cancels and books again.
2. **Moving a booking in the salon inbox.** The salon calls the client, then needs to move them.
3. **Master photos.** Avatars use initials today.
4. **Deposits and no-show protection** (promised in Pro).
5. **Salon statistics:** bookings per week, revenue, no-show rate (promised in Pro).
6. **Waitlist:** "tell me if 18:00 frees up".
7. **Sharing a salon link,** once the domain exists (`https://<domain>/salon/<id>` opening the app).
8. **An admin panel** to replace the command line, once approvals and reports get busy.
