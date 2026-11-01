import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

import { slides } from './slides';
import { Lockup } from './ui';

/**
 * The deck: a 1920 × 1080 stage scaled to the window.
 * → / Space / PageDown / click right: next · ← / PageUp / click left: back ·
 * Home / End · F: full screen. The slide number lives in the URL (#3), so a
 * reload stays put.
 */
const fromHash = () => {
  const n = Number(location.hash.slice(1));
  return Number.isInteger(n) && n >= 1 && n <= slides.length ? n - 1 : 0;
};

export function Deck() {
  const [index, setIndex] = useState(fromHash);
  const [scale, setScale] = useState(1);
  const [shown, setShown] = useState(false);

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(innerWidth / 1920, innerHeight / 1080));
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);

  const go = useCallback((to: number) => {
    setIndex((cur) => {
      const next = Math.max(0, Math.min(slides.length - 1, to));
      if (next !== cur) setShown(false);
      return next;
    });
  }, []);

  // Entrances run a frame after the slide mounts, so the transition has a start state.
  useEffect(() => {
    history.replaceState(null, '', `#${index + 1}`);
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(r);
  }, [index]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) go(index + 1);
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) go(index - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(slides.length - 1);
      else if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
      } else return;
      e.preventDefault();
    };
    const hash = () => go(fromHash());
    addEventListener('keydown', key);
    addEventListener('hashchange', hash);
    return () => {
      removeEventListener('keydown', key);
      removeEventListener('hashchange', hash);
    };
  }, [index, go]);

  const { Component, chrome = true } = slides[index];

  return (
    <div className="viewport">
      <div className="stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <section
          key={index}
          className={`slide${shown ? ' shown' : ''}`}
          aria-roledescription="slide"
          aria-label={`${index + 1} / ${slides.length}`}
        >
          <Component shown={shown} next={() => go(index + 1)} />
        </section>
        {chrome ? (
          <footer className="chrome" aria-hidden>
            <Lockup size={22} />
            <div className="progress">
              <i style={{ transform: `scaleX(${(index + 1) / slides.length})` }} />
            </div>
            <span className="count">
              {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
            </span>
          </footer>
        ) : null}
        <button
          className="hit prev"
          aria-label="Previous slide"
          onClick={() => go(index - 1)}
          style={{ background: 'none', border: 0 }}
        />
        <button
          className="hit next"
          aria-label="Next slide"
          onClick={() => go(index + 1)}
          style={{ background: 'none', border: 0 }}
        />
      </div>
      <span className="hint">← → to move · F for full screen</span>
    </div>
  );
}
