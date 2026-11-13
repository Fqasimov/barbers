/** Settings from /config.js, editable on the server without a rebuild. */
export type SiteConfig = {
  apiUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  supportEmail: string;
  company: { name: string; voen: string; address: string };
  /** Raster tiles; leave light empty to draw the bundled Baku coastline instead (offline previews). */
  tiles: { light: string; dark: string; attribution: string };
  /** The app in a browser (salon panel, QR reviews, salon pages), e.g. https://app.yazilnow.az. */
  appUrl?: string;
  /** The salon panel. Default: <appUrl>/panel, else /panel on this site. */
  panelUrl?: string;
  /** Show sample salons and figures. Defaults to on for localhost and ?demo, off elsewhere. */
  demo?: boolean;
};

declare global {
  interface Window {
    USTA_CONFIG?: Partial<SiteConfig>;
  }
}

const raw = window.USTA_CONFIG ?? {};

export const config: SiteConfig = {
  apiUrl: (raw.apiUrl ?? '').replace(/\/+$/, ''),
  appStoreUrl: raw.appStoreUrl ?? '',
  playStoreUrl: raw.playStoreUrl ?? '',
  supportEmail: raw.supportEmail ?? 'support@yazilnow.az',
  appUrl: (raw.appUrl ?? '').replace(/\/+$/, ''),
  panelUrl: raw.panelUrl || (raw.appUrl ? `${raw.appUrl.replace(/\/+$/, '')}/panel` : '/panel'),
  company: { name: '', voen: '', address: '', ...raw.company },
  tiles: {
    // OpenStreetMap's own tiles: free, no key (CARTO's basemaps now need one). For heavy traffic use a keyed provider.
    light: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    dark: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    ...raw.tiles,
  },
};

export const isLive = !!config.apiUrl;

/** A file shipped with the site, relative to where it's served (Vite's `base`). */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
/** A text page (privacy, terms, help). Some hosts don't serve a folder's index.html, so builds can ask for the file. */
export const page = (name: string) =>
  `${import.meta.env.BASE_URL}${name}/${import.meta.env.VITE_PAGE_INDEX ? 'index.html' : ''}`;

const localHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
/**
 * Sample data only where it can't be mistaken for the real thing: local previews,
 * ?demo in the address, or demo: true in config.js. A live site without an API
 * shows empty states instead of made-up salons.
 */
export const isDemo = !isLive && (raw.demo ?? (localHost || new URLSearchParams(location.search).has('demo')));
