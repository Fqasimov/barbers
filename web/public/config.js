// Site settings. Edit these on the server; no rebuild needed.
window.USTA_CONFIG = {
  // The Laravel API, without /api, e.g. 'https://api.yazilnow.az'.
  // The API must allow this site's origin: CORS_ALLOWED_ORIGINS in backend/.env.
  // Empty: the map and figures show empty states (sample data only on localhost or with ?demo).
  apiUrl: '',

  // The app in a browser: the salon panel, QR review links (/r/…) and salon pages (/s/…, /salon/…).
  // e.g. 'https://app.yazilnow.az'. The "Salon panel" button opens <appUrl>/panel.
  appUrl: '',

  // Store pages. Empty: the buttons say "Coming soon".
  appStoreUrl: '',
  playStoreUrl: '',

  supportEmail: 'support@yazilnow.az',
  // Shown in the footer once filled in.
  company: { name: '', voen: '', address: '' },

  // Map tiles. OpenStreetMap's own tiles are free and need no key (CARTO's basemaps now require one).
  // For heavy traffic use a keyed provider (MapTiler, Mapbox, Stadia).
  tiles: {
    light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};
