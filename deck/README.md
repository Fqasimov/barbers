# yazılnow — pitch deck

Group Project 1 (Introduction to Entrepreneurship), following the Sabah guide:
Introduction → Problem → Solution → Product → Market → Team, plus beta test,
business model and where we are. A 1920 × 1080 web deck, scaled to any screen.

```console
npm install
npm run dev          # http://localhost:4180
BASE=./ npm run build   # dist/ works from any folder (a USB stick, a preview link)
```

**Keys:** → / Space / click right half: next · ← / click left half: back ·
Home / End · F: full screen. The URL keeps the slide (`#4`).

## Editing

- **Words and numbers:** `src/content.ts`. Every line on every slide is there.
  `TODO` marks what is yours to fill: team names and bios, and the five
  testers’ real notes (keep them anonymous: number and role only).
- **Order of slides:** `src/slides/index.ts`.
- **One slide’s layout:** `src/slides/<Name>.tsx`; styles in `src/styles.css`
  (colours at the top: linen, ink, burgundy, silver).
- **App screens:** `public/screens/*.jpg` (390 × 844 pt, 2×). Screen recordings:
  `public/video/*.mp4` and `.webm`. Replace a file with the same name to update it.

## Motion

- The opening is the app’s own launch animation (`src/remotion/Intro.tsx`, the
  same Remotion composition as the app and the website), played with Remotion’s
  Player, then the title rises in.
- The problem slide plays a DM conversation (`src/remotion/Chat.tsx`).
- Everything else enters with one curve: `cubic-bezier(0.23, 1, 0.32, 1)`,
  staggered 70 ms. Reduced motion turns entrances off.

## Sources

Market figures come from our research doc “Usta — Məhsul planı və bazar
araşdırması” (Oct 2026): DIKIDI, Arnica, Rezneed, Altegio, YCLIENTS, Fresha
(CostBench), Booksy (Koalendar), and a field check of 37 top-rated Baku salons.
Prices, plans and features are the app’s own.
