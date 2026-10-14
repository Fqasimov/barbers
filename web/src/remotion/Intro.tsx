import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

import { Shears, SHEARS_ASPECT, snip } from './Shears';
import { clamp, color, ease } from './theme';

export const INTRO_FPS = 30;
export const INTRO_FRAMES = 74;

// Timeline (frames at 30 fps)
const WORD_IN = [2, 14] as const;
const TRAVEL = [10, 44] as const; // the shears cut along the seam, left to right
const SETTLE = [42, 50] as const; // the top half slips right, the halves part a hair
const OPEN = [52, 72] as const; // the page opens along the cut
const SNIPS = [10, 19, 28, 37];

let canvas: HTMLCanvasElement | null = null;
/** Width of "usta" in Onest ExtraBold with the wordmark's tracking (falls back to an estimate). */
function measureWord(fs: number) {
  canvas ??= document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return fs * 2.02;
  ctx.font = `800 ${fs}px Onest, system-ui, sans-serif`;
  return ctx.measureText('usta').width - 4 * 0.045 * fs;
}

/**
 * The opening: the word "usta" sits on the seam between two linen panels. The
 * shears snip along the seam and cut it; its top half slips sideways (the
 * wordmark); then the panels part and the page is there. The composition is
 * transparent, so the real page shows through as the panels move apart.
 */
export function Intro() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const fs = Math.round(Math.min(width * 0.22, height * 0.2, 150));
  const seam = height / 2;
  const wordW = measureWord(fs);
  const left = width / 2 - wordW / 2;
  const right = width / 2 + wordW / 2;

  const wordIn = interpolate(frame, WORD_IN, [0, 1], { ...clamp, easing: ease.out });
  const settle = interpolate(frame, SETTLE, [0, 1], { ...clamp, easing: ease.out });
  const opening = interpolate(frame, OPEN, [0, 1], { ...clamp, easing: ease.inOut });

  // The shears' pivot travels from just before the word to just past it.
  const travel = interpolate(frame, TRAVEL, [0, 1], { ...clamp, easing: ease.inOut });
  const startX = left - fs * 0.45;
  const endX = right + fs * 0.45;
  const pivotX = startX + (endX - startX) * travel;
  const open = SNIPS.reduce((o, s) => o + snip(frame, s), 0);
  const shearsW = Math.min(width * 0.42, fs * 2.1, 300);
  const shearsIn = interpolate(frame, [4, 12], [0, 1], { ...clamp, easing: ease.out });
  const shearsOut = interpolate(frame, [44, 52], [0, 1], { ...clamp, easing: ease.out });
  // The pivot screw, as a share of the image. Rotated 28° the blades lie flat along the
  // seam, so the cut ends just ahead of the pivot.
  const pivot = { x: 0.49, y: 0.48 };
  const lead = shearsW * 0.08;

  const lineW = Math.max(0, pivotX + lead - startX);
  const lineFade = interpolate(frame, [48, 56], [1, 0], clamp);

  const word = (half: 'top' | 'bottom') => (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: half === 'top' ? seam - fs * 0.62 : -fs * 0.62,
        fontFamily: 'Onest, system-ui, sans-serif',
        fontWeight: 800,
        fontSize: fs,
        lineHeight: 1.12,
        letterSpacing: '-0.045em',
        color: color.ink,
        whiteSpace: 'nowrap',
        opacity: wordIn,
        transform: `translate(calc(-50% + ${half === 'top' ? settle * fs * 0.05 : 0}px), ${(1 - wordIn) * 14 + (half === 'bottom' ? settle * fs * 0.045 : 0)}px)`,
      }}
    >
      usta
    </div>
  );

  const panel = (half: 'top' | 'bottom') => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: seam,
        top: half === 'top' ? 0 : seam,
        overflow: 'hidden',
        background: color.linen,
        transform: `translateY(${(half === 'top' ? -1 : 1) * opening * (seam + 2)}px)`,
        boxShadow: opening > 0 ? `0 ${half === 'top' ? 18 : -18}px 40px rgba(42,32,21,${0.12 * opening})` : undefined,
      }}
    >
      {word(half)}
    </div>
  );

  return (
    <AbsoluteFill>
      {panel('top')}
      {panel('bottom')}
      <div
        style={{
          position: 'absolute',
          left: startX,
          top: seam - 1,
          width: lineW,
          height: 2,
          background: color.nar,
          opacity: lineFade * (1 - opening),
          borderRadius: 2,
        }}
      />
      <Shears
        width={shearsW}
        open={open}
        style={{
          position: 'absolute',
          left: pivotX - shearsW * pivot.x,
          top: seam - shearsW * SHEARS_ASPECT * pivot.y,
          opacity: shearsIn * (1 - shearsOut),
          transform: `translateX(${shearsOut * fs * 0.4}px) rotate(28deg) scale(${0.92 + 0.08 * shearsIn})`,
          transformOrigin: `${pivot.x * 100}% ${pivot.y * 100}%`,
          filter: 'drop-shadow(0 10px 18px rgba(42,32,21,0.18))',
        }}
      />
    </AbsoluteFill>
  );
}
