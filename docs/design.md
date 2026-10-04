# Usta design system

The source of truth is `src/theme/tokens.ts`. This page explains the decisions behind it.

## Principles

1. **A local product, not a template.** Linen, white cards, ink actions, one brand colour. No serif-italic "luxury" display type, no gradients on UI, no glassy blobs, no emoji.
2. **Content is the decoration.** Times, prices and ratings are set big and plain. Venues get photos (or a quiet tonal cover), not illustrations.
3. **Motion explains, never performs.** Every animation has a named purpose: feedback, spatial consistency, state, or (rarely) delight.
4. **Azerbaijani first.** Every string is written for AZ, RU and EN. The type covers ə, ğ, ı, ş, ç, ö, ü, Cyrillic and ₼.

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#F3EFE8` | `#0F0E0D` | Screen background (linen) |
| `surface` | `#FFFFFF` | `#1A1816` | Cards, inputs, chips |
| `sunken` | `#EAE5DC` | `#25221F` | Tracks, placeholders |
| `ink` | `#141210` | `#F4F0EA` | Primary text, stars |
| `inkSoft` | `#5B554C` | `#B3AB9F` | Secondary text |
| `inkMuted` | `#6A6359` | `#958D82` | Labels, placeholders |
| `primary` | ink | ink (dark) | Primary buttons, selected chips, days and slots |
| `accent` | `#B4233C` | `#F2697B` | *Nar* (pomegranate) red: brand moments, favourites, destructive |
| `success` | `#276F44` | `#6FC394` | Free slots, open now, verified visit |
| `line` / `lineStrong` | `#E3DDD3` / `#D2CBBF` | `#2B2724` / `#3A3531` | Hairlines, outlines |

Every text tone passes WCAG AA on `bg`, `surface` and `sunken` (measured). Fallback cover tones (oxblood, forest, navy, clay, olive, sand, slate, rose…) are muted and photographic.

## Type

One family: **Onest** (400 / 500 / 600 / 700).

| Variant | Weight | Size / line | Notes |
| --- | --- | --- | --- |
| `largeTitle` | Bold | 30 / 36, −0.7 | Screen titles |
| `title` | Bold | 22 / 28 | Section titles, big times |
| `headline` | SemiBold | 17 / 22 | Card titles |
| `body` / `bodyStrong` | Regular / SemiBold | 15 / 22 | |
| `callout` / `subhead` | Medium / Regular | 14 / 19 | |
| `caption` / `captionStrong` | Regular / Medium | 13 / 17 | Metadata |
| `micro` | SemiBold | 11 / 14 | Weekday and month labels |
| `price` | SemiBold, tabular | 16 / 20 | Prices |
| `stat` | Bold | 26 / 30 | Profile numbers |

Large sizes cap Dynamic Type scaling at 1.25–1.3×; body text scales freely.

## Logo

Lowercase **usta** in Onest Bold, sliced at 62% of its height. The top half is shifted right by about 5% of the font size, like a scissor cut. In the splash and promo, the cut happens on screen as the shears close. Component: `src/components/ui/Wordmark.tsx`.

## Shears

A 3D scene (`tools/shears/scene.html`, three.js):

- polished blades, satin handles, an offset ring with a rubber insert, a finger rest and a slotted pivot screw
- a dark studio environment with an overhead softbox, a strip light and a warm linen bounce
- a soft contact shadow

It renders 13 frames from shut to 30° open (`assets/splash/shears-00…12.webp`). The app icon and the Android adaptive icons are composed from the 20° frame; the native splash uses frame 0.

## Space, shape and touch

- 4pt rhythm and a 20pt screen gutter.
- Radii: 6, 10 (thumbs), 14 (cells, buttons), 18 (cards), 24, pill (chips).
- Every control has a 44pt minimum hit area; smaller visuals get `hitSlop`.
- Pressables never nest. A card with its own button is a plain view holding two siblings.

## Motion

| Moment | Tool | Timing |
| --- | --- | --- |
| Press feedback (all pressables) | Reanimated CSS transition | scale 0.97, 120 ms, `out` |
| Chip, slot, day selection | CSS transition (colour) | 180 ms, `out` |
| Segmented indicator | `withTiming` | 240 ms, `inOut` |
| Tab switch | none | instant (tabs are peers) |
| Booking steps | `FadeInRight` / `FadeOutLeft` (reversed going back) | 240 ms in / 180 ms out |
| Venue hero | scroll-linked parallax on the UI thread | |
| Success mark | SVG stroke draw | ring 520 ms, tick 320 ms |
| Launch | 13-frame shears snip, wordmark cut, lift away | about 1.8 s once per cold start (tap to skip) |

Curves: `out = (0.23, 1, 0.32, 1)`, `inOut = (0.77, 0, 0.175, 1)`, `drawer = (0.32, 0.72, 0, 1)`. Never ease-in on UI. The only exception is the shears' closing stroke, which accelerates the way blades do.

**Reduced motion:** no parallax, no snipping, no slides. Steps and the launch crossfade instead.

**Haptics:** a selection tick on chips, days, slots, tabs and star changes; a light impact on primary buttons; a success notification on booking and posting a review. Never on scroll, and never on an entrance the user didn't cause.
