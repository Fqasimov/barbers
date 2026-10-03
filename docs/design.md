# Usta design system

The source of truth is `src/theme/tokens.ts`. This page explains the decisions behind it.

## Principles

1. **Editorial, not glossy.** Paper, ink and one bronze accent. Hairline rules instead of heavy cards. Serif display type sets the tone; sans and mono carry the UI.
2. **Content is the decoration.** Venue covers are typographic art: tone, motif, arch and monogram. No gradients on UI, no glassy blobs, no emoji.
3. **Motion explains, never performs.** Every animation has a named purpose: feedback, spatial consistency, state, or (rarely) delight.

## Colour

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `bg` | `#F3EFE8` | `#0E0D0B` | Screen background |
| `surface` | `#FBF9F5` | `#181614` | Cards, inputs |
| `sunken` | `#EAE5DC` | `#0A0908` | Tracks, tags |
| `ink` | `#17140F` | `#F2ECE3` | Primary text (≥ 16:1) |
| `inkSoft` | `#5C554B` | `#ABA295` | Secondary text (≥ 6.4:1) |
| `inkMuted` | `#6B645A` | `#918A7E` | Labels, placeholders (≥ 4.6:1) |
| `accent` | `#8A5A22` | `#CFA772` | Stars, best match, "usta." (≥ 5.1:1) |
| `primary` | ink | bone | Primary buttons, selected chips and slots |
| `line` / `lineStrong` | `#E1DBD0` / `#CFC7BA` | `#2A2622` / `#3A3530` | Hairlines, outlines |

Venue cover tones: oxblood, forest, navy, clay, olive, sand, slate, rose, ink and bone. All are muted, and each comes with its own foreground colour for the monogram.

## Type

| Variant | Font | Size / line | Notes |
| --- | --- | --- | --- |
| `hero` | Newsreader Light | 44 / 46 | Greeting, success |
| `display` | Newsreader Light | 36 / 40 | Screen titles |
| `title` | Newsreader | 28 / 32 | Section titles |
| `headline` | Newsreader | 21 / 26 | Card titles |
| `serif` | Newsreader | 17 / 22 | Names in lists |
| `price` | Newsreader Medium | 17 / 22 | Always used for ₼ (Geist has no manat glyph) |
| `body` | Geist | 15 / 22 | |
| `caption` | Geist | 13 / 18 | Metadata |
| `label` | Geist Mono Medium | 11, +1.2 tracking, uppercase | Overlines |
| `mono` | Geist Mono | 12 / 16 | Times, distances, counts |

Display sizes cap Dynamic Type scaling at 1.2–1.3× so hero lines never break the layout. Body text scales freely.

## Space, shape and touch

- 4pt rhythm (`xs 4 … huge 48`), 20pt screen gutter.
- Radii: 10 (thumbs), 14 (cells), 18 (cards), pill (buttons, chips).
- Every control has a 44pt minimum hit area; smaller visuals get `hitSlop`.

## Motion

| Moment | Tool | Timing |
| --- | --- | --- |
| Press feedback (all pressables) | Reanimated CSS transition | scale 0.97, 120 ms, `out` |
| Chip, slot, day selection | CSS transition (colour) | 180 ms, `out` |
| Tab bar / segmented indicator | `withTiming` (absolute, childless pill) | 240 ms, `inOut` |
| Tab switch | none | instant (tabs are peers) |
| Venue tab content | layout `FadeIn` | 140 ms |
| Booking steps | `FadeInRight` / `FadeOutLeft` (reversed going back) | 240 ms in / 180 ms out |
| Toast | `FadeInUp` / `FadeOutUp` | 280 / 220 ms |
| Venue hero | scroll-linked parallax on the UI thread | drift 0.45×, stretch on pull |
| Map camera | `animateCamera` / `withTiming` | 450 ms, `inOut` |
| Success mark | SVG stroke draw | ring 520 ms, tick 320 ms (+300 ms) |
| Launch | snip loop, cut, part | about 2.6 s once per cold start (tap to skip) |

Curves: `out = (0.23, 1, 0.32, 1)`, `inOut = (0.77, 0, 0.175, 1)`, `drawer = (0.32, 0.72, 0, 1)`. Never ease-in.

**Reduced motion:** no parallax, no snipping, no slides. Steps and the launch crossfade instead, and indicators jump.

**Haptics:** a selection tick on chips, days, slots, tabs and star changes; a light impact on primary buttons; a success notification on booking and posting a review. Never on scroll, and never on an entrance the user didn't cause.
