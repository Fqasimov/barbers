import { config, page } from './config';

/** The website's pages. Each has its own address; the server serves the same index.html for all. */
export type Route = 'home' | 'pricing' | 'register';

const path = location.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
export const route: Route = path.endsWith('/pricing') ? 'pricing' : path.endsWith('/register') ? 'register' : 'home';

/** Links between the pages (work from a sub-folder preview too). */
export const href = {
  home: (hash = '') => `${import.meta.env.BASE_URL}${hash}`,
  pricing: () => page('pricing'),
  /** Sign-up happens in the salon panel (yazilnow.az/app/panel); a picked plan carries on there. */
  register: (plan?: string) => `${config.panelUrl}${plan ? `?plan=${encodeURIComponent(plan)}` : ''}`,
};
