import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';

import { asset } from '../config';
import { useI18n } from '../lang';
import { REEL_FPS, REEL_FRAMES, SCREEN, Showreel } from '../remotion/Showreel';
import { Stores } from './ui';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** The real app, playing inside the phone: plays only while it's on screen and the tab is visible. */
function LiveScreen({ alt }: { alt: string }) {
  const ref = useRef<PlayerRef>(null);
  const box = useRef<HTMLDivElement>(null);
  const [still] = useState(reducedMotion);

  useEffect(() => {
    const p = ref.current;
    const el = box.current;
    if (still || !p || !el) return;
    let visible = false;
    const sync = () => (visible && !document.hidden ? p.play() : p.pause());
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [still]);

  return (
    <div ref={box} className="screen" role="img" aria-label={alt}>
      {still ? (
        <img src={asset('img/app-home.webp')} alt="" width={390} height={844} />
      ) : (
        <Player
          ref={ref}
          component={Showreel}
          durationInFrames={REEL_FRAMES}
          fps={REEL_FPS}
          compositionWidth={SCREEN.w}
          compositionHeight={SCREEN.h}
          style={{ width: '100%', height: '100%' }}
          loop
          initiallyMuted
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          numberOfSharedAudioTags={0}
          renderPoster={() => <img className="poster" src={asset('img/reel-poster.webp')} alt="" />}
          showPosterWhenUnplayed
          acknowledgeRemotionLicense
        />
      )}
    </div>
  );
}

export function Hero() {
  const { t } = useI18n();
  const [line1, line2] = t('heroTitle').split('|');
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="kicker reveal">{t('heroKicker')}</p>
          <h1 className="hero-title reveal">
            {line1}
            <br />
            <em>{line2}</em>
          </h1>
          <p className="hero-sub reveal">{t('heroSub')}</p>
          <div className="reveal">
            <Stores />
          </div>
          <a className="hero-link reveal" href="#join">
            {t('heroForSalons')}
          </a>
        </div>
        <div className="hero-art reveal">
          <figure className="phone phone-back" aria-hidden="true">
            <div className="screen">
              <img src={asset('img/app-salon.webp')} alt="" width={390} height={844} />
            </div>
          </figure>
          <figure className="phone phone-front">
            <LiveScreen alt={t('phoneAlt')} />
          </figure>
          <div className="float-chip chip-a" aria-hidden="true">
            <span className="dot dot-green" />
            {t('chipFree')}
          </div>
          <div className="float-chip chip-b" aria-hidden="true">
            <span className="tick">✓</span>
            {t('chipBooked')}
          </div>
          <div className="float-chip chip-c" aria-hidden="true">
            <span className="stars">★★★★★</span>
            {t('chipReview')}
          </div>
        </div>
      </div>
    </section>
  );
}
