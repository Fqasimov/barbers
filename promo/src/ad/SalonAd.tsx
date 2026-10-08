import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { Clip, takes } from "../Clip";
import { Phone, phoneSize, PT } from "../Phone";
import { Backdrop, Wordmark } from "../Promo";
import { Shears, snip } from "../Shears";
import { clamp, color, ease, font } from "../theme";
import { AdSound } from "./sound";
import { Shatter } from "./Shatter";
import {
  AT,
  BREAK,
  COIN_AT,
  CTA_LOGO,
  CTA_TAP,
  CUT,
  FEATURE_AT,
  GROWTH_CLIP_AT,
  OV,
  REVEAL_CUT,
  SALON_AD_FRAMES,
  SNIPS,
  TEAM_POPS,
} from "./timeline";

export { SALON_AD_FRAMES };

const dark = { bg: "#0D0B0A", text: "#F3EFE8", soft: "rgba(243,239,232,0.62)" };
const green = "#2F7D4F";

/** 0 → 1 between two frames on the app's ease-out curve. */
const ramp = (frame: number, from: number, len: number, easing = ease.out) =>
  interpolate(frame, [from, from + len], [0, 1], { ...clamp, easing });

/** Decaying camera shake after each hit. */
const shake = (frame: number, hits: [number, number][]) => {
  let x = 0;
  let y = 0;
  for (const [at, amp] of hits) {
    const t = frame - at;
    if (t < 0 || t > 24) continue;
    const k = amp * Math.exp(-t / 5);
    x += k * Math.sin(t * 2.9 + at);
    y += k * Math.cos(t * 3.7 + at);
  }
  return `${x}px ${y}px`;
};

// ---------------------------------------------------------------------------

export const SalonAd: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: dark.bg }}>
      <Sequence name="1 Address" from={AT.address} durationInFrames={AT.rivals - AT.address} premountFor={fps}>
        <Address />
      </Sequence>
      <Sequence name="2 Rivals" from={AT.rivals} durationInFrames={AT.receipt - AT.rivals} premountFor={fps}>
        <Rivals />
      </Sequence>
      {/* Under the receipt: the cut opens onto it. */}
      <Sequence name="4 Reveal" from={AT.reveal} durationInFrames={AT.team - AT.reveal + OV} premountFor={fps}>
        <Reveal />
      </Sequence>
      <Sequence name="3 Receipt" from={AT.receipt} durationInFrames={AT.reveal - AT.receipt + 50} premountFor={fps}>
        <Receipt />
      </Sequence>
      <Sequence name="5 Team" from={AT.team} durationInFrames={AT.growth - AT.team + OV} premountFor={fps}>
        <Team />
      </Sequence>
      <Sequence name="6 Growth" from={AT.growth} durationInFrames={AT.features - AT.growth + OV} premountFor={fps}>
        <Growth />
      </Sequence>
      <Sequence name="7 Features" from={AT.features} durationInFrames={AT.cta - AT.features + OV} premountFor={fps}>
        <Features />
      </Sequence>
      <Sequence name="8 CTA" from={AT.cta} premountFor={fps}>
        <Cta />
      </Sequence>
      <Grain />
      <AdSound />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------

const DarkStage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(110% 70% at 30% 22%, #2B2420 0%, ${dark.bg} 62%), ${dark.bg}`,
      ...style,
    }}
  >
    {children}
    <AbsoluteFill style={{ background: "radial-gradient(140% 100% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%)" }} />
  </AbsoluteFill>
);

/** A line that lands hard: big, blurred and too close, then sharp and still. */
const Slam: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: number }> = ({
  at,
  children,
  style,
  from = 1.4,
}) => {
  const frame = useCurrentFrame();
  const p = ramp(frame, at, 9);
  return (
    <div
      style={{
        opacity: p,
        scale: String(from - (from - 1) * p),
        filter: `blur(${(1 - p) * 14}px)`,
        transformOrigin: "left center",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Words rise out of a mask, one after another. */
const Rise: React.FC<{ at: number; text: string; style?: React.CSSProperties; stagger?: number }> = ({
  at,
  text,
  style,
  stagger = 2.5,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={style}>
      {text.split(" ").map((w, i) => {
        const p = ramp(frame, at + i * stagger, 16);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
            <span style={{ display: "inline-block", translate: `0 ${(1 - p) * 110}%` }}>{w}&nbsp;</span>
          </span>
        );
      })}
    </div>
  );
};

const heavy = (size: number, c = dark.text): React.CSSProperties => ({
  fontFamily: font,
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1.04,
  letterSpacing: -size * 0.035,
  color: c,
});

/** Linen scenes move between each other with these. */
type Move = "push" | "zoom" | "slide" | "iris";
const LinenScene: React.FC<{ enter?: Move; exit?: Move; children: React.ReactNode }> = ({ enter, exit, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const e = enter ? ramp(frame, 0, OV, ease.inOut) : 1;
  const x = exit ? ramp(frame, durationInFrames - OV, OV, ease.inOut) : 0;
  const style: React.CSSProperties = {};
  const transforms: string[] = [];
  if (enter === "push") transforms.push(`translateY(${(1 - e) * 1920}px)`);
  if (enter === "zoom") {
    transforms.push(`scale(${0.82 + 0.18 * e})`);
    style.opacity = e;
  }
  if (enter === "slide") transforms.push(`translateX(${(1 - e) * 1080}px)`);
  if (enter === "iris") style.clipPath = `circle(${e * 120}% at 50% 62%)`;
  if (exit === "push") transforms.push(`translateY(${-x * 1920}px)`);
  if (exit === "zoom") {
    transforms.push(`scale(${1 + 0.35 * x})`);
    style.filter = `blur(${x * 12}px)`;
  }
  if (exit === "slide") transforms.push(`translateX(${-x * 420}px)`);
  return (
    <AbsoluteFill style={{ background: color.linen, transform: transforms.join(" "), ...style }}>
      <Backdrop />
      {children}
      {exit === "slide" ? <AbsoluteFill style={{ background: `rgba(20,18,16,${x * 0.35})` }} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 1. "Dear barbershop, beauty salon and spa clinic owners,"
// ---------------------------------------------------------------------------

const ADDRESS = [
  { at: 12, text: "bərbərxana,", c: dark.text },
  { at: 40, text: "gözəllik salonu", c: dark.text },
  { at: 66, text: "və SPA klinika", c: dark.text },
  { at: 92, text: "sahibləri,", c: color.nar },
];

const Address: React.FC = () => {
  const frame = useCurrentFrame();
  const out = ramp(frame, 128, 22, ease.inOut);
  return (
    <DarkStage style={{ translate: shake(frame, [[12, 14], [92, 10]]) }}>
      <div
        style={{
          position: "absolute",
          left: 88,
          right: 60,
          top: 640,
          scale: String(1 + frame * 0.0004),
          transformOrigin: "left center",
          opacity: 1 - out,
          filter: `blur(${out * 16}px)`,
        }}
      >
        <Slam at={6} from={1.1} style={{ fontFamily: font, fontWeight: 600, fontSize: 40, letterSpacing: 9, color: dark.soft, marginBottom: 30 }}>
          DƏYƏRLİ
        </Slam>
        {ADDRESS.map((l) => (
          <Slam key={l.text} at={l.at} style={{ ...heavy(112, l.c), marginBottom: 10 }}>
            {l.text}
          </Slam>
        ))}
      </div>
    </DarkStage>
  );
};

// ---------------------------------------------------------------------------
// 2. The booking apps they used shatter: "Each of you has been deceived."
// ---------------------------------------------------------------------------

/**
 * Unbranded stand-ins for "the other booking apps". Real competitors' logos are
 * trademarks: showing them breaking next to "you were deceived" invites a legal
 * complaint, so these stay generic unless a lawyer clears otherwise.
 */
const RIVALS = [
  { hue: "#4A6FC9", glyph: "calendar" },
  { hue: "#7B57C6", glyph: "scissors" },
  { hue: "#1F8F84", glyph: "clock" },
  { hue: "#C8507A", glyph: "star" },
] as const;

const TILE = 176;
const TILE_GAP = 40;
const TILES_TOP = 330;

const Glyph: React.FC<{ name: (typeof RIVALS)[number]["glyph"] }> = ({ name }) => (
  <svg width="48%" height="48%" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    {name === "calendar" ? (
      <>
        <rect x={3} y={4} width={18} height={18} rx={2} />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ) : name === "scissors" ? (
      <>
        <circle cx={6} cy={6} r={3} />
        <circle cx={6} cy={18} r={3} />
        <path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12" />
      </>
    ) : name === "clock" ? (
      <>
        <circle cx={12} cy={12} r={10} />
        <path d="M12 6v6l4 2" />
      </>
    ) : (
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    )}
  </svg>
);

const RivalFace: React.FC<{ hue: string; glyph: (typeof RIVALS)[number]["glyph"] }> = ({ hue, glyph }) => (
  <div
    style={{
      width: TILE,
      height: TILE,
      borderRadius: 42,
      background: `linear-gradient(150deg, ${hue} 0%, #1b1b22 140%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 18px 40px rgba(0,0,0,0.45)",
      filter: "saturate(0.7)",
    }}
  >
    <Glyph name={glyph} />
  </div>
);

const Rivals: React.FC = () => {
  const frame = useCurrentFrame();
  const qOut = ramp(frame, 80, 10, ease.inOut);
  const lift = ramp(frame, BREAK + 30, 30, ease.inOut);
  const flash = interpolate(frame, [BREAK, BREAK + 7], [0.55, 0], clamp);
  const out = ramp(frame, 224, 16, ease.inOut);
  return (
    <DarkStage style={{ translate: shake(frame, [[92, 8], [BREAK, 26]]), opacity: interpolate(frame, [0, 10], [0, 1], clamp) }}>
      {RIVALS.map((r, i) => {
        const p = ramp(frame, 6 + i * 8, 14);
        const labelOut = ramp(frame, BREAK - 4, 6);
        return (
          <div
            key={r.glyph}
            style={{ position: "absolute", left: 92, top: TILES_TOP + i * (TILE + TILE_GAP), opacity: p, translate: `${(1 - p) * -60}px 0` }}
          >
            <Shatter seed={`rival-${i}`} size={TILE} frame={frame} crackAt={96 + i * 3} breakAt={BREAK}>
              <RivalFace hue={r.hue} glyph={r.glyph} />
            </Shatter>
            {/* A name nobody can read: these stand for every app, not one brand. */}
            <div
              style={{
                position: "absolute",
                left: TILE + 26,
                top: TILE / 2 - 12,
                width: 140 + ((i * 37) % 60),
                height: 22,
                borderRadius: 11,
                background: "rgba(243,239,232,0.22)",
                filter: "blur(5px)",
                opacity: (1 - labelOut) * (1 - qOut * 0.0),
              }}
            />
          </div>
        );
      })}

      <div style={{ position: "absolute", left: 470, right: 70, top: 640, opacity: 1 - qOut, filter: `blur(${qOut * 10}px)` }}>
        <Rise at={18} text="Onlayn rezervasiya xidmətlərindən istifadə edirdiniz?" style={{ ...heavy(64), lineHeight: 1.12 }} />
      </div>

      <div style={{ position: "absolute", left: 88, right: 60, top: 1290, translate: `0 ${-lift * 470}px`, opacity: 1 - out, filter: `blur(${out * 14}px)` }}>
        <Slam at={92} style={heavy(92)}>
          Siz hər biriniz
        </Slam>
        <Slam at={BREAK} from={1.6} style={{ ...heavy(124, color.nar), marginTop: 12 }}>
          aldadılmısınız.
        </Slam>
      </div>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, pointerEvents: "none" }} />
    </DarkStage>
  );
};

// ---------------------------------------------------------------------------
// 3. The bill that grows with every hire, until the shears cut it.
// ---------------------------------------------------------------------------

/** Illustrative only — the point is the shape of the bill, not anyone's price list. */
const BILL = [
  { label: "Aylıq abunə", amount: 49, at: COIN_AT[0] },
  { label: "+ 1 usta", amount: 15, at: COIN_AT[1] },
  { label: "+ 1 bərbər", amount: 15, at: COIN_AT[2] },
  { label: "+ 1 manikür ustası", amount: 15, at: COIN_AT[3] },
  { label: "+ 1 kosmetoloq", amount: 15, at: COIN_AT[4] },
  { label: "+ 1 işçi", amount: 15, at: COIN_AT[5] },
];
const CUT_Y = 1035;

const Receipt: React.FC = () => {
  const frame = useCurrentFrame();
  const split = ramp(frame, CUT, 38, ease.inOut);
  if (split <= 0) return <ReceiptStage />;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 0 ${1920 - CUT_Y}px 0)`, transform: `translateY(${-split * 1150}px) rotate(${-split * 4}deg)` }}>
        <ReceiptStage />
      </AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(${CUT_Y}px 0 0 0)`, transform: `translateY(${split * 1150}px) rotate(${split * 3}deg)` }}>
        <ReceiptStage />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const ReceiptStage: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = ramp(frame, 0, 14);
  const paper = ramp(frame, 18, 20, ease.ios);
  const jolt = BILL.reduce((s, b) => {
    const t = frame - b.at;
    return t >= 0 && t < 12 ? s + 8 * Math.exp(-t / 3) : s;
  }, 0);
  const shown = BILL.filter((b) => frame >= b.at);
  // The total rolls up to each new sum instead of jumping.
  const total = BILL.reduce((s, b) => s + b.amount * ramp(frame, b.at, 8), 0);
  const lastHit = shown.at(-1)?.at ?? -99;
  const pulse = 1 + 0.08 * Math.exp(-Math.max(0, frame - lastHit) / 4) * (frame >= lastHit ? 1 : 0);

  const sweep = interpolate(frame, [200, CUT], [-700, 1300], clamp);
  const open = Math.max(...SNIPS.map((s) => snip(frame, s - 5, { open: 5, close: 4 })));
  const shearsIn = ramp(frame, 196, 8);

  return (
    <DarkStage style={{ opacity: enter }}>
      <div style={{ position: "absolute", left: 88, right: 70, top: 150 }}>
        <Rise at={4} text="Hər əlavə usta, bərbər, işçi üçün" style={{ ...heavy(58), fontWeight: 600, lineHeight: 1.14 }} />
        <Slam at={26} style={{ ...heavy(104, color.nar), marginTop: 10 }}>
          əlavə ödəniş.
        </Slam>
      </div>

      <div
        style={{
          position: "absolute",
          left: 180,
          width: 720,
          top: 560,
          translate: `0 ${(1 - paper) * 1500 + jolt}px`,
          rotate: "-1.6deg",
          filter: "drop-shadow(0 30px 50px rgba(0,0,0,0.5))",
        }}
      >
        <div style={{ background: "#FBF8F2", padding: "44px 52px 36px", fontFamily: font, color: color.ink }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 600, letterSpacing: 5, color: color.inkMuted }}>
            <span>HESAB</span>
            <span>AYLIQ</span>
          </div>
          <Dashes />
          {BILL.map((b) => {
            const p = ramp(frame, b.at, 7);
            return (
              <div
                key={b.label}
                style={{ display: "flex", justifyContent: "space-between", fontSize: 38, lineHeight: "64px", opacity: p, translate: `${(1 - p) * -16}px 0` }}
              >
                <span style={{ fontWeight: b.amount === 49 ? 600 : 500 }}>{b.label}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: b.amount === 49 ? color.ink : color.nar }}>
                  {b.amount === 49 ? `${b.amount} ₼` : `+${b.amount} ₼`}
                </span>
              </div>
            );
          })}
          <Dashes />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
            <span style={{ fontSize: 40, letterSpacing: 2 }}>CƏMİ</span>
            <span style={{ fontSize: 78, color: color.nar, fontVariantNumeric: "tabular-nums", scale: String(pulse), transformOrigin: "right center", display: "flex", alignItems: "center", gap: 10 }}>
              <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={color.nar} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
              {Math.round(total)} ₼
            </span>
          </div>
        </div>
        {/* Torn bottom edge. */}
        <svg width={720} height={22} viewBox="0 0 720 22" preserveAspectRatio="none" style={{ display: "block" }}>
          <path d={`M0 0 ${Array.from({ length: 37 }, (_, i) => `L${i * 20} ${i % 2 ? 20 : 2}`).join(" ")} L720 0 Z`} fill="#FBF8F2" />
        </svg>
      </div>

      <div style={{ position: "absolute", left: 88, right: 70, top: 1540 }}>
        <Rise at={150} text="Xidmətinizin qiyməti isə" style={{ ...heavy(58), fontWeight: 600 }} />
        <Rise at={160} text="hər dəfə artırılırdı." style={{ ...heavy(80, color.nar), marginTop: 8 }} />
      </div>

      {/* The cut: a bright seam follows the blades across the frame. */}
      {frame >= 200 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: CUT_Y - 1.5,
              width: Math.max(0, sweep + 330),
              height: 3,
              background: "linear-gradient(90deg, rgba(255,255,255,0.0), rgba(255,255,255,0.95) 40%)",
              boxShadow: "0 0 16px rgba(255,240,220,0.9)",
            }}
          />
          <div style={{ position: "absolute", left: sweep, top: CUT_Y - 255, rotate: "28deg", opacity: shearsIn }}>
            <Shears width={620} open={open} />
          </div>
        </>
      ) : null}
    </DarkStage>
  );
};

const Dashes: React.FC = () => (
  <div style={{ margin: "22px 0", borderTop: `3px dashed ${color.line}`, height: 0 }} />
);

// ---------------------------------------------------------------------------
// 4. "Our ustatap.az app and service removes this problem."
// ---------------------------------------------------------------------------

const Reveal: React.FC = () => {
  const frame = useCurrentFrame();
  const word = ramp(frame, 12, 18);
  const cut = ramp(frame, REVEAL_CUT, 5);
  const pill = ramp(frame, 40, 16);
  return (
    <LinenScene exit="push">
      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ marginTop: 470, opacity: word, translate: `0 ${(1 - word) * 30}px`, scale: String(0.94 + 0.06 * word) }}>
          <Wordmark size={190} cut={cut} />
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "14px 34px",
            borderRadius: 40,
            background: color.ink,
            color: color.linen,
            fontFamily: font,
            fontWeight: 600,
            fontSize: 44,
            letterSpacing: -0.5,
            opacity: pill,
            scale: String(0.9 + 0.1 * pill),
          }}
        >
          ustatap.az
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 88, right: 88, top: 1060, textAlign: "center" }}>
        <Rise at={58} text="Mobil tətbiqimiz və xidmətimiz" style={{ fontFamily: font, fontWeight: 500, fontSize: 44, color: color.inkSoft }} />
        <Rise at={66} text="bu problemi" style={{ ...heavy(104, color.ink), marginTop: 22 }} />
        <Rise at={72} text="aradan qaldırır." style={{ ...heavy(104, color.nar) }} />
      </div>
    </LinenScene>
  );
};

// ---------------------------------------------------------------------------
// 5. The team grows, the price doesn't.
// ---------------------------------------------------------------------------

const TEAM = [
  ["R", "#B4233C"], ["A", "#8C6A4F"], ["N", "#3F5E5A"], ["E", "#C08A3E"],
  ["L", "#5B4A7A"], ["K", "#2F6E8C"], ["S", "#9C4F6B"], ["T", "#4F7A43"],
  ["G", "#7A5A3A"], ["M", "#35506E"], ["F", "#A0563B"], ["Z", "#5E6B3A"],
] as const;
const AV = 170;

const Team: React.FC = () => {
  const frame = useCurrentFrame();
  const count = TEAM_POPS.filter((p) => frame >= p).length;
  const card = ramp(frame, 18, 18);
  return (
    <LinenScene enter="push" exit="zoom">
      <div style={{ position: "absolute", left: 88, right: 88, top: 190 }}>
        <Rise at={10} text="Əlavə usta —" style={heavy(104, color.ink)} />
        <Rise at={18} text="əlavə ödəniş yox." style={heavy(104, color.nar)} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 88,
          right: 88,
          top: 560,
          padding: "34px 40px",
          borderRadius: 40,
          background: color.surface,
          boxShadow: "0 24px 60px rgba(42,32,21,0.12)",
          opacity: card,
          translate: `0 ${(1 - card) * 40}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: font,
        }}
      >
        <div>
          <div style={{ fontSize: 34, color: color.inkMuted, fontWeight: 500 }}>Komandanız</div>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3, color: color.ink, fontVariantNumeric: "tabular-nums" }}>
            {count} usta
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 34, color: color.inkMuted, fontWeight: 500 }}>Əlavə ödəniş</div>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3, color: green }}>0 ₼</div>
        </div>
      </div>

      <div style={{ position: "absolute", left: 88, top: 900, width: 904, display: "flex", flexWrap: "wrap", gap: (904 - 4 * AV) / 3, rowGap: 64 }}>
        {TEAM.map(([letter, bg], i) => {
          const t = frame - TEAM_POPS[i];
          const p = t < 0 ? 0 : 1 - Math.exp(-t / 3) * Math.cos(t * 0.55);
          const tag = interpolate(t, [0, 4, 16, 26], [0, 1, 1, 0], clamp);
          return (
            <div key={i} style={{ position: "relative", width: AV, height: AV }}>
              <div
                style={{
                  width: AV,
                  height: AV,
                  borderRadius: AV / 2,
                  background: bg,
                  color: "#fff",
                  fontFamily: font,
                  fontWeight: 600,
                  fontSize: 70,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  scale: String(Math.max(0, p)),
                  boxShadow: "0 12px 26px rgba(42,32,21,0.18)",
                }}
              >
                {letter}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: -20 - Math.max(0, t) * 2,
                  textAlign: "center",
                  fontFamily: font,
                  fontWeight: 700,
                  fontSize: 36,
                  color: green,
                  opacity: tag,
                }}
              >
                +0 ₼
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 88, right: 88, top: 1660 }}>
        <Rise at={140} text="Bir qiymət. Bütün komanda daxildir." style={{ fontFamily: font, fontWeight: 600, fontSize: 50, letterSpacing: -1, color: color.ink }} />
      </div>
    </LinenScene>
  );
};

// ---------------------------------------------------------------------------
// 6. "Want to grow? Online booking won't hold you back — it will drive growth."
// ---------------------------------------------------------------------------

const PHONE_W = 560;

const Growth: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = phoneSize(PHONE_W);
  const rise = ramp(frame, 26, 30, ease.ios);
  const draw = ramp(frame, 40, 120, ease.inOut);
  const turn = interpolate(frame, [0, 220], [-10, 6]);
  // An upward curve: modest at first, then compounding.
  const pts = Array.from({ length: 41 }, (_, i) => {
    const x = (i / 40) * 1080;
    const y = 1500 - Math.pow(i / 40, 2.2) * 780 - Math.sin(i * 1.3) * 18 * (i / 40);
    return [x, y] as const;
  });
  const visible = pts.slice(0, Math.max(2, Math.round(draw * 40) + 1));
  const line = visible.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${line} L${visible.at(-1)![0]} 1920 L0 1920 Z`;
  const head = visible.at(-1)!;
  return (
    <LinenScene enter="zoom" exit="slide">
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color.nar} stopOpacity={0.22} />
            <stop offset="1" stopColor={color.nar} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#growth)" />
        <path d={line} fill="none" stroke={color.nar} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={head[0]} cy={head[1]} r={14} fill={color.nar} />
        <circle cx={head[0]} cy={head[1]} r={30} fill={color.nar} opacity={0.18} />
      </svg>

      <div style={{ position: "absolute", left: 88, right: 88, top: 150 }}>
        <Rise at={6} text="Böyümək istəyirsiniz?" style={heavy(92, color.ink)} />
        <Rise at={34} text="Onlayn rezervasiya buna əngəl yox —" style={{ fontFamily: font, fontWeight: 500, fontSize: 44, color: color.inkSoft, marginTop: 26 }} />
        <Rise at={46} text="artımınızın mühərriki olacaq." style={{ fontFamily: font, fontWeight: 700, fontSize: 52, letterSpacing: -1.2, color: color.nar, marginTop: 6 }} />
      </div>

      <div style={{ position: "absolute", left: (1080 - PHONE_W) / 2, top: 660, perspective: 2400, translate: `0 ${(1 - rise) * 1400}px` }}>
        <div
          style={{
            position: "absolute",
            left: 40,
            top: 70,
            width: PHONE_W,
            height: height - 40,
            borderRadius: 120,
            background: "rgba(42,32,21,0.28)",
            filter: "blur(44px)",
            transform: `rotateY(${turn}deg)`,
          }}
        />
        <div style={{ transform: `rotateY(${turn}deg) rotateX(4deg)` }}>
          <Phone width={PHONE_W}>
            <Sequence from={GROWTH_CLIP_AT} durationInFrames={takes.business.frames} layout="none">
              <Clip name="business" />
            </Sequence>
            {/* The take is over: hold its last frame. */}
            {frame >= GROWTH_CLIP_AT + takes.business.frames ? (
              <Img src={staticFile("rec/business-last.jpg")} style={{ position: "absolute", inset: 0, width: PT.w, height: PT.h }} />
            ) : null}
          </Phone>
        </div>
      </div>
    </LinenScene>
  );
};

// ---------------------------------------------------------------------------
// 7. What a salon gets (our own copy).
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: "pin",
    title: "Xəritədə və axtarışda",
    body: "Yaxınlıqdakı müştərilər salonunuzu dərhal görür.",
  },
  {
    icon: "clock",
    title: "7/24 onlayn növbə",
    body: "Siz yatarkən belə boş vaxtlarınız dolur.",
  },
  {
    icon: "star",
    title: "Yalnız real rəylər",
    body: "Rəy yalnız baş tutmuş ziyarətdən sonra yazılır.",
  },
] as const;

const FeatureIcon: React.FC<{ name: (typeof FEATURES)[number]["icon"] }> = ({ name }) => (
  <svg width={46} height={46} viewBox="0 0 24 24" fill="none" stroke={color.linen} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {name === "pin" ? (
      <>
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx={12} cy={10} r={3} />
      </>
    ) : name === "clock" ? (
      <>
        <circle cx={12} cy={12} r={10} />
        <path d="M12 6v6l4 2" />
      </>
    ) : (
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    )}
  </svg>
);

const Features: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <LinenScene enter="slide">
      <div style={{ position: "absolute", left: 88, right: 88, top: 220 }}>
        <Rise at={8} text="Müştərilər sizi tapır." style={heavy(96, color.ink)} />
        <Rise at={18} text="Siz isə işinizlə məşğul olun." style={{ fontFamily: font, fontWeight: 500, fontSize: 46, color: color.inkSoft, marginTop: 22 }} />
      </div>
      {FEATURES.map((f, i) => {
        const t = frame - FEATURE_AT[i];
        const p = t < 0 ? 0 : 1 - Math.exp(-t / 4.5) * Math.cos(t * 0.32);
        return (
          <div
            key={f.title}
            style={{
              position: "absolute",
              left: 88,
              right: 88,
              top: 640 + i * 300,
              height: 250,
              borderRadius: 40,
              background: color.surface,
              boxShadow: "0 24px 60px rgba(42,32,21,0.10)",
              display: "flex",
              alignItems: "center",
              gap: 36,
              padding: "0 44px",
              translate: `${(1 - p) * 1100}px 0`,
              rotate: `${(1 - p) * 4}deg`,
            }}
          >
            <div style={{ width: 104, height: 104, borderRadius: 52, background: i === 2 ? color.nar : color.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <FeatureIcon name={f.icon} />
            </div>
            <div style={{ fontFamily: font }}>
              <div style={{ fontSize: 50, fontWeight: 700, letterSpacing: -1.2, color: color.ink }}>{f.title}</div>
              <div style={{ fontSize: 36, fontWeight: 400, lineHeight: 1.3, color: color.inkSoft, marginTop: 8 }}>{f.body}</div>
            </div>
          </div>
        );
      })}
    </LinenScene>
  );
};

// ---------------------------------------------------------------------------
// 8. 30 days free, then the button.
// ---------------------------------------------------------------------------


const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const days = Math.round(interpolate(frame, [8, 34], [1, 30], { ...clamp, easing: ease.out }));
  const big = ramp(frame, 6, 16);
  const btn = ramp(frame, 70, 16);
  const press = frame >= CTA_TAP && frame < CTA_TAP + 8 ? 0.95 : 1;
  const ring = interpolate(frame - CTA_TAP, [0, 18], [0, 1], clamp);
  const logo = ramp(frame, CTA_LOGO, 20);
  const cut = ramp(frame, CTA_LOGO + 18, 5);
  return (
    <LinenScene enter="iris">
      <div style={{ position: "absolute", left: 88, right: 88, top: 260, textAlign: "center", opacity: big, scale: String(0.9 + 0.1 * big) }}>
        <div style={{ ...heavy(300, color.ink), fontVariantNumeric: "tabular-nums", lineHeight: 0.95 }}>{days} gün</div>
        <div style={{ ...heavy(170, color.nar), marginTop: 6 }}>pulsuz.</div>
      </div>
      <div style={{ position: "absolute", left: 88, right: 88, top: 900, textAlign: "center" }}>
        <Rise at={40} text="Kart tələb olunmur." style={{ fontFamily: font, fontWeight: 600, fontSize: 50, color: color.ink }} />
        <Rise at={48} text="İstənilən vaxt ləğv edin." style={{ fontFamily: font, fontWeight: 400, fontSize: 44, color: color.inkSoft, marginTop: 8 }} />
      </div>

      <div style={{ position: "absolute", left: 110, right: 110, top: 1150, opacity: btn, translate: `0 ${(1 - btn) * 30}px` }}>
        <div
          style={{
            height: 138,
            borderRadius: 69,
            background: color.ink,
            color: color.linen,
            fontFamily: font,
            fontWeight: 600,
            fontSize: 44,
            letterSpacing: -0.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            scale: String(press),
            boxShadow: "0 22px 50px rgba(20,18,16,0.25)",
          }}
        >
          Salonunuzu qeydiyyatdan keçirin
        </div>
        {frame >= CTA_TAP ? (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 69,
              width: 90,
              height: 90,
              marginLeft: -45,
              marginTop: -45,
              borderRadius: 45,
              border: "3px solid rgba(255,255,255,0.8)",
              background: "rgba(255,255,255,0.18)",
              scale: String(0.6 + ring * 1.4),
              opacity: 1 - ring,
            }}
          />
        ) : null}
      </div>

      <AbsoluteFill style={{ alignItems: "center" }}>
        <div style={{ marginTop: 1440, opacity: logo, translate: `0 ${(1 - logo) * 24}px` }}>
          <Wordmark size={130} cut={cut} />
        </div>
        <div style={{ marginTop: 14, fontFamily: font, fontWeight: 600, fontSize: 48, letterSpacing: -0.5, color: color.ink, opacity: logo }}>
          ustatap.az
        </div>
      </AbsoluteFill>
    </LinenScene>
  );
};

// ---------------------------------------------------------------------------

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.22 }}>
      <svg width="100%" height="100%">
        <filter id="ad-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ad-grain)" />
      </svg>
    </AbsoluteFill>
  );
};
