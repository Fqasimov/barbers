import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, useCurrentFrame } from 'remotion';

import find from '../../public/rec/find.json';
import home from '../../public/rec/home.json';
import map from '../../public/rec/map.json';
import { asset } from '../config';
import { clamp, ease } from './theme';

/** Real recordings of the app (the promo's takes), at the phone's point size. */
export const SCREEN = { w: 390, h: 844 };
export const REEL_FPS = 30;

type Touch = { frame: number; x: number; y: number; drag?: boolean };
type Take = { name: string; frames: number; events: Touch[] };
const TAKES: Take[] = [
  { name: 'home', ...home },
  { name: 'find', ...find },
  { name: 'map', ...map },
];
const FADE = 10;
/** H.264 where it plays (Safari, Chrome, Edge), VP9 WebM otherwise (Firefox builds without H.264, some Chromium builds). */
const EXT =
  typeof document !== 'undefined' && document.createElement('video').canPlayType('video/mp4; codecs="avc1.4D401E"')
    ? 'mp4'
    : 'webm';

const starts: number[] = [];
let at = 0;
for (const t of TAKES) {
  starts.push(at);
  at += t.frames - FADE;
}
export const REEL_FRAMES = at + FADE;

/** A finger-tap ring, like iOS "show touches". */
function Tap({ x, y, start }: { x: number; y: number; start: number }) {
  const f = useCurrentFrame() - start;
  if (f < 0 || f > 14) return null;
  const p = interpolate(f, [0, 14], [0, 1], { ...clamp, easing: ease.out });
  return (
    <div
      style={{
        position: 'absolute',
        left: x - 22,
        top: y - 22,
        width: 44,
        height: 44,
        borderRadius: 22,
        background: 'rgba(20,18,16,0.18)',
        border: '2px solid rgba(255,255,255,0.85)',
        transform: `scale(${0.7 + p * 0.5})`,
        opacity: 1 - p,
      }}
    />
  );
}

function Clip({ take }: { take: Take }) {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, FADE], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <OffthreadVideo src={asset(`rec/${take.name}.${EXT}`)} muted style={{ width: SCREEN.w, height: SCREEN.h }} />
      {take.events
        .filter((e) => !e.drag)
        .map((e) => (
          <Tap key={e.frame} x={e.x} y={e.y} start={e.frame} />
        ))}
    </AbsoluteFill>
  );
}

/** The hero's phone screen: home, then a city-wide time search, then the map, on a loop. */
export function Showreel() {
  return (
    <AbsoluteFill style={{ background: '#F3EFE8' }}>
      {TAKES.map((t, i) => (
        <Sequence key={t.name} from={starts[i]} durationInFrames={t.frames} premountFor={30}>
          <Clip take={t} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
}
