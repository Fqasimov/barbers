import { useEffect } from 'react';

import { INTRO_DONE } from './components/Intro';

/**
 * Fades sections in as they scroll into view: opacity and a short rise, ease-out,
 * with a small stagger between siblings. Waits for the opening to finish so the
 * hero's entrance isn't hidden behind it, and picks up content that renders later
 * (the venue list, a new form step).
 */
export function useReveal() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      const all = () => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
      all();
      const mo = new MutationObserver(all);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    const start = () => {
      document.querySelectorAll<HTMLElement>('.reveal:not(.in):not([data-watched])').forEach((el) => {
        const siblings = el.parentElement
          ? Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal'))
          : [];
        el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 6) * 60}ms`);
        el.dataset.watched = '';
        io.observe(el);
      });
    };
    let raf = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(start);
    });
    const begin = () => {
      start();
      mo.observe(document.body, { childList: true, subtree: true });
    };
    if (document.documentElement.classList.contains('intro-on')) window.addEventListener(INTRO_DONE, begin, { once: true });
    else begin();
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener(INTRO_DONE, begin);
    };
  }, []);
}
