# yazılnow — project overview

This document explains the whole project for everyone on the team: what yazılnow is, why we are building it, what exists today, how it works, how it earns money, and what is still left before launch. If you only read one thing before the presentation, read this.

## 1. What yazılnow is

yazılnow is a booking platform for barbershops and beauty businesses in Baku. A client opens the app, sees which masters near them have a free time today or later this week, compares a few salons, and books a visit in a few taps, without calling or messaging anyone. A salon gets a place on the map, an online calendar, reviews it can trust, and simple tools to run its day.

The name comes from the Azerbaijani "yazıl" (sign up, book) and the English "now". Our line is "Ustanı tap, vaxtını tut" — find your master, book your time. The project started under the working name Usta; some internal parts of the code still use that name, but everything a customer or salon sees is now yazılnow.

We serve every kind of beauty business the app knows about: barbershops, hair salons, nail studios, brow and lash studios, spa, makeup artists and aesthetics clinics.

## 2. The problem

Booking a haircut or a beauty visit in Baku usually means writing to the salon on Instagram or WhatsApp, or calling, and then waiting for an answer. Often the answer comes hours later, and often it is "sorry, we're full". The client cannot see free times; the salon spends its day answering messages instead of working.

What we found when we looked into it in October 2026:

- **Most booking still happens in messengers.** In a field check of 37 top-rated Baku salons, based on their Google reviews and Instagram pages, about six in ten took bookings through WhatsApp, Instagram DMs or phone calls.
- **The tools that exist serve salons, not clients.** DIKIDI, Arnica, Rezneed, Altegio and YCLIENTS are booking and CRM systems for a salon's own use. Each shows only that salon. None of them lets a client search the whole city for a free time.
- **International apps are expensive and built for other markets.** Fresha charges about $14.95 per master each month and takes 20% of a new client's first bill. Booksy charges $29.99 a month plus $20 for every extra master. A salon with five masters pays around 127–187 ₼ a month.
- **Local client apps barely exist.** The few we found (Guzzgu, imic.az) have very few downloads and almost no reviews.

The gap is clear: Baku's salons already moved booking "online", but into messengers. The client side — one place to see and book free times across the city — is empty.

## 3. Our solution

One app that shows every free time in the city on one map, and lets the client book it directly.

For **clients**:
- Live free times across Baku, for the service they want, sorted by time, price or distance.
- A map with filters: price range, rating, distance, women-only salons, masters who speak English.
- Side-by-side comparison of up to three salons: price for the chosen service, rating, distance and next free time.
- Booking in four steps: services, master (or "any free master"), day, time.
- Reminders 24 hours and 2 hours before the visit, and easy cancellation up to 2 hours before.
- Three languages: Azerbaijani, Russian and English.

For **salons**:
- One flat monthly price. Unlimited masters. No commission on bookings.
- A place on the map and in search, so new clients find them.
- A simple salon panel instead of a heavy CRM.

For **trust**:
- A review can only be left after a real visit: either a completed booking, or a one-time QR code the master shows in the salon.
- Negative reviews stay public; the salon can reply but cannot delete them.

What nobody else offers in Baku, out of the nine tools we checked: city-wide search for free times and side-by-side comparison of salons.

## 4. The product today

This is not a mock-up. The following is built and working.

### 4.1 The mobile app (clients and salons)

The app runs on iPhone, Android and in a web browser, from one codebase. It opens with our own animated logo: steel shears cut a thread and open into the check mark of the logo, a hairdryer, nail polish, a trimmer and a straight razor pass by, and the word "yazılnow" appears.

Client side:
- **Discover:** the nearest free times today, best places nearby, top-rated salons and masters.
- **Find a free time:** pick a service, a day and a time of day; the app shows the earliest free start at every salon.
- **Map:** salons as pins with their rating, filters for price, category, audience.
- **Salon page:** services and prices, masters, reviews, hours, address, call / WhatsApp / directions.
- **Booking:** four steps; the time grid shows only real free slots and refreshes if someone else takes a time first.
- **My bookings:** upcoming and past visits, cancel, book again, leave a review after the visit.
- **Compare:** up to three salons side by side.
- **Follow a master** and save favourite places.
- Account with email and a six-digit code, or Google / Apple sign-in; account deletion as the app stores require.

Salon side (the same app, or any browser as the "salon panel"):
- Register the salon, choose a plan, start a 30-day free trial with no card.
- Services, masters (with their working days and hours), photos, opening hours, salon details.
- Calendar: see bookings, add phone or walk-in bookings, block time off, mark visits done or as no-shows.
- Reviews: read and reply.
- Review QR: a fresh one-time QR for the client in the chair, plus a fixed "wall QR" that only opens the salon's page.
- Click report: how many people viewed the salon page and tapped Book, call, WhatsApp or directions each month.
- Statistics (Pro): bookings, revenue, completed, cancelled and no-shows, new clients, by day, by master, by service, and for all branches together.
- Waitlist (Pro): who is waiting for a time; they get a notification when one frees up.
- Branches (Pro): add locations and switch between them.
- Team (Pro): invite managers by email; they run a location but cannot touch billing, branches or the team.
- Deposits (Pro): set a deposit per service (fixed amount or percentage).
- WhatsApp pack (add-on): booking confirmations and next-day reminders sent to clients on WhatsApp.
- Support: email for everyone, a priority phone line for Pro.

### 4.2 The server

A Laravel server stores accounts, salons, bookings, reviews, payments and plans, and enforces the rules: no double bookings, reviews only after real visits, plan limits, deposit refunds, trial and payment periods, reminders. It has 114 automated tests covering these rules, and all of them pass.

Payments are prepared but not connected yet. There is a switch to turn payments off completely for testing; with it off, nothing can be bought and no deposits are taken.

### 4.3 The admin panel

Our own back office at /admin, protected by a password and a two-factor code: approve or suspend salons, give extra trial days, moderate reported reviews, see users, bookings and payments, and a log of every staff action.

### 4.4 The website

yazilnow.az (not online yet): what the app does, a live map of salons, how it works for salons, plans and prices, sign-up for salons, and a link to the salon panel. It also opens with the logo animation.

### 4.5 Beta test

Five people tested the app on our test server: three clients, one salon owner and one barber. They stay anonymous. Their notes are on slide 6 of the presentation.

## 5. How it works, step by step

**A client books:**
1. Opens yazılnow and sees free times nearby today, or searches for a service and a time.
2. Opens a salon, picks one or more services and a master (or "any free master").
3. Picks a day and a time from the real free slots, and confirms.
4. At a Pro salon that asks for a deposit, pays it by card; the time is held for 15 minutes while they pay.
5. Gets reminders 24 hours and 2 hours before.
6. After the visit, rates it. Or, in the salon, scans the master's one-time QR and rates the salon and the master.

**A salon joins:**
1. Registers with the owner's details and the salon's name, category, district and address, and confirms the email code.
2. Picks a plan and starts the 30-day free trial. No card is needed.
3. Adds services, masters and photos. Our team reviews the salon (usually within a working day or two) and it appears on the map.
4. Runs its day from the calendar; pays after the trial to stay listed. If a payment is missed, the salon stays visible for 7 more days before leaving search; existing bookings are never cancelled.

## 6. Business model

We charge salons a flat monthly fee. We never take a commission on bookings and never charge per master.

| Plan | Price a month | What it includes |
| --- | --- | --- |
| **Sadə** | 10 ₼ | A place on the map and in search, QR reviews and replies, photo gallery, a "Book" button that sends clients to the salon's own page (DIKIDI, WhatsApp or phone), monthly click report |
| **Start** | 29 ₼ | Everything in Sadə, plus online booking and calendar, unlimited masters, reminders for clients |
| **Pro** (recommended) | 49 ₼ | Everything in Start, plus 3 branches included (+15 ₼ for each extra), combined reports, manager roles, deposits and no-show protection, waitlist, statistics, priority phone support |

- The first 30 days are free on every plan, with no card.
- Paying for a year costs 10 months: 100, 290 or 490 ₼.
- Add-on for Start and Pro: a WhatsApp pack, 10 ₼ for about 300 messages, valid 30 days.
- Deposits (Pro): the salon chooses a fixed amount or a percentage per service. The client pays when booking. It is refunded if they cancel 2 or more hours before, kept by the salon on a no-show, and counted toward the bill when they come. A client with two no-shows must pay a deposit at every salon that takes deposits.

Compared with the alternatives: a salon with five masters pays about 187 ₼ a month on Booksy and about 127 ₼ plus 20% of new clients on Fresha. On yazılnow it pays 29 ₼ (Start) or 49 ₼ (Pro).

## 7. Market

- **Where:** Baku first, a city of about 2.3 million people (State Statistics Committee of Azerbaijan).
- **Salons:** barbershops, hair and beauty salons, nail and brow studios, spa and makeup — from one-chair barbers to chains with several branches.
- **Clients:** people who book by DM today; and visitors and foreigners, who need English and clear prices up front.
- **Trend:** booking has already moved online in Baku, but into messengers. Salons have tools for themselves; clients have nothing.

There is no public count of how many salons Baku has. A next research step is to count the booking links of 100 salons on Instagram and Google (DIKIDI, Arnica, Rezneed, Altegio, WhatsApp or none) to turn our estimate into a measured number.

## 8. What makes us different

1. **Built for the client, not only the salon.** Every competitor in Baku sells software to one salon. We show the whole city.
2. **City-wide free-time search and side-by-side comparison** — neither exists in the tools we checked.
3. **Fair, simple pricing.** Flat monthly price, unlimited masters, no commission.
4. **Trust.** Reviews only after real visits, one-time QR codes, reviews that can't be deleted.
5. **Made for Baku.** Azerbaijani first, then Russian and English; women-only salons; English-speaking masters for visitors; prices in manat.
6. **A low first step.** Salons that already use another booking system can start on Sadə for 10 ₼ and keep their own booking link.

## 9. What's next

1. **Connect a payment provider** (an Azerbaijani card acquirer) so plans, deposits and the WhatsApp pack can be paid.
2. **Host the server and go live on yazilnow.az**, and publish the app on the App Store and Google Play.
3. **Sign the first founding salons** — 20 to 30 in Baku — and help them set up.
4. Replace the demo salons in the app with real ones; measure the market with the 100-salon count.
5. Later ideas we have researched: a short video feed of masters' work ("book this look"), a hair passport with notes from each visit, a live queue for walk-in barbershops, group bookings, home-visit masters.

## 10. Honest status

- The app, server, salon panel, admin panel and website are built and work together, tested end to end on our machines.
- Nothing is public yet: no hosting, no domain, no payment provider. The yazilnow.az address and support@yazilnow.az email are planned, not live.
- The salons you see in the demo are sample data, not real partners.
- Payments are switched off for testing.

## 11. Links and files

- Presentation (web, with animations): https://claude.ai/artifact/9KvCGNjkhVNPdnNCk2EJrJ
- Presentation files: `deck/export/` — PDF, picture PowerPoint and editable PowerPoint
- Speech for the presentation: `deck/speech.md`
- Source code: the `claude/usta-booking-app` branch of the project repository
- Market research: "Usta — Məhsul planı və bazar araşdırması" (October 2026)
