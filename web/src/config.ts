/** Settings from /config.js, editable on the server without a rebuild. */
export type SiteConfig = {
  apiUrl: string;
  appStoreUrl: string;
  playStoreUrl: string;
  supportEmail: string;
  company: { name: string; voen: string; address: string };
  tiles: { light: string; dark: string; attribution: string };
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
  supportEmail: raw.supportEmail ?? 'support@ustatap.az',
  company: { name: '', voen: '', address: '', ...raw.company },
  tiles: {
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    ...raw.tiles,
  },
};

export const isLive = !!config.apiUrl;

const localHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
/**
 * Sample data only where it can't be mistaken for the real thing: local previews,
 * ?demo in the address, or demo: true in config.js. A live site without an API
 * shows empty states instead of made-up salons.
 */
export const isDemo = !isLive && (raw.demo ?? (localHost || new URLSearchParams(location.search).has('demo')));
