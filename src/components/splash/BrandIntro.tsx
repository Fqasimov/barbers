import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

/**
 * The yazılnow opening, the same as the website's (web/src/remotion/Intro.tsx):
 * steel shears snip a burgundy thread and open into the check mark of the logo;
 * beside it the salon's tools play in turn (a hairdryer blows, a brush lacquers
 * a nail, a trimmer buzzes, a straight razor unfolds), then "yazılnow" is cut
 * into place and the stage lifts away to the app.
 *
 * Driven by a 30 fps frame clock so it plays the same on every device. If the
 * app is not ready by the end it holds on the finished logo; reduced motion
 * shows the finished logo and fades.
 */

const FPS = 30;
const T = {
  markIn: [0, 9],
  snipOpen: [8, 13],
  snipClose: [13, 17],
  check: [17, 28],
  dryer: [28, 54],
  polish: [48, 82],
  trimmer: [78, 104],
  razor: [100, 128],
  word: [124, 140],
  hold: 150,
  lift: [150, 170],
} as const;
const CUT = 16;

const SHEARS = [
  require('../../../assets/intro/shears-00.webp'),
  require('../../../assets/intro/shears-01.webp'),
  require('../../../assets/intro/shears-02.webp'),
  require('../../../assets/intro/shears-03.webp'),
  require('../../../assets/intro/shears-04.webp'),
  require('../../../assets/intro/shears-05.webp'),
  require('../../../assets/intro/shears-06.webp'),
  require('../../../assets/intro/shears-07.webp'),
  require('../../../assets/intro/shears-08.webp'),
  require('../../../assets/intro/shears-09.webp'),
  require('../../../assets/intro/shears-10.webp'),
  require('../../../assets/intro/shears-11.webp'),
  require('../../../assets/intro/shears-12.webp'),
  require('../../../assets/intro/shears-13.webp'),
  require('../../../assets/intro/shears-14.webp'),
  require('../../../assets/intro/shears-15.webp'),
  require('../../../assets/intro/shears-16.webp'),
  require('../../../assets/intro/shears-17.webp'),
  require('../../../assets/intro/shears-18.webp'),
];
const RAZOR = [
  require('../../../assets/intro/razor-00.webp'),
  require('../../../assets/intro/razor-01.webp'),
  require('../../../assets/intro/razor-02.webp'),
  require('../../../assets/intro/razor-03.webp'),
  require('../../../assets/intro/razor-04.webp'),
  require('../../../assets/intro/razor-05.webp'),
  require('../../../assets/intro/razor-06.webp'),
  require('../../../assets/intro/razor-07.webp'),
  require('../../../assets/intro/razor-08.webp'),
];
const DRYER = require('../../../assets/intro/hairdryer.webp');
const BRUSH = require('../../../assets/intro/brush.webp');
const NAIL = require('../../../assets/intro/nail-bare.webp');
const NAIL_PAINTED = require('../../../assets/intro/nail-painted.webp');
const TRIMMER = require('../../../assets/intro/trimmer.webp');

const C = { linen: '#F2EADD', linenDeep: '#E7DCC9', ink: '#141210', burgundy: '#6B1A2A', air: '#8d9399' };
/** Anchors in the 720 px renders, as shares of the frame. */
const A = {
  pivot: { x: 0.493, y: 0.493 },
  nozzle: { x: 0.865, y: 0.306 },
  brushTip: { x: 0.493, y: 0.853 },
  cuticle: { x: 0.425, y: 0.68 },
  nailTip: { x: 0.617, y: 0.3 },
  blades: { x: 0.84, y: 0.35 },
};

// Emil Kowalski's curves, as on the website.
const bezier = (x1: number, y1: number, x2: number, y2: number) => (t: number) => {
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t;
    const dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2);
    if (Math.abs(dx) < 1e-6) break;
    u = Math.min(1, Math.max(0, u - x / dx));
  }
  return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
};
const easeOut = bezier(0.23, 1, 0.32, 1);
const easeInOut = bezier(0.77, 0, 0.175, 1);
const io = (f: number, [a, b]: readonly [number, number], out: [number, number] = [0, 1], e = easeInOut) => {
  const t = Math.min(1, Math.max(0, (f - a) / (b - a)));
  return out[0] + (out[1] - out[0]) * e(t);
};
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Enter from the right, leave to the left. */
function slot(f: number, [a, b]: readonly [number, number]) {
  const inP = io(f, [a, a + 7], [0, 1], easeOut);
  const outP = io(f, [b - 6, b], [0, 1], easeInOut);
  return {
    visible: f >= a && f <= b,
    opacity: inP * (1 - outP),
    tx: (1 - inP) * 5 - outP * 5, // % of the box
    scale: 0.97 + 0.03 * inP,
  };
}

/** Every frame stays mounted, so none pops in late. */
function Frames({ srcs, index, size }: { srcs: number[]; index: number; size: number }) {
  const i = Math.round(Math.min(srcs.length - 1, Math.max(0, index)));
  return (
    <>
      {srcs.map((src, k) => (
        <Image
          key={k}
          source={src}
          style={{ position: 'absolute', width: size, height: size, opacity: k === i ? 1 : 0 }}
          cachePolicy="memory"
        />
      ))}
    </>
  );
}

export function BrandIntro({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const reduced = useReducedMotion();
  const { width: w, height: h } = useWindowDimensions();
  const [f, setF] = useState(reduced ? T.word[1] : 0);
  const start = useRef<number | null>(null);
  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);
  const done = useRef(false);

  useEffect(() => {
    void SplashScreen.hide();
    let raf = 0;
    let liftFrom: number | null = null;
    const loop = (now: number) => {
      start.current ??= now;
      let frame = Math.floor(((now - start.current) / 1000) * FPS);
      if (reduced) frame = T.word[1] + Math.floor(((now - start.current) / 1000) * FPS * 0.5);
      // Hold on the finished logo until the app is ready, then lift.
      if (frame >= T.hold) {
        if (!readyRef.current) frame = T.hold;
        else {
          liftFrom ??= now;
          frame = T.hold + Math.floor(((now - liftFrom) / 1000) * FPS);
        }
      }
      setF(frame);
      if (frame >= T.lift[1]) {
        if (!done.current) {
          done.current = true;
          onDone();
        }
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, onDone]);

  // Lockup geometry (portrait): the mark on the left, the word (and the tools before it) on the right.
  const portrait = h > w * 1.2;
  const M = Math.min(portrait ? w * 0.5 : h * 0.6, 520);
  const F = Math.round(M * (portrait ? 0.24 : 0.27));
  const wordW = F * 4.32;
  const markVisible = M * 0.54;
  const gap = M * 0.07;
  const total = markVisible + gap + wordW;
  const cx = w / 2;
  const cy = h * 0.48;
  const lockLeft = cx - total / 2 - M * 0.21;
  const glide = io(f, [22, 34]);
  const markLeft = cx - M * 0.48 + (lockLeft - (cx - M * 0.48)) * glide;
  const markTop = cy - M * 0.5;
  const wordLeft = cx - total / 2 + markVisible + gap;
  const wordCx = wordLeft + wordW / 2;
  const S = Math.min(wordW * 1.05, M * 1.08);

  const markIn = io(f, T.markIn, [0, 1], easeOut);
  let open: number;
  if (f < T.snipOpen[1]) open = io(f, T.snipOpen, [0, 40]);
  else if (f < T.snipClose[1]) open = io(f, T.snipClose, [40, 0], easeOut);
  else open = io(f, T.check, [0, 72], easeOut);
  const pivotX = markLeft + M * A.pivot.x;
  const pivotY = markTop + M * A.pivot.y;

  const threadY = pivotY - M * 0.16;
  const threadIn = io(f, [2, 10], [0, 1], easeOut);
  const cut = io(f, [CUT, CUT + 10], [0, 1], easeOut);
  const threadOut = io(f, [CUT + 2, CUT + 12], [1, 0], easeOut);
  const threadL = Math.min(w * 0.22, 260);

  const wordP = io(f, T.word, [0, 1], easeOut);
  const lift = io(f, T.lift, [0, 1], easeInOut);

  const box = (size: number) => ({
    position: 'absolute' as const,
    left: wordCx - size / 2,
    top: cy - size / 2,
    width: size,
    height: size,
  });

  return (
    <View
      style={[StyleSheet.absoluteFill, { transform: [{ translateY: -lift * h * 1.02 }], zIndex: 100 }]}
      accessibilityLabel="yazılnow"
      accessibilityRole="progressbar"
      pointerEvents={lift > 0 ? 'none' : 'auto'}
    >
      <LinearGradient
        colors={[C.linen, C.linenDeep]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0.3 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Thread */}
      <View
        style={{
          position: 'absolute',
          left: pivotX - threadL,
          top: threadY - 1,
          width: (threadL - 2) * threadIn * (1 - cut * 0.7),
          height: 2,
          borderRadius: 2,
          backgroundColor: C.burgundy,
          opacity: threadIn * threadOut,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: pivotX + 2 + threadL * (1 - threadIn * (1 - cut * 0.7)),
          top: threadY - 1 + cut * 6,
          width: threadL * threadIn * (1 - cut * 0.7),
          height: 2,
          borderRadius: 2,
          backgroundColor: C.burgundy,
          opacity: threadIn * threadOut,
          transform: [{ rotate: `${cut * 4}deg` }],
        }}
      />

      {/* The mark */}
      <View
        style={{
          position: 'absolute',
          left: markLeft,
          top: markTop,
          width: M,
          height: M,
          opacity: markIn,
          transform: [{ translateY: (1 - markIn) * 12 }, { scale: 0.96 + 0.04 * markIn }],
        }}
      >
        <Frames srcs={SHEARS} index={(open / 72) * (SHEARS.length - 1)} size={M} />
      </View>

      <Dryer f={f} box={box(S)} size={S} />
      <Polish f={f} box={box(S * 1.25)} size={S * 1.25} />
      <Trimmer f={f} box={box(S)} size={S} />
      <Razor f={f} box={box(S)} size={S} />

      {/* The word, revealed left to right as if cut into place. */}
      <View
        style={{
          position: 'absolute',
          left: wordLeft,
          top: cy - F * 0.62,
          width: (wordW + F * 0.4) * wordP,
          height: F * 1.3,
          overflow: 'hidden',
          transform: [{ translateX: (1 - wordP) * -6 }],
        }}
      >
        <Text
          maxFontSizeMultiplier={1}
          numberOfLines={1}
          style={{
            fontFamily: 'Onest_800ExtraBold',
            fontSize: F,
            lineHeight: F * 1.12,
            letterSpacing: -0.035 * F,
            color: C.ink,
            width: wordW + F * 0.4,
          }}
        >
          yazılnow
        </Text>
      </View>
    </View>
  );
}

type Box = { position: 'absolute'; left: number; top: number; width: number; height: number };

function Slot({ s, box, children }: { s: ReturnType<typeof slot>; box: Box; children: React.ReactNode }) {
  return (
    <View
      style={[box, { opacity: s.opacity, transform: [{ translateX: (s.tx / 100) * box.width }, { scale: s.scale }] }]}
    >
      {children}
    </View>
  );
}

function Dryer({ f, box, size }: { f: number; box: Box; size: number }) {
  const s = slot(f, T.dryer);
  if (!s.visible) return null;
  const local = f - T.dryer[0];
  const on = io(f, [T.dryer[0] + 6, T.dryer[0] + 10]);
  const shake = Math.sin(local * 2.6) * 0.7 * on;
  const nx = A.nozzle.x * size;
  const ny = A.nozzle.y * size;
  return (
    <Slot s={s} box={box}>
      <Image
        source={DRYER}
        style={{ width: size, height: size, transform: [{ translateX: shake }, { translateY: shake * 0.4 }] }}
      />
      <Svg width={size * 1.6} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        {[-1, 0, 1].map((k) => {
          const len = size * 0.42;
          const y0 = ny + k * size * 0.03;
          const d = `M ${nx} ${y0} C ${nx + len * 0.3} ${y0 + k * 8 - 6}, ${nx + len * 0.6} ${y0 + k * 14 + 6}, ${nx + len} ${y0 + k * 22}`;
          return (
            <Path
              key={k}
              d={d}
              fill="none"
              stroke={C.air}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="18 26"
              strokeDashoffset={-local * 9 - k * 11}
              opacity={on * (0.75 - Math.abs(k) * 0.2)}
            />
          );
        })}
      </Svg>
    </Slot>
  );
}

/** The lacquer follows the brush: the painted nail is revealed cuticle to tip. */
function Polish({ f, box, size }: { f: number; box: Box; size: number }) {
  const s = slot(f, T.polish);
  if (!s.visible) return null;
  const local = f - T.polish[0];
  const paint = io(local, [9, 29], [0, 1], easeInOut);
  const tip = {
    x: A.cuticle.x + (A.nailTip.x - A.cuticle.x) * (-0.05 + paint * 1.02),
    y: A.cuticle.y + (A.nailTip.y - A.cuticle.y) * (-0.05 + paint * 1.02),
  };
  const brushIn = io(local, [3, 9], [0, 1], easeOut) * (1 - io(local, [29, 34], [0, 1], easeInOut));
  const bs = size * 0.55;
  // Reveal from the cuticle (bottom) up to the tip.
  const revealTop = (A.cuticle.y + 0.08 - (A.cuticle.y + 0.08 - A.nailTip.y + 0.06) * paint) * size;
  return (
    <Slot s={s} box={box}>
      <Image source={NAIL} style={{ position: 'absolute', width: size, height: size }} />
      <View
        style={{
          position: 'absolute',
          left: 0,
          top: revealTop,
          width: size,
          height: size - revealTop,
          overflow: 'hidden',
        }}
      >
        <Image source={NAIL_PAINTED} style={{ position: 'absolute', top: -revealTop, width: size, height: size }} />
      </View>
      <Image
        source={BRUSH}
        style={{
          position: 'absolute',
          width: bs,
          height: bs,
          left: tip.x * size - A.brushTip.x * bs,
          top: tip.y * size - A.brushTip.y * bs,
          opacity: brushIn,
          transformOrigin: `${A.brushTip.x * 100}% ${A.brushTip.y * 100}%`,
          transform: [{ rotate: `${56 - (1 - brushIn) * 10}deg` }, { translateY: (1 - brushIn) * -14 }],
        }}
      />
    </Slot>
  );
}

function Trimmer({ f, box, size }: { f: number; box: Box; size: number }) {
  const s = slot(f, T.trimmer);
  if (!s.visible) return null;
  const local = f - T.trimmer[0];
  const on = io(local, [6, 9]) * (1 - io(local, [20, 24]));
  const jx = (Math.sin(local * 3.7) + Math.sin(local * 5.3) * 0.5) * 0.9 * on;
  const jy = Math.cos(local * 4.1) * 0.7 * on;
  const bx = A.blades.x * size;
  const by = A.blades.y * size;
  return (
    <Slot s={s} box={box}>
      <Image
        source={TRIMMER}
        style={{ width: size, height: size, transform: [{ translateX: jx }, { translateY: jy }] }}
      />
      {Array.from({ length: 22 }, (_, i) => {
        const born = 7 + rand(i) * 12;
        const t = local - born;
        if (t < 0 || t > 14) return null;
        const g = t / 14;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: bx + (rand(i + 40) - 0.3) * size * 0.12 + g * (rand(i + 80) - 0.5) * size * 0.1,
              top: by + (rand(i + 20) - 0.5) * size * 0.06 + g * g * size * 0.32,
              width: 1.4,
              height: 5 + rand(i + 7) * 7,
              borderRadius: 1,
              backgroundColor: '#1d1712',
              opacity: (1 - g) * 0.85,
              transform: [{ rotate: `${rand(i + 3) * 180 + g * 140}deg` }],
            }}
          />
        );
      })}
    </Slot>
  );
}

function Razor({ f, box, size }: { f: number; box: Box; size: number }) {
  const s = slot(f, T.razor);
  if (!s.visible) return null;
  const local = f - T.razor[0];
  const unfold = io(local, [5, 15], [0, 1], easeInOut);
  return (
    <Slot s={s} box={box}>
      <Frames srcs={RAZOR} index={unfold * (RAZOR.length - 1)} size={size} />
    </Slot>
  );
}
