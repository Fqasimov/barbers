import { Player, type PlayerRef } from '@remotion/player';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useI18n } from '../lang';
import { Intro, INTRO_FPS, INTRO_FRAMES } from '../remotion/Intro';
import { SHEAR_FRAMES, shearSrc } from '../remotion/Shears';

export const INTRO_DONE = 'usta:intro-done';

/** Resolves when Onest and the shears frames are ready, or after a short cap, whichever is first. */
function assetsReady(cap = 900) {
  const images = Array.from({ length: SHEAR_FRAMES }, (_, i) => {
    const img = new Image();
    img.src = shearSrc(i);
    return img.decode().catch(() => undefined);
  });
  return Promise.race([
    Promise.all([document.fonts?.load('800 120px Onest').catch(() => undefined), ...images]),
    new Promise((r) => setTimeout(r, cap)),
  ]);
}

/**
 * The opening, played by Remotion's Player over the page: the shears cut "usta"
 * along the seam and the page opens there. Once per visit, skippable (button or
 * Escape), never shown with reduced motion (index.html decides before the first
 * paint), and never left covering the page.
 */
export function IntroOverlay() {
  const { t } = useI18n();
  const [active, setActive] = useState(() => document.documentElement.classList.contains('intro-on'));
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  const player = useRef<PlayerRef>(null);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem('usta-intro', '1');
    } catch {
      // Plays again next time; harmless.
    }
    document.documentElement.classList.remove('intro-on');
    setActive(false);
    window.dispatchEvent(new Event(INTRO_DONE));
  }, []);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    void assetsReady().then(() => alive && setReady(true));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && finish();
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      alive = false;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [active, finish]);

  useEffect(() => {
    const p = player.current;
    if (!ready || !p) return;
    p.addEventListener('ended', finish);
    // Whatever happens to playback (a throttled tab, a decoding hiccup), the page never stays covered.
    const safety = window.setTimeout(finish, (INTRO_FRAMES / INTRO_FPS) * 1000 + 1200);
    return () => {
      p.removeEventListener('ended', finish);
      window.clearTimeout(safety);
    };
  }, [ready, finish]);

  if (!active) return null;
  return (
    <div className="intro" aria-hidden="true">
      {ready ? (
        <Player
          ref={player}
          component={Intro}
          durationInFrames={INTRO_FRAMES}
          fps={INTRO_FPS}
          compositionWidth={size.w}
          compositionHeight={size.h}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          initiallyMuted
          controls={false}
          clickToPlay={false}
          doubleClickToFullscreen={false}
          spaceKeyToPlayOrPause={false}
          numberOfSharedAudioTags={0}
          acknowledgeRemotionLicense
        />
      ) : (
        <div className="intro-cover" />
      )}
      <button className="intro-skip" type="button" onClick={finish} tabIndex={-1}>
        {t('skipIntro')}
      </button>
    </div>
  );
}
