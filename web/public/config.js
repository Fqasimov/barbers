// Site settings. Edit these on the server; no rebuild needed.
window.USTA_CONFIG = {
  // The Laravel API, without /api, e.g. 'https://api.yazilnow.az'.
  // The API must allow this site's origin: CORS_ALLOWED_ORIGINS in backend/.env.
  // Empty: the map and figures show empty states (sample data only on localhost or with ?demo).
  apiUrl: '',

  // Store pages. Empty: the buttons say "Coming soon".
  appStoreUrl: '',
  playStoreUrl: '',

  supportEmail: 'support@yazilnow.az',
  // Shown in the footer once filled in.
  company: { name: '', voen: '', address: '' },

  // Map tiles. CARTO's free basemaps need attribution; for heavy traffic use a keyed provider (MapTiler, Mapbox).
  tiles: {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};
