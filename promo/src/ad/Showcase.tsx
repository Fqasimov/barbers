import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";

import { Clip, type Hide, type TakeName } from "../Clip";
import { Phone, phoneSize } from "../Phone";
import { Backdrop, Grain } from "../Promo";
import { Shears, snip } from "../Shears";
import { clamp, color, ease, font } from "../theme";

/*
 * Pre-launch showcase, 25 s, 9:16: how the app works. Every screen is a real recording of
 * the current app. Clients: discover salons, find a free time, the map, a salon page,
 * booking in four taps. Salons: sign up, the four plans and the free trial, add a barber,
 * the dashboard. Ends on the logo, "coming soon".
 */
const W = 1080;
const PHONE_W = 640;
const XF = 6; // cross-fade between shots

/** The demo-mode e-mail code box on the owner take's verify screen (never shown in production). */
const OWNER_DEMO_CODE: Hide = { from: 400, to: 480, x: 12, y: 150, w: 366, h: 150, color: "rgb(243, 239, 232)" };

type Shot = { take: TakeName; from: number; to: number; rate: number; kicker: string; title: string; hide?: Hide[] };
const SHOTS: Shot[] = [
  { take: "trial", from: 0, to: 140, rate: 3.1, kicker: "Tezliklə", title: "yazılnow necə işləyir?" },
  { take: "home2", from: 0, to: 180, rate: 2.2, kicker: "Müştərilər üçün", title: "Bakının salonları bir tətbiqdə" },
  { take: "find2", from: 0, to: 123, rate: 1.7, kicker: "Müştərilər üçün", title: "Boş vaxtı tapın: xidmət, gün, saat" },
  { take: "map2", from: 0, to: 81, rate: 1.6, kicker: "Müştərilər üçün", title: "Yaxınlıqdakı salonlar xəritədə" },
  { take: "salon2", from: 0, to: 78, rate: 1.3, kicker: "Müştərilər üçün", title: "Ustalar, qiymətlər, rəylər" },
  { take: "book2", from: 0, to: 186, rate: 1.8, kicker: "Müştərilər üçün", title: "Xidmət → usta → vaxt → təsdiq" },
  { take: "owner", from: 24, to: 470, rate: 7, kicker: "Salonlar üçün", title: "Salonunuzu qeydiyyatdan keçirin", hide: [OWNER_DEMO_CODE] },
  { take: "owner", from: 470, to: 625, rate: 2.4, kicker: "Salonlar üçün", title: "Plan seçin: 10, 29 və ya 49 ₼ · 30 gün pulsuz" },
  { take: "owner", from: 780, to: 965, rate: 3, kicker: "Salonlar üçün", title: "Ustalarınızı əlavə edin" },
  { take: "owner", from: 990, to: 1118, rate: 2, kicker: "Salonlar üçün", title: "Növbələr, təqvim, rəylər: hamısı bir paneldə" },
];
const len = (s: Shot) => Math.ceil((s.to - s.from) / s.rate);
const STARTS = SHOTS.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + len(SHOTS[i - 1]) - XF], []);
const PHONE_END = STARTS[STARTS.length - 1] + len(SHOTS[SHOTS.length - 1]);
const OUTRO = 66;
const OUTRO_AT = PHONE_END - 10;
export const SHOWCASE_FRAMES = OUTRO_AT + OUTRO;

const inOut = Easing.bezier(0.77, 0, 0.175, 1);

export const Showcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = phoneSize(PHONE_W);
  const t = frame / 30;
  const turnY = Math.sin(t * 0.7) * 2 + Math.sin(t * 1.9) * 0.4;
  const turnX = Math.sin(t * 0.55 + 1.2) * 1.3;
  const out = interpolate(frame, [OUTRO_AT, OUTRO_AT + 14], [0, 1], { ...clamp, easing: inOut });
  const phoneIn = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: ease.out });
  const top = 470;

  return (
    <AbsoluteFill style={{ background: color.linen }}>
      <Backdrop />
      <AbsoluteFill style={{ opacity: 1 - out, transform: `scale(${1 - out * 0.06})` }}>
        <div
          style={{
            position: "absolute",
            left: (W - PHONE_W) / 2,
            top: top + (1 - phoneIn) * 80,
            width: PHONE_W,
            height,
            perspective: 2200,
            opacity: phoneIn,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 26,
              top: 46,
              width: PHONE_W,
              height: height - 24,
              borderRadius: 90,
              background: "rgba(42, 32, 21, 0.16)",
              filter: "blur(30px)",
              transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)`,
            }}
          />
          <div style={{ position: "absolute", inset: 0, transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)` }}>
            <Phone width={PHONE_W}>
              {SHOTS.map((s, i) => (
                <Sequence key={i} from={STARTS[i]} durationInFrames={len(s)} layout="none">
                  <Fade at={STARTS[i]} first={i === 0}>
                    <Clip name={s.take} from={s.from} playbackRate={s.rate} hide={s.hide} />
                  </Fade>
                </Sequence>
              ))}
            </Phone>
          </div>
        </div>
        {SHOTS.map((s, i) => (
          <Caption key={i} shot={s} at={STARTS[i]} end={STARTS[i] + len(s)} frame={frame} />
        ))}
      </AbsoluteFill>
      <Sequence from={OUTRO_AT}>
        <End />
      </Sequence>
      <Grain />
    </AbsoluteFill>
  );
};

const Fade: React.FC<{ at: number; first: boolean; children: React.ReactNode }> = ({ at, first, children }) => {
  const frame = useCurrentFrame();
  const o = first ? 1 : interpolate(frame, [0, XF], [0, 1], clamp);
  void at;
  return <div style={{ position: "absolute", inset: 0, opacity: o }}>{children}</div>;
};

/** Kicker and title above the phone; the kicker only animates when it changes. */
const Caption: React.FC<{ shot: Shot; at: number; end: number; frame: number }> = ({ shot, at, end, frame }) => {
  if (frame < at || frame >= end - XF) return null;
  const i = SHOTS.indexOf(shot);
  const newKicker = i === 0 || SHOTS[i - 1].kicker !== shot.kicker;
  const inP = interpolate(frame, [at, at + 10], [0, 1], { ...clamp, easing: ease.out });
  const kick = newKicker ? inP : 1;
  return (
    <div style={{ position: "absolute", top: 150, left: 70, right: 70, textAlign: "center", fontFamily: font }}>
      <div
        style={{
          display: "inline-block",
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: 5,
          textTransform: "uppercase",
          color: color.nar,
          opacity: kick,
        }}
      >
        {shot.kicker}
      </div>
      <div
        style={{
          marginTop: 22,
          fontWeight: 700,
          fontSize: 62,
          lineHeight: 1.1,
          letterSpacing: -1.2,
          color: color.ink,
          opacity: inP,
          transform: `translateY(${(1 - inP) * 18}px)`,
        }}
      >
        {shot.title}
      </div>
    </div>
  );
};

const End: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [4, 22], [0, 1], { ...clamp, easing: ease.out });
  const open = snip(frame, 10);
  const line = interpolate(frame, [22, 36], [0, 1], { ...clamp, easing: ease.out });
  const small = interpolate(frame, [30, 44], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: enter, fontFamily: font }}>
      <div style={{ marginTop: 560, translate: `0 ${(1 - enter) * 40}px` }}>
        <Shears width={560} open={open} />
      </div>
      <div style={{ marginTop: 34, fontWeight: 800, fontSize: 124, letterSpacing: -5, color: color.ink, lineHeight: 1 }}>
        yazılnow
      </div>
      <div style={{ marginTop: 40, fontWeight: 600, fontSize: 48, color: color.ink, opacity: line }}>
        Save your time with us
      </div>
      <div style={{ marginTop: 26, fontWeight: 500, fontSize: 34, color: color.inkMuted, opacity: small }}>
        Tezliklə App Store və Google Play-də
      </div>
      <div style={{ marginTop: 14, fontWeight: 700, fontSize: 36, color: color.nar, opacity: small }}>yazilnow.az</div>
    </AbsoluteFill>
  );
};
