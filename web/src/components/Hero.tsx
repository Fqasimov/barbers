import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';

import { asset } from '../config';
import { categories } from '../i18n';
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
  const { t, tx } = useI18n();
  const [line1, line2] = t('heroTitle').split('|');
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <p className="kicker reveal">{t('heroKicker')}</p>
          <h1 className="display reveal">
            {line1}
            <br />
            <em>{line2}</em>
          </h1>
          <p className="hero-sub reveal">{t('heroSub')}</p>
          <div className="reveal">
            <Stores />
          </div>
          <a className="link-arrow reveal" href="#join">
            {t('heroForSalons')}
          </a>
        </div>
        {/* A flat lay: the app on a phone among the tools of the trade, lit like the opening. */}
        <div className="hero-stage reveal">
          <img className="prop prop-shears" src={asset('tools/shears-18.webp')} alt="" width={720} height={720} />
          <img className="prop prop-bottle" src={asset('tools/bottle.webp')} alt="" width={720} height={720} />
          <img className="prop prop-razor" src={asset('tools/razor-08.webp')} alt="" width={720} height={720} />
          <figure className="phone">
            <LiveScreen alt={t('phoneAlt')} />
          </figure>
        </div>
      </div>
      <div className="wrap">
        <ul className="hero-cats reveal" aria-label={t('heroCats')}>
          {categories.map((c) => (
            <li key={c.id}>{tx(c.label)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
