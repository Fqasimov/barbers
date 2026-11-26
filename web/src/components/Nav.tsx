import { useEffect, useState } from 'react';

import { isDemo } from '../config';
import { href, route } from '../route';
import { LANGS } from '../i18n';
import { useI18n } from '../lang';
import { Lockup } from './ui';

export function Nav() {
  const { t, lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // About and the map are on the home page; pricing and sign-up are pages of their own.
  const links = [
    [href.home('#about'), t('navAbout')],
    [href.home('#map'), t('navMap')],
    [href.pricing(), t('navPricing')],
    [href.register(), t('navJoin')],
  ] as const;

  const isHere = (to: string) => route !== 'home' && to.includes(`/${route}`);

  return (
    <>
      {isDemo ? <div className="ribbon">{t('demoRibbon')}</div> : null}
      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a className="brand" href={route === 'home' ? '#top' : href.home()} aria-label="yazılnow">
            <Lockup />
          </a>
          <nav className={`nav-links${open ? ' open' : ''}`} id="navLinks" aria-label={t('menu')}>
            {links.map(([to, label]) => (
              <a key={to} href={to} onClick={() => setOpen(false)} aria-current={isHere(to) ? 'page' : undefined}>
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-end">
            <div className="lang" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            {/* The website's own sign-up page; the salon panel (for signed-up salons) is linked from there. */}
            <a className="btn btn-sm btn-outline nav-cta" href={href.register()}>
              {t('navCta')}
            </a>
            <button
              className="nav-toggle"
              type="button"
              aria-expanded={open}
              aria-controls="navLinks"
              aria-label={t('menu')}
              onClick={() => setOpen((o) => !o)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
