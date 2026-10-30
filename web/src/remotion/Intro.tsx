import type { CSSProperties } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

import { asset } from '../config';
import { clamp, color, ease } from './theme';

export const INTRO_FPS = 30;
export const INTRO_FRAMES = 170;

// ---------------------------------------------------------------------------
// Assets: 3D renders from tools/shears and tools/beauty, 720 px, transparent.
// ---------------------------------------------------------------------------
const SHEAR_FRAMES = 19; // 0° … 72° open, every 4°
const RAZOR_FRAMES = 9; // folded … open
const tool = (name: string) => asset(`tools/${name}.webp`);
const shearSrc = (i: number) => tool(`shears-${String(i).padStart(2, '0')}`);
const razorSrc = (i: number) => tool(`razor-${String(i).padStart(2, '0')}`);
export const INTRO_IMAGES = [
  ...Array.from({ length: SHEAR_FRAMES }, (_, i) => shearSrc(i)),
  ...Array.from({ length: RAZOR_FRAMES }, (_, i) => razorSrc(i)),
  ...['hairdryer', 'brush', 'nail-bare', 'nail-painted', 'trimmer'].map(tool),
];

/** Anchors in the 720 px renders, as shares of the frame. */
const A = {
  pivot: { x: 0.493, y: 0.493 },
  nozzle: { x: 0.865, y: 0.306 },
  brushTip: { x: 0.493, y: 0.853 },
  cuticle: { x: 0.425, y: 0.68 },
  nailTip: { x: 0.617, y: 0.3 },
  blades: { x: 0.84, y: 0.35 },
};

// ---------------------------------------------------------------------------
// Timeline (frames at 30 fps)
// ---------------------------------------------------------------------------
const T = {
  markIn: [0, 9],
  snipOpen: [8, 13],
  snipClose: [13, 17], // the thread is cut at 16
  check: [17, 28], // open wide into the check mark, and stay
  dryer: [28, 54],
  polish: [48, 82],
  trimmer: [78, 104],
  razor: [100, 128],
  word: [124, 140],
  lift: [150, 170],
} as const;
const CUT = 16;

const io = (f: number, range: readonly [number, number], out: [number, number] = [0, 1], e = ease.inOut) =>
  interpolate(f, range, out, { ...clamp, easing: e });

/** Every frame stays mounted so none pops in late (they are preloaded before the intro starts). */
function Frames({ srcs, index, style }: { srcs: string[]; index: number; style?: CSSProperties }) {
  const i = Math.round(Math.min(srcs.length - 1, Math.max(0, index)));
  return (
    <div style={{ position: 'absolute', ...style }}>
      {srcs.map((src, k) => (
        <img
          key={src}
          src={src}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: k === i ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

/** Enter from the right, leave to the left: a short slide with a little blur, never ease-in. */
function slot(f: number, [a, b]: readonly [number, number]) {
  const inP = io(f, [a, a + 7], [0, 1], ease.out);
  const outP = io(f, [b - 6, b], [0, 1], ease.inOut);
  return {
    visible: f >= a && f <= b,
    style: {
      opacity: inP * (1 - outP),
      transform: `translateX(${(1 - inP) * 5 - outP * 5}%) scale(${0.97 + 0.03 * inP})`,
      filter: `blur(${(1 - inP) * 6 + outP * 6}px)`,
    } satisfies CSSProperties,
  };
}

// Deterministic "random" for the clippings.
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * The opening. Steel shears snip a burgundy thread, then open into a check mark and stay:
 * the mark of the logo. Beside it, where the wordmark will sit, the salon's tools play in
 * turn (a hairdryer blows, a brush lacquers a nail in three strokes, a trimmer buzzes, a
 * straight razor unfolds and catches the light), and then "yazılnow" is cut into place.
 * The beige stage lifts away to the page.
 */
export function Intro() {
  const f = useCurrentFrame();
  const { width: w, height: h } = useVideoConfig();

  // Lockup geometry: the mark (shears) on the left, the word (and the tools before it) on the right.
  const portrait = h > w * 1.2;
  const M = Math.min(portrait ? w * 0.5 : h * 0.6, 520); // shears frame size
  const F = Math.round(M * (portrait ? 0.24 : 0.27)); // wordmark font size
  const wordW = F * 4.32;
  const markVisible = M * 0.54; // the open check spans 0.21 … 0.75 of the frame
  const gap = M * 0.07;
  const total = markVisible + gap + wordW;
  const cx = w / 2;
  const cy = h * 0.48;
  const lockLeft = cx - total / 2 - M * 0.21; // the visible check starts ~0.21 into the frame
  // The shears cut centre stage, then glide left to their place in the logo as the tools arrive.
  const glide = io(f, [22, 34], [0, 1], ease.inOut);
  const markLeft = cx - M * 0.48 + (lockLeft - (cx - M * 0.48)) * glide;
  const markTop = cy - M * 0.5;
  const wordLeft = cx - total / 2 + markVisible + gap;
  const wordCx = wordLeft + wordW / 2;
  const S = Math.min(wordW * 1.05, M * 1.08); // tool frame size

  // ---- The shears: enter, one snip, open into the check mark.
  const markIn = io(f, T.markIn, [0, 1], ease.out);
  let open = 0;
  if (f < T.snipOpen[1]) open = io(f, T.snipOpen, [0, 40]);
  else if (f < T.snipClose[1]) open = io(f, T.snipClose, [40, 0], ease.out);
  else open = io(f, T.check, [0, 72], ease.out);
  const pivotX = markLeft + M * A.pivot.x;
  const pivotY = markTop + M * A.pivot.y;

  // ---- The thread, cut at CUT: its two halves spring back and fade.
  const threadY = pivotY - M * 0.16;
  const threadIn = io(f, [2, 10], [0, 1], ease.out);
  const cut = io(f, [CUT, CUT + 10], [0, 1], ease.out);
  const threadOut = io(f, [CUT + 2, CUT + 12], [1, 0], ease.out);
  const threadL = Math.min(w * 0.22, 260);

  // ---- The word.
  const wordP = io(f, T.word, [0, 1], ease.out);

  // ---- Lift: the stage rises off the page.
  const lift = io(f, T.lift, [0, 1], ease.inOut);

  const slotBox = (size: number): CSSProperties => ({
    position: 'absolute',
    left: wordCx - size / 2,
    top: cy - size / 2,
    width: size,
    height: size,
  });

  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${-lift * 102}%)`,
        boxShadow: lift > 0 ? '0 20px 60px rgba(30,22,14,.25)' : undefined,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 40%, ${color.linen} 0%, ${color.linenDeep} 100%)`,
        }}
      />

      {/* Thread */}
      <div
        style={{
          position: 'absolute',
          left: pivotX - threadL,
          top: threadY - 1,
          width: threadL - 2,
          height: 2,
          opacity: threadIn * threadOut,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: color.burgundy,
            transformOrigin: 'left center',
            transform: `scaleX(${threadIn * (1 - cut * 0.7)})`,
            borderRadius: 2,
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: pivotX + 2,
          top: threadY - 1,
          width: threadL,
          height: 2,
          opacity: threadIn * threadOut,
          transformOrigin: 'right center',
          transform: `scaleX(${threadIn * (1 - cut * 0.7)}) translateY(${cut * 6}px) rotate(${cut * 4}deg)`,
          background: color.burgundy,
          borderRadius: 2,
        }}
      />

      {/* The mark */}
      <Frames
        srcs={Array.from({ length: SHEAR_FRAMES }, (_, i) => shearSrc(i))}
        index={(open / 72) * (SHEAR_FRAMES - 1)}
        style={{
          left: markLeft,
          top: markTop,
          width: M,
          height: M,
          opacity: markIn,
          transform: `translateY(${(1 - markIn) * 12}px) scale(${0.96 + 0.04 * markIn})`,
          transformOrigin: `${A.pivot.x * 100}% ${A.pivot.y * 100}%`,
        }}
      />

      <Dryer f={f} box={slotBox(S)} size={S} />
      <Polish f={f} box={slotBox(S * 1.25)} size={S * 1.25} />
      <Trimmer f={f} box={slotBox(S)} size={S} />
      <Razor f={f} box={slotBox(S)} />

      {/* The word, revealed left to right as if cut into place. */}
      <div
        style={{
          position: 'absolute',
          left: wordLeft,
          top: cy - F * 0.62,
          fontFamily: 'Onest, system-ui, sans-serif',
          fontWeight: 800,
          fontSize: F,
          lineHeight: 1.12,
          letterSpacing: '-0.035em',
          color: color.ink,
          whiteSpace: 'nowrap',
          clipPath: `inset(-10% ${(1 - wordP) * 100}% -10% 0)`,
          transform: `translateX(${(1 - wordP) * -6}px)`,
        }}
      >
        yazılnow
      </div>
    </AbsoluteFill>
  );
}

// ---------------------------------------------------------------------------
// Hairdryer: a little motor shake and three ribbons of air from the nozzle.
// ---------------------------------------------------------------------------
function Dryer({ f, box, size }: { f: number; box: CSSProperties; size: number }) {
  const s = slot(f, T.dryer);
  if (!s.visible) return null;
  const local = f - T.dryer[0];
  const on = io(f, [T.dryer[0] + 6, T.dryer[0] + 10]);
  const shake = Math.sin(local * 2.6) * 0.7 * on;
  const nx = A.nozzle.x * size;
  const ny = A.nozzle.y * size;
  return (
    <div style={{ ...box, ...s.style }}>
      <img
        src={tool('hairdryer')}
        alt=""
        style={{ width: '100%', height: '100%', transform: `translate(${shake}px, ${shake * 0.4}px)` }}
      />
      <svg width={size * 1.6} height={size} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        {[-1, 0, 1].map((k) => {
          const len = size * 0.42;
          const y0 = ny + k * size * 0.03;
          const d = `M ${nx} ${y0} C ${nx + len * 0.3} ${y0 + k * 8 - 6}, ${nx + len * 0.6} ${y0 + k * 14 + 6}, ${nx + len} ${y0 + k * 22}`;
          return (
            <path
              key={k}
              d={d}
              fill="none"
              stroke="#8d9399"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="18 26"
              strokeDashoffset={-local * 9 - k * 11}
              opacity={on * (0.75 - Math.abs(k) * 0.2)}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nail polish: the brush lays three strokes, cuticle to tip; the lacquer follows each one.
// ---------------------------------------------------------------------------
function Polish({ f, box, size }: { f: number; box: CSSProperties; size: number }) {
  const s = slot(f, T.polish);
  if (!s.visible) return null;
  const local = f - T.polish[0];
  const ax = A.nailTip.x - A.cuticle.x;
  const ay = A.nailTip.y - A.cuticle.y;
  const len = Math.hypot(ax, ay);
  const ux = ax / len;
  const uy = ay / len;
  const nx = -uy; // across the nail
  const ny = ux;
  const lanes = [-0.07, 0, 0.07];
  const strokes = lanes.map((_, k) => io(local, [9 + k * 7, 15 + k * 7], [0, 1], ease.inOut));
  const pt = (along: number, across: number) => ({
    x: A.cuticle.x + ux * along * len + nx * across,
    y: A.cuticle.y + uy * along * len + ny * across,
  });
  const band = (k: number, p: number) => {
    const lo = lanes[k] - 0.06;
    const hi = lanes[k] + 0.06;
    const a0 = -0.12;
    const a1 = -0.12 + p * 1.3;
    const c = [pt(a0, lo), pt(a1, lo), pt(a1, hi), pt(a0, hi)];
    return `polygon(${c.map((q) => `${(q.x * 100).toFixed(2)}% ${(q.y * 100).toFixed(2)}%`).join(', ')})`;
  };
  // The brush follows the active stroke.
  const active = strokes.findIndex((p) => p < 1);
  const k = active === -1 ? 2 : active;
  const p = active === -1 ? 1 : strokes[k];
  const tip = pt(-0.05 + p * 1.02, lanes[k]);
  const brushIn = io(local, [3, 9], [0, 1], ease.out) * (1 - io(local, [29, 34], [0, 1], ease.inOut));
  const brushSize = size * 0.55;
  return (
    <div style={{ ...box, ...s.style }}>
      <img src={tool('nail-bare')} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {strokes.map((sp, i) =>
        sp > 0 ? (
          <img
            key={i}
            src={tool('nail-painted')}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', clipPath: band(i, sp) }}
          />
        ) : null,
      )}
      <img
        src={tool('brush')}
        alt=""
        style={{
          position: 'absolute',
          width: brushSize,
          height: brushSize,
          left: tip.x * size - A.brushTip.x * brushSize,
          top: tip.y * size - A.brushTip.y * brushSize,
          opacity: brushIn,
          transformOrigin: `${A.brushTip.x * 100}% ${A.brushTip.y * 100}%`,
          // Handle out to the right, as it's held; the bristles trail the stroke.
          transform: `rotate(${56 - (1 - brushIn) * 10}deg) translateY(${(1 - brushIn) * -14}px)`,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trimmer: a fast buzz and a fall of fine clippings from the blades.
// ---------------------------------------------------------------------------
function Trimmer({ f, box, size }: { f: number; box: CSSProperties; size: number }) {
  const s = slot(f, T.trimmer);
  if (!s.visible) return null;
  const local = f - T.trimmer[0];
  const on = io(local, [6, 9]) * (1 - io(local, [20, 24]));
  const jx = (Math.sin(local * 3.7) + Math.sin(local * 5.3) * 0.5) * 0.9 * on;
  const jy = Math.cos(local * 4.1) * 0.7 * on;
  const bx = A.blades.x * size;
  const by = A.blades.y * size;
  return (
    <div style={{ ...box, ...s.style }}>
      <img
        src={tool('trimmer')}
        alt=""
        style={{ width: '100%', height: '100%', transform: `translate(${jx}px, ${jy}px)` }}
      />
      {Array.from({ length: 22 }, (_, i) => {
        const born = 7 + rand(i) * 12;
        const t = local - born;
        if (t < 0 || t > 14) return null;
        const g = t / 14;
        const x = bx + (rand(i + 40) - 0.3) * size * 0.12 + g * (rand(i + 80) - 0.5) * size * 0.1;
        const y = by + (rand(i + 20) - 0.5) * size * 0.06 + g * g * size * 0.32;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 1.4,
              height: 5 + rand(i + 7) * 7,
              borderRadius: 1,
              background: '#1d1712',
              opacity: (1 - g) * 0.85,
              transform: `rotate(${rand(i + 3) * 180 + g * 140}deg)`,
            }}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Straight razor: unfolds, then a glint runs along the blade.
// ---------------------------------------------------------------------------
function Razor({ f, box }: { f: number; box: CSSProperties }) {
  const s = slot(f, T.razor);
  if (!s.visible) return null;
  const local = f - T.razor[0];
  const unfold = io(local, [5, 15], [0, 1], ease.inOut);
  const glint = io(local, [15, 23], [-0.3, 1.3], ease.inOut);
  const open = razorSrc(RAZOR_FRAMES - 1);
  return (
    <div style={{ ...box, ...s.style }}>
      <Frames
        srcs={Array.from({ length: RAZOR_FRAMES }, (_, i) => razorSrc(i))}
        index={unfold * (RAZOR_FRAMES - 1)}
        style={{ inset: 0 }}
      />
      {local >= 15 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            WebkitMaskImage: `url(${open})`,
            maskImage: `url(${open})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            background: `linear-gradient(105deg, transparent ${glint * 100 - 8}%, rgba(255,255,255,0.85) ${glint * 100}%, transparent ${glint * 100 + 8}%)`,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
    </div>
  );
}
