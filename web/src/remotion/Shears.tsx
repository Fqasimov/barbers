import type { CSSProperties } from 'react';

import { asset } from '../config';

/** 13 rendered frames of steel shears, 0° (shut) to 30° (open): the app's splash art. */
export const SHEAR_FRAMES = 13;
export const SHEARS_ASPECT = 617 / 840;
export const shearSrc = (i: number) => asset(`shears/shears-${String(i).padStart(2, '0')}.webp`);

/**
 * `open` runs 0 (shut) to 1 (wide open). Every frame stays mounted so none pops in late.
 * Plain <img>, not Remotion's <Img>: this composition only plays in the browser (never
 * rendered to a file), the frames are preloaded before it starts, and <Img>'s buffering
 * would hold the opening on its first frame.
 */
export function Shears({ width, open, style }: { width: number; open: number; style?: CSSProperties }) {
  const index = Math.round(Math.min(1, Math.max(0, open)) * (SHEAR_FRAMES - 1));
  return (
    <div style={{ position: 'relative', width, height: width * SHEARS_ASPECT, ...style }}>
      {Array.from({ length: SHEAR_FRAMES }, (_, i) => (
        <img
          key={i}
          src={shearSrc(i)}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: i === index ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

/** One snip as a function of time: quick open, quicker close, then rest. 0..1. */
export const snip = (frame: number, start: number, { open = 5, close = 4, depth = 0.75 } = {}) => {
  const t = frame - start;
  if (t <= 0) return 0;
  if (t < open) return depth * (1 - Math.pow(1 - t / open, 2));
  if (t < open + close) {
    const p = (t - open) / close;
    return depth * (1 - p * p);
  }
  return 0;
};
