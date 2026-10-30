import type { ReactNode } from 'react';

import { asset, config } from '../config';
import { useI18n } from '../lang';

/** The logo: the steel shears opened into a check mark, and "yazılnow". */
export function Lockup({ size = 'md', tone = 'ink' }: { size?: 'sm' | 'md' | 'lg'; tone?: 'ink' | 'light' }) {
  return (
    <span
      className={`lockup lockup-${size}${tone === 'light' ? ' lockup-light' : ''}`}
      role="img"
      aria-label="yazılnow"
    >
      <img src={asset('tools/mark.webp')} alt="" width={64} height={64} />
      <span aria-hidden="true">yazılnow</span>
    </span>
  );
}

const Apple = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.18-1.73-1.35-.14-2.65.8-3.34.8-.7 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.75 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.71.71 2.88.69 1.19-.02 1.94-1.08 2.66-2.14.84-1.23 1.19-2.42 1.2-2.48-.03-.01-2.3-.88-2.32-3.54zM14.2 6.13c.6-.74 1.01-1.75.9-2.77-.87.04-1.94.59-2.57 1.32-.56.64-1.05 1.68-.92 2.68.98.07 1.97-.49 2.59-1.23z" />
  </svg>
);
const Play = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#34A853" d="M3.6 2.3 13.4 12l-9.8 9.7c-.35-.2-.6-.6-.6-1.1V3.4c0-.5.25-.9.6-1.1z" />
    <path fill="#FBBC04" d="m16.8 15.4-3.4-3.4 3.4-3.4 3.9 2.2c1.1.6 1.1 1.7 0 2.3z" />
    <path fill="#EA4335" d="M3.6 21.7 13.4 12l3.4 3.4-11.5 6.5c-.6.3-1.2.2-1.7-.2z" />
    <path fill="#4285F4" d="M3.6 2.3c.5-.4 1.1-.5 1.7-.2l11.5 6.5L13.4 12z" />
  </svg>
);

/** Store buttons; without a store link yet they read "Coming soon" and aren't links. */
export function Stores() {
  const { t } = useI18n();
  const item = (href: string, icon: ReactNode, label: string) =>
    href ? (
      <a className="store" href={href} target="_blank" rel="noopener">
        {icon}
        <span>
          <strong>{label}</strong>
        </span>
      </a>
    ) : (
      <span className="store soon" role="img" aria-label={`${label}: ${t('storeSoon')}`}>
        {icon}
        <span>
          <small>{t('storeSoon')}</small>
          <strong>{label}</strong>
        </span>
      </span>
    );
  return (
    <div className="stores">
      {item(config.appStoreUrl, <Apple />, 'App Store')}
      {item(config.playStoreUrl, <Play />, 'Google Play')}
    </div>
  );
}

export function SectionHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="section-head">
      <p className="kicker reveal">{kicker}</p>
      <h2 className="h2 reveal">{title}</h2>
      {sub ? <p className="section-sub reveal">{sub}</p> : null}
    </div>
  );
}
