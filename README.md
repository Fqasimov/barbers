# Usta

**Book the hands you trust.** A booking app for barbershops, beauty salons, nail studios, brow bars, spas and makeup artists in Baku. *Usta* is Azerbaijani for a master of a craft.

Built with Expo (SDK 57), React Native 0.86, Expo Router, Reanimated 4 and Gesture Handler. Runs on iOS, Android and the web.

## What it does

| | |
| --- | --- |
| **Book in four steps** | Choose services (multi-select), choose a master or *any available*, pick a day in the next 7 days and a free time, then confirm. Durations add up, and only masters who do every chosen service are offered. |
| **Real availability** | Each master has their own working days and shift, clipped to the venue's hours. Existing appointments and your own bookings block slots, same-day slots respect a 30-minute lead time, and every master shows their *next free* slot. |
| **Reviews** | Read reviews with a rating breakdown and star filters. Write one with a drag-to-scrub star input, the master who looked after you, and tags. Ratings update live. |
| **Highest rated** | A Top Rated list ranked by a Bayesian-weighted rating, so a few perfect reviews can't beat hundreds of consistent ones. Filter it by category. |
| **Map** | Pins show each venue's rating. **Best match** ranks the nearest highly rated place within your **price range** (₼ / ₼₼ / ₼₼₼); you can also sort by Nearest or Top rated. A card carousel stays in sync with the pins. |
| **Bookings** | Upcoming and past visits: cancel (frees the slot), get directions, rate a past visit, or rebook with the same master. |
| **Profile** | Saved places, your name for reviews, and System / Light / Dark appearance. |

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

**Maps.** iOS uses Apple Maps with no setup. For an Android **release** build, add a Google Maps API key ([react-native-maps setup](https://github.com/react-native-maps/react-native-maps/blob/master/docs/installation.md)). Expo Go works as-is. On the web, the map is an illustrated vector map of Baku (shoreline, districts, pins) with drag-to-pan and a camera that follows your selection.

**Location.** Uses the device location when allowed. Outside Baku, or with location off, distances are measured from Fountain Square, because the venue catalogue is Baku-only.

## Design

The direction is **editorial and warm, not "AI glossy"**: paper and ink, one bronze accent, serif display type and hairline rules. There are no gradients on UI and no emoji icons. Full spec: [`docs/design.md`](docs/design.md).

- **Type.** *Newsreader* for display and prices, chosen because it covers the full Azerbaijani alphabet (**ə, Ə**) and the manat sign **₼**, unlike Instrument Serif and Playfair. *Geist* for UI text, *Geist Mono* for labels and times.
- **Colour.** Warm paper `#F3EFE8`, ink `#17140F` and bronze `#8A5A22`, with a matching dark theme. Every text tone passes WCAG AA, measured.
- **Venue covers.** Art-directed vector covers instead of stock photos: a deep tone, a fine motif (barber stripes, arcs, grid, waves, rays, dots) and an arch framing a serif monogram. `Salon.imageUrl` switches a venue to a real photo.
- **Launch.** Brass scissors snip open and shut while the app hydrates, make one decisive cut, a hairline shoots across the screen, and the ink sheet parts along the cut to reveal the app. The native splash is pixel-identical to the first frame, so the hand-off is seamless.

### Sources

- **UI/UX Pro Max.** Its design-system search supplied the *Luxury/Premium: warm black + gold accent* palette family, the serif + sans + mono type stack, and the pre-delivery checklist (44pt targets, safe areas, AA contrast, reduced motion, no emoji icons). Its default beauty palette (pink and lavender) was rejected because it reads as generic AI.
- **Emil Kowalski (`emil-design-eng`, `animate-expo`).** Motion follows his rules:
  - custom curves only (`cubic-bezier(0.23, 1, 0.32, 1)` out, `(0.77, 0, 0.175, 1)` in-out) and never ease-in
  - 0.97 press scale in 120 ms on every pressable
  - nothing appears from `scale(0)`
  - tabs switch instantly; only the indicator glides
  - exits run about 20% faster than entries
  - springs only where a finger is involved
  - haptics once per user action, never on an entrance the user didn't cause
  - all motion on the UI thread
  - reduced motion means gentler motion: fades stay, movement goes
- **Remotion.** The launch and success animations are choreographed the Remotion way: explicit keyframe ranges and interpolation with strong bézier easing, sequenced like a timeline. [`promo/`](promo) contains a Remotion composition that renders the brand intro as a video.

## Project structure

```
src/
  app/                 Expo Router routes
    (tabs)/            Discover · Map · Bookings · Profile (custom floating tab bar)
    salon/[id].tsx     Venue: parallax cover, services, masters, reviews, about
    book/[id].tsx      Booking flow (modal)
    review/[id].tsx    Write a review (modal)
    reviews/[id].tsx   All reviews
    top-rated.tsx      Leaderboard
    search.tsx         Search (accent-insensitive: "kesim" finds "Kəsim")
  components/          UI kit, splash, map (native + web), booking pieces
  data/                Seed catalogue, availability engine, ranking
  store/               Zustand store persisted with AsyncStorage
  theme/               Tokens (colour, type, space, motion) + theme provider
  __tests__/           Unit tests
```

## Next steps

The data layer is local: 15 fictional venues across Baku, with bookings and reviews persisted on the device. To go live, back `data/` with an API (for example Supabase: `salons`, `masters`, `services`, `appointments`, `reviews`). Then move availability onto the server so two people can't book the same slot, add sign-in, and send push reminders.
