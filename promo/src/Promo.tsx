import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";

import { Clip, takes, tapAt, type TakeName } from "./Clip";
import { Phone, phoneSize } from "./Phone";
import { Shears, snip } from "./Shears";
import { clamp, color, ease, font } from "./theme";

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

type Enter = "fade" | "cover";
type Segment = { take: TakeName; from?: number; to?: number; enter?: Enter; statusBar?: "dark" | "light" };
type Beat = { caption: string; sub: string; segments: Segment[] };

const BEATS: Beat[] = [
  {
    caption: "Bakının ən yaxşı ustaları.",
    sub: "Real ziyarətlərə görə sıralanıb.",
    segments: [{ take: "home", to: 165 }],
  },
  {
    caption: "Boş vaxtı bütün şəhərdə tap.",
    sub: "Xidmət, gün, saat — qalanını Usta tapır.",
    segments: [{ take: "find" }],
  },
  {
    caption: "Xidmət, usta, vaxt.",
    sub: "Bir dəqiqədən az çəkir.",
    segments: [
      { take: "salon", to: tapAt("salon", 0) + 6, statusBar: "light" },
      { take: "book", enter: "cover" },
    ],
  },
  {
    caption: "Büdcənə uyğun, sənə yaxın.",
    sub: "Xəritədə qiymət və reytinq bir baxışda.",
    segments: [{ take: "map" }],
  },
  {
    caption: "Yan-yana müqayisə et.",
    sub: "Qiymət, reytinq, məsafə, ilk boş vaxt.",
    segments: [{ take: "compare" }],
  },
  {
    caption: "Rəy yalnız real ziyarətdən sonra.",
    sub: "Hər ulduzun arxasında bir növbə var.",
    segments: [
      { take: "past", to: tapAt("past", 1) + 6 },
      { take: "review", enter: "cover" },
    ],
  },
];

const TRANSITION: Record<Enter, number> = { fade: 10, cover: 16 };

type Placed = Segment & { start: number; duration: number; beat: number; enter: Enter | undefined };
const placed: Placed[] = [];
{
  let cursor = 0;
  BEATS.forEach((beat, b) => {
    beat.segments.forEach((seg, i) => {
      const enter: Enter | undefined = placed.length === 0 ? undefined : (seg.enter ?? (i === 0 ? "fade" : undefined));
      const from = seg.from ?? 0;
      const duration = (seg.to ?? takes[seg.take].frames) - from;
      const start = enter ? cursor - TRANSITION[enter] : cursor;
      placed.push({ ...seg, enter, start, duration, beat: b });
      cursor = start + duration;
    });
  });
}
const beatStart = BEATS.map((_, b) => placed.find((p) => p.beat === b)!.start);
const STORY = placed[placed.length - 1].start + placed[placed.length - 1].duration;

const OPENER = 96;
const PHONE_AT = 80;
const OUTRO = 120;
const OUTRO_AT = PHONE_AT + STORY - 14;
export const PROMO_FRAMES = OUTRO_AT + OUTRO;

// ---------------------------------------------------------------------------

export const Promo: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: color.linen }}>
      <Backdrop />
      <Sequence name="Opener" durationInFrames={OPENER} premountFor={fps}>
        <Opener />
      </Sequence>
      <Sequence name="Story" from={PHONE_AT} durationInFrames={STORY + 6} premountFor={fps}>
        <Story />
      </Sequence>
      <Sequence name="Outro" from={OUTRO_AT} durationInFrames={OUTRO} premountFor={fps}>
        <Outro />
      </Sequence>
      <Grain />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Opener: the shears snip, the wordmark gets cut.
// ---------------------------------------------------------------------------

export const Opener: React.FC = () => {
  const frame = useCurrentFrame();
  const open = Math.max(snip(frame, 6), snip(frame, 26), snip(frame, 46, { open: 11, close: 5 }));
  const cut = interpolate(frame, [61, 66], [0, 1], { ...clamp, easing: ease.out });
  const word = interpolate(frame, [14, 32], [0, 1], { ...clamp, easing: ease.out });
  const leave = interpolate(frame, [76, OPENER], [0, 1], { ...clamp, easing: ease.inOut });
  const push = interpolate(frame, [0, OPENER], [1, 1.06]);
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: 1 - leave, translate: `0 ${-leave * 160}px` }}>
      <div style={{ marginTop: 560, scale: String(push) }}>
        <Shears width={900} open={open} />
      </div>
      <div style={{ marginTop: 70, opacity: word, translate: `0 ${(1 - word) * 18}px` }}>
        <Wordmark size={150} cut={cut} />
      </div>
    </AbsoluteFill>
  );
};

/** The app's wordmark: lowercase "usta", sliced, top half slipped sideways by the cut. */
export const Wordmark: React.FC<{ size: number; cut: number }> = ({ size, cut }) => {
  const lh = Math.round(size * 1.12);
  const at = Math.round(size * 0.62);
  const text: React.CSSProperties = {
    fontFamily: font,
    fontWeight: 700,
    fontSize: size,
    lineHeight: `${lh}px`,
    letterSpacing: -size * 0.045,
    color: color.ink,
    whiteSpace: "nowrap",
  };
  return (
    <div style={{ position: "relative", height: lh }}>
      <div style={{ ...text, opacity: 0, paddingRight: size * 0.05 }}>usta</div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: at, overflow: "hidden", translate: `${cut * size * 0.06}px 0` }}>
        <div style={text}>usta</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: at, bottom: 0, overflow: "hidden" }}>
        <div style={{ ...text, marginTop: -at }}>usta</div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Story: real recordings in a phone, one caption per beat.
// ---------------------------------------------------------------------------

const PHONE_W = 720;

const Story: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = phoneSize(PHONE_W);
  const rise = interpolate(frame, [0, 34], [0, 1], { ...clamp, easing: ease.ios });
  const fall = interpolate(frame, [STORY - 22, STORY], [0, 1], { ...clamp, easing: ease.inOut });
  const turnY = interpolate(frame, [0, STORY], [-9, 7]);
  const turnX = interpolate(frame, [0, STORY], [5, 2]);
  const top = 1920 - height - 18;
  const y = (1 - rise) * 1500 + fall * 1500;

  // The status bar follows whichever screen owns the top edge (half-way through a cover).
  const current = placed.filter((p) => frame >= p.start + (p.enter ? TRANSITION[p.enter] / 2 : 0)).at(-1);

  return (
    <AbsoluteFill>
      {BEATS.map((beat, b) => (
        <Sequence key={b} from={beatStart[b]} durationInFrames={(beatStart[b + 1] ?? STORY) - beatStart[b]} layout="none">
          <Caption caption={beat.caption} sub={beat.sub} last={b === BEATS.length - 1} />
        </Sequence>
      ))}

      <div style={{ position: "absolute", left: 0, right: 0, top, height, perspective: 2600, translate: `0 ${y}px` }}>
        {/* Contact shadow on the backdrop, offset away from the key light. */}
        <div
          style={{
            position: "absolute",
            left: (1080 - PHONE_W) / 2 + 40,
            top: 70,
            width: PHONE_W,
            height: height - 40,
            borderRadius: 140,
            background: "rgba(42, 32, 21, 0.30)",
            filter: "blur(46px)",
            transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: (1080 - PHONE_W) / 2,
            top: 0,
            transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <Phone width={PHONE_W} statusBar={current?.statusBar ?? "dark"}>
            {placed.map((p, i) => (
              <Sequence key={i} from={p.start} durationInFrames={p.duration} layout="none">
                <Enters enter={p.enter}>
                  <Clip name={p.take} from={p.from} />
                </Enters>
              </Sequence>
            ))}
          </Phone>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Enters: React.FC<{ enter?: Enter; children: React.ReactNode }> = ({ enter, children }) => {
  const frame = useCurrentFrame();
  if (!enter) return <>{children}</>;
  const p = interpolate(frame, [0, TRANSITION[enter]], [0, 1], { ...clamp, easing: enter === "cover" ? ease.ios : ease.out });
  const style: React.CSSProperties =
    enter === "cover"
      ? { translate: `0 ${(1 - p) * 844}px`, boxShadow: "0 -10px 40px rgba(0,0,0,0.18)" }
      : { opacity: p };
  return <div style={{ position: "absolute", inset: 0, overflow: "hidden", ...style }}>{children}</div>;
};

const Caption: React.FC<{ caption: string; sub: string; last: boolean }> = ({ caption, sub, last }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const words = caption.split(" ");
  const out = last ? 0 : interpolate(frame, [durationInFrames - 10, durationInFrames - 2], [0, 1], { ...clamp, easing: ease.out });
  const subIn = interpolate(frame, [12, 28], [0, 1], { ...clamp, easing: ease.out });
  return (
    <div style={{ position: "absolute", left: 88, right: 88, top: 128, opacity: 1 - out, translate: `0 ${-out * 14}px` }}>
      <div style={{ fontFamily: font, fontWeight: 700, fontSize: 74, lineHeight: 1.08, letterSpacing: -2.2, color: color.ink }}>
        {words.map((w, i) => {
          const p = interpolate(frame, [2 + i * 2.5, 20 + i * 2.5], [0, 1], { ...clamp, easing: ease.out });
          return (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: 8, marginBottom: -8 }}>
              <span style={{ display: "inline-block", translate: `0 ${(1 - p) * 100}%` }}>{w}&nbsp;</span>
            </span>
          );
        })}
      </div>
      <div style={{ marginTop: 18, fontFamily: font, fontWeight: 400, fontSize: 36, lineHeight: 1.3, color: color.inkSoft, opacity: subIn, translate: `0 ${(1 - subIn) * 10}px` }}>
        {sub}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Outro
// ---------------------------------------------------------------------------

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 22], [0, 1], { ...clamp, easing: ease.out });
  const open = Math.max(snip(frame, 18), snip(frame, 40, { open: 11, close: 5 }));
  const cut = interpolate(frame, [55, 60], [0, 1], { ...clamp, easing: ease.out });
  const line = interpolate(frame, [58, 76], [0, 1], { ...clamp, easing: ease.out });
  const small = interpolate(frame, [68, 86], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: enter }}>
      <div style={{ marginTop: 520, translate: `0 ${(1 - enter) * 40}px` }}>
        <Shears width={700} open={open} />
      </div>
      <div style={{ marginTop: 56 }}>
        <Wordmark size={132} cut={cut} />
      </div>
      <div style={{ marginTop: 44, fontFamily: font, fontWeight: 500, fontSize: 46, letterSpacing: -0.8, color: color.ink, opacity: line, translate: `0 ${(1 - line) * 12}px` }}>
        Ustanı seç. Vaxtını tut.
      </div>
      <div style={{ marginTop: 18, fontFamily: font, fontWeight: 400, fontSize: 30, color: color.inkMuted, opacity: small }}>
        Bakı · tezliklə
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Photographic finish: soft key light, vignette, live film grain.
// ---------------------------------------------------------------------------

export const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(120% 80% at 28% 18%, rgba(255,253,249,0.9) 0%, rgba(255,253,249,0) 60%), radial-gradient(140% 100% at 50% 50%, rgba(0,0,0,0) 55%, rgba(60,44,28,0.16) 100%)",
    }}
  />
);

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", opacity: 0.32 }}>
      <svg width="100%" height="100%">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.5  0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0.55 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
