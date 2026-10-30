import { useEffect, useState } from 'react';

import { isDemo } from '../config';
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

  const links = [
    ['#about', t('navAbout')],
    ['#why', t('navWhy')],
    ['#map', t('navMap')],
    ['#join', t('navJoin')],
  ] as const;

  return (
    <>
      {isDemo ? <div className="ribbon">{t('demoRibbon')}</div> : null}
      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a className="brand" href="#top" aria-label="yazılnow">
            <Lockup />
          </a>
          <nav className={`nav-links${open ? ' open' : ''}`} id="navLinks" aria-label={t('menu')}>
            {links.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}>
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
            <a className="btn btn-sm btn-outline nav-cta" href="#join">
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
