# Usta

**Book the hands you trust.** A booking app for barbershops, beauty salons, nail studios, brow bars, spas and makeup artists in Baku. *Usta* is Azerbaijani for a master of a craft.

Built with Expo (SDK 57), React Native 0.86, Expo Router, Reanimated 4 and Gesture Handler. Runs on iOS, Android and the web, in **Azerbaijani, Russian and English**.

## What it does

| | |
| --- | --- |
| **Book in four steps** | Choose services (multi-select), choose a master or *any available*, pick a day in the next 7 days and a free time, then confirm. Durations add up, and only masters who do every chosen service are offered. |
| **Find a free slot** | Search the whole city by service, day and time window (morning / afternoon / evening), filtered by price, women-only venues and English-speaking masters. Sort by earliest, cheapest, nearest or rating. One tap books the exact slot. |
| **Compare** | Put up to three venues side by side for one service: price, rating, distance, next free slot, today's hours and number of masters, with the best value in each row marked. |
| **Real availability** | Each master has their own working days and shift, clipped to the venue's hours. Existing appointments and your own bookings block slots, same-day slots respect a 30-minute lead time, and every master shows their *next free* slot. |
| **Verified reviews** | You can only review a visit you actually booked and completed, once. Reviews carry a *verified visit* badge, the master and tags. Ratings update live. |
| **Highest rated** | A Top Rated list ranked by a Bayesian-weighted rating, so a few perfect reviews can't beat hundreds of consistent ones. Filter it by category. |
| **Map** | Pins show each venue's rating. **Best match** ranks the nearest highly rated place within your **price range** (₼ / ₼₼ / ₼₼₼); you can also sort by Nearest or Top rated. |
| **Bookings** | Upcoming and past visits: message the venue on WhatsApp, get directions, cancel (frees the slot), rate a past visit, or rebook with the same master. |
| **Profile** | Masters you follow (with their next free slot), saved places, your name for reviews, language (System / AZ / RU / EN) and appearance. |

## Run it

```bash
npm install
npx expo start          # press i / a, or scan the QR code with Expo Go
npx expo start --web    # browser preview
```

```bash
npm test                # availability + ranking unit tests (jest-expo)
npm run typecheck
npm run lint
```

**Maps.** iOS uses Apple Maps with no setup. For an Android **release** build, add a Google Maps API key ([react-native-maps setup](https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md)). Expo Go works as-is. On the web, the map is an illustrated vector map of Baku.

**Location.** Uses the device location when allowed. Outside Baku, or with location off, distances are measured from Fountain Square, because the venue catalogue is Baku-only.

**Language.** Follows the device language (Azerbaijani when it's none of the three) until you pick one in Profile. All copy lives in `src/i18n/strings.ts`; plurals, dates, prices (`30 ₼`, `30 ₼-dan`) and decimals (`4,9`) are formatted per language in `src/i18n/index.ts`.

## Design

Linen and ink, one pomegranate-red brand colour, a single sans-serif family and nothing ornamental. It's built to look like a well-made local product, not a template. Full spec: [`docs/design.md`](docs/design.md).

- **Type.** *Onest*, a neo-grotesk with real Azerbaijani (ə, Ə, ğ, ı, ş), Cyrillic and manat (₼) support. It was chosen after rendering specimens; most popular display faces fail on ə or ₼.
- **Colour.** Linen `#F3EFE8`, white cards, ink `#141210` for actions, and *nar* red `#B4233C` used sparingly (the brand and favourites). It has a matching dark theme, and every text tone passes WCAG AA.
- **Logo.** Lowercase **usta**, cut once horizontally, with the top half slipped sideways, like a scissor cut you notice the second time you look.
- **Shears.** The splash, app icon and promo use the same pair of 3D-rendered steel barber shears: polished blades, satin handles, a finger rest and a slotted pivot screw, lit by a studio softbox with a real contact shadow. They are rendered as 13 frames from shut to 30° open (`tools/shears`), so the snip is a real object moving rather than a vector icon.
- **Launch.** On linen, the shears snip while the app hydrates. On the last snip the wordmark is cut, then everything lifts away. The native splash is the first frame, so the hand-off is seamless.
- **Venue photos.** `src/data/photos.ts` maps a venue id to a photo in `assets/salons/`. Until a venue has one, it gets a quiet tonal cover with its initials.

## Promo video

[`promo/`](promo) is a Remotion project that renders a 9:16 promo from **real recordings of the app**, captured frame by frame with real animations, real taps and real data, and shown in a titanium phone on linen with film grain. See [`promo/README.md`](promo/README.md).

## Project structure

```
src/
  app/                 Expo Router routes
    (tabs)/            Discover · Map · Bookings · Profile
    salon/[id].tsx     Venue: photo hero, services, masters, reviews, about
    book/[id].tsx      Booking flow (modal); accepts services/master/date/time to jump to a slot
    find.tsx           Find a free slot across the city
    compare.tsx        Side-by-side compare
    review/[id].tsx    Write a review (only for a completed booking)
    reviews/[id].tsx   All reviews
    top-rated.tsx      Leaderboard
    search.tsx         Search in any language (accent-insensitive: "kesim" finds "Kəsim")
  components/          UI kit, splash, map (native + web), booking pieces
  data/                Seed catalogue, availability engine, slot finder, ranking
  i18n/                AZ / RU / EN strings, calendars, plurals, formatters
  store/               Zustand store persisted with AsyncStorage
  theme/               Tokens (colour, type, space, motion) + theme provider
  __tests__/           Unit tests
tools/shears/          three.js scene that renders the shears frames and icon art
promo/                 Remotion promo + the app recorder
```

## Next steps

The data layer is local: 15 fictional venues across Baku, with bookings and reviews persisted on the device. A demo past visit is seeded so the review flow can be tried straight away. To go live:

1. Back `data/` with an API (for example Supabase: `salons`, `masters`, `services`, `appointments`, `reviews`).
2. Move availability onto the server, so two people can't book the same slot.
3. Add phone sign-in, and send venue confirmation over WhatsApp.
4. Add push reminders and no-show protection.
5. Shoot real venue photos.
