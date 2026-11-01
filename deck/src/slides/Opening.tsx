import { Player, type PlayerRef } from '@remotion/player';
import { useEffect, useRef, useState } from 'react';

import { brand } from '../content';
import { Intro, INTRO_FPS, INTRO_FRAMES, INTRO_IMAGES } from '../remotion/Intro';
import { enter, Lockup } from '../ui';
import type { SlideProps } from './types';

/**
 * 1 · Introduction. The app's own opening plays first (the same Remotion
 * composition as the app and the website): the shears cut, the salon's tools
 * pass, "yazılnow" is cut into place and the stage lifts away to the title.
 */
export function Opening({ shown }: SlideProps) {
  const player = useRef<PlayerRef>(null);
  const [playing, setPlaying] = useState(true);
  const [ready, setReady] = useState(false);

  // Decode every frame first so nothing pops in mid-animation.
  useEffect(() => {
    let alive = true;
    Promise.all(
      INTRO_IMAGES.map(
        (src) =>
          new Promise((r) => {
            const im = new Image();
            im.onload = im.onerror = r;
            im.src = src;
          }),
      ),
    ).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const done = () => setPlaying(false);
    const p = player.current;
    p?.addEventListener('ended', done);
    // Belt and braces: the title always arrives, even if the browser holds playback back.
    const t = setTimeout(done, (INTRO_FRAMES / INTRO_FPS) * 1000 + 400);
    return () => {
      p?.removeEventListener('ended', done);
      clearTimeout(t);
    };
  }, [ready]);

  const show = shown && !playing;
  return (
    <>
      <div className={`opening${show ? ' shown' : ''}`}>
        <p className="kicker" {...enter(0)}>
          {brand.course}
        </p>
        <h1 {...enter(1)} style={{ ...enter(1).style, margin: 0 }}>
          <Lockup size={168} />
        </h1>
        <p className="opening-tagline" {...enter(2)}>
          {brand.tagline}
        </p>
        <p className="opening-contact" {...enter(3)}>
          <span>{brand.website}</span>
          <span className="dot" />
          <span>{brand.email}</span>
        </p>
      </div>
      {playing ? (
        <div className="intro-layer" aria-hidden>
          {ready ? (
            <Player
              ref={player}
              component={Intro}
              durationInFrames={INTRO_FRAMES}
              fps={INTRO_FPS}
              compositionWidth={1920}
              compositionHeight={1080}
              style={{ width: 1920, height: 1080 }}
              controls={false}
              clickToPlay={false}
              autoPlay
              initiallyMuted
              numberOfSharedAudioTags={0}
              doubleClickToFullscreen={false}
              spaceKeyToPlayOrPause={false}
              acknowledgeRemotionLicense
            />
          ) : null}
        </div>
      ) : null}
    </>
  );
}
