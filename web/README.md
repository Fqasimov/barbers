# yazılnow website

The public site for the domain: the landing page, the business sign-up, the partner map and live figures, plus `/privacy`, `/terms`, `/help` and `/billing/return`.

It uses the same stack as the app and the promo: **React 19 + TypeScript**, built with Vite. **Remotion's Player** runs the opening and the phone showreel in the hero, and **Leaflet** draws the map. Colours, type (Onest) and motion curves are the app's (`src/theme/tokens.ts`).

## Run it

```bash
cd web
npm install
npm run dev        # http://localhost:4173, with sample data (localhost is demo mode)
npm run build      # type-checks, then writes dist/
npm run preview    # serves dist/
npm run pages      # rebuilds public/privacy, terms, help and data/demo.json from docs/ (output is committed)
```

## Deploy

Use `DOMAIN=yazilnow.az deploy/build.sh` from the repository root. It builds this site together with the app-in-a-browser and writes `config.js` and `.htaccess` for the domain. The full guide is in [docs/deploy.md](../docs/deploy.md).

`config.js` stays editable on the server; no rebuild is needed:
- `apiUrl`: the API, e.g. `https://api.yazilnow.az`
- `appUrl`: the app in a browser, e.g. `https://app.yazilnow.az`. The "Salon panel" button opens `<appUrl>/panel`, and `/r/…`, `/s/…`, `/salon/…` links are sent there.
- `appStoreUrl`, `playStoreUrl`: until set, the buttons read "Coming soon"
- `supportEmail`
- `company`: the legal name, VÖEN and address shown in the footer

The site has no inline scripts, so it runs under the strict Content-Security-Policy in `deploy/nginx` and `deploy/apache`. Keep it that way: new scripts go in files.

## What talks to the API

| Part | Call | Without `apiUrl` |
| --- | --- | --- |
| Figures | `GET /api/stats` | placeholders ("figures coming soon") |
| Map | `GET /api/salons`, and `GET /api/salons/{id}/reviews` on hover | empty state |
| Plan prices | `GET /api/plans` | the prices in `src/i18n.ts` |
| Sign-up | `POST /api/business/register` → `/auth/email/verify` → `/business/subscription/trial`, then `/auth/logout` | demo: nothing is sent |

**Sample data shows only in demo mode:** on `localhost`, with `?demo` in the address, or with `demo: true` in `config.js`. A live domain without an API shows empty states, never made-up salons.

## Notes

- **Remotion licence.** Remotion is free for individuals and companies with up to 3 employees. Larger companies need a company licence (remotion.pro). The promo already uses it.
- **Map tiles.** The site uses OpenStreetMap's own tiles: free, no key, attribution required, meant for light traffic. (CARTO's basemaps, used before, now need an API key and show "API KEY REQUIRED" without one.) For heavy traffic switch to a keyed provider (MapTiler, Mapbox, Stadia) in `config.js` → `tiles`.
- **The opening** plays once per browser tab session. It never plays with reduced motion, can be skipped (button or Escape), and a timer guarantees it never stays on screen. The composition is in `src/remotion/Intro.tsx`.
- **The hero's phone** plays the promo's recordings of the real app. They're H.264 MP4, with a VP9 WebM fallback for browsers without H.264, and play only while visible.
- **Texts** live in `src/i18n.ts` (AZ, RU, EN). A native speaker should read the AZ and RU copy before launch.
