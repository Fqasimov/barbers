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

1. Run `npm run build` and upload `dist/` to the web root of `https://<domain>`. Any static host works (nginx, Apache, Cloudflare Pages, Netlify). There are no server routes.
2. Edit `dist/config.js` on the server; no rebuild is needed:
   - `apiUrl`: the API, e.g. `https://api.<domain>`
   - `appStoreUrl`, `playStoreUrl`: until set, the buttons read "Coming soon"
   - `supportEmail`
   - `company`: the legal name, VÖEN and address shown in the footer
3. On the API, add the site's origin to `CORS_ALLOWED_ORIGINS` in `backend/.env`, e.g. `https://<domain>,https://www.<domain>`.
4. Make sure `/billing/return/` is reachable. The payment provider sends salons there after checkout, and the page hands them back to the app (`usta://billing/return`; the scheme changes when the app itself is renamed).

Directory URLs (`/privacy/`, `/terms/`, `/help/`, `/billing/return/`) need the host to serve `index.html` inside a folder; every common static host does this by default.

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
- **Map tiles.** The site uses CARTO's free basemaps, which require attribution and are meant for light traffic. For real traffic, switch to a keyed provider (MapTiler or Mapbox) in `config.js` → `tiles`.
- **The opening** plays once per browser tab session. It never plays with reduced motion, can be skipped (button or Escape), and a timer guarantees it never stays on screen. The composition is in `src/remotion/Intro.tsx`.
- **The hero's phone** plays the promo's recordings of the real app. They're H.264 MP4, with a VP9 WebM fallback for browsers without H.264, and play only while visible.
- **Texts** live in `src/i18n.ts` (AZ, RU, EN). A native speaker should read the AZ and RU copy before launch.
