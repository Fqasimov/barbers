import React from "react";
import { AbsoluteFill, Audio, Freeze, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

import { Clip } from "../Clip";
import { Phone, phoneSize, PT } from "../Phone";
import { Backdrop, Grain } from "../Promo";
import { clamp, color, ease, font } from "../theme";

/*
 * Fixed versions of two videos made elsewhere (public/ugc/). Their live-action
 * footage stays; every part that shows the app is replaced with the real app:
 * the real launch animation and logo, the current screens and prices (Pro 49 ₼).
 */

const W = 1080;
const H = 1920;

// ---------------------------------------------------------------------------
// 20 s ad: footage up to the phone, then the real app (launch → sign-up → Pro trial)
// ---------------------------------------------------------------------------

const CUT = 144; // footage until just before its (made-up) home screen
const XF = 14;
const PHONE_AT = CUT - XF;
export const FIXED_AD_FRAMES = 600;

/** Pieces of the "trial" take, laid end to end inside the phone. */
const PIECES = (() => {
  const raw = [
    { from: 0, to: 140, rate: 1.25 }, // the yazılnow launch animation
    { from: 545, to: 1080, rate: 2.8 }, // salon sign-up: owner, salon, email code
    { from: 1080, to: 1345, rate: 1 }, // plans: Pro 49 ₼ → free trial → dashboard
  ];
  let at = 0;
  return raw.map((p) => {
    const length = Math.ceil((p.to - p.from) / p.rate);
    const out = { ...p, at, length };
    at += length;
    return out;
  });
})();

const PHONE_W = 900;

const AppPhone: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = phoneSize(PHONE_W);
  const t = frame / 30;
  const turnY = Math.sin(t * 0.7) * 2.2 + Math.sin(t * 1.9) * 0.4;
  const turnX = Math.sin(t * 0.55 + 1.2) * 1.4;
  const driftY = Math.sin(t * 0.45) * 12;
  return (
    <AbsoluteFill style={{ background: color.linen }}>
      <Backdrop />
      <div
        style={{
          position: "absolute",
          left: (W - PHONE_W) / 2,
          top: (H - height) / 2 + driftY,
          width: PHONE_W,
          height,
          perspective: 2600,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 46,
            top: 80,
            width: PHONE_W,
            height: height - 40,
            borderRadius: 160,
            background: "rgba(42, 32, 21, 0.14)",
            filter: "blur(52px)",
            transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)` }}>
          <Phone width={PHONE_W}>
            {PIECES.map((p, i) => (
              <Sequence key={i} from={p.at} durationInFrames={i === PIECES.length - 1 ? undefined : p.length} layout="none">
                <Clip name="trial" from={p.from} playbackRate={p.rate} />
              </Sequence>
            ))}
          </Phone>
        </div>
      </div>
      <Grain />
    </AbsoluteFill>
  );
};

export const FixedAd: React.FC = () => {
  const frame = useCurrentFrame();
  const phoneIn = interpolate(frame, [PHONE_AT, CUT], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Audio src={staticFile("ugc/ad20.mp4")} />
      <Sequence durationInFrames={CUT} layout="none">
        <OffthreadVideo src={staticFile("ugc/ad20.mp4")} muted style={{ width: W, height: H, objectFit: "cover" }} />
      </Sequence>
      <Sequence from={PHONE_AT} layout="none">
        <AbsoluteFill style={{ opacity: phoneIn, transform: `scale(${1.04 - 0.04 * phoneIn})` }}>
          <AppPhone />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 10 s barber video: footage, then the real launch animation full screen
// ---------------------------------------------------------------------------

const B_CUT = 165; // footage until its (made-up) logo card
const B_XF = 12;
const LAUNCH = 152; // the app's launch animation, up to the finished logo
const TAG_HOLD = 45;
export const FIXED_BARBER_FRAMES = B_CUT - B_XF + LAUNCH + TAG_HOLD;

/** The app screen scaled to cover the frame: the launch animation is centred, so a crop keeps it whole. */
const FullScreenApp: React.FC = () => {
  const s = W / PT.w;
  return (
    <AbsoluteFill style={{ background: color.linen, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: (H - PT.h * s) / 2, width: PT.w, height: PT.h, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <Clip name="trial" from={0} />
      </div>
    </AbsoluteFill>
  );
};

export const FixedBarber: React.FC = () => {
  const frame = useCurrentFrame();
  const at = B_CUT - B_XF;
  const appIn = interpolate(frame, [at, B_CUT], [0, 1], clamp);
  const tag = interpolate(frame, [at + LAUNCH - 20, at + LAUNCH + 6], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Audio src={staticFile("ugc/barber.mp4")} />
      <Sequence durationInFrames={B_CUT} layout="none">
        <OffthreadVideo src={staticFile("ugc/barber.mp4")} muted style={{ width: W, height: H, objectFit: "cover" }} />
      </Sequence>
      <Sequence from={at} layout="none">
        <AbsoluteFill style={{ opacity: appIn }}>
          {/* Hold the finished logo once the animation is done. */}
          {frame - at < LAUNCH ? (
            <FullScreenApp />
          ) : (
            <Freeze frame={LAUNCH - 1}>
              <FullScreenApp />
            </Freeze>
          )}
        </AbsoluteFill>
      </Sequence>
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 1060,
          opacity: tag,
          transform: `translateY(${(1 - tag) * 24}px)`,
        }}
      >
        <div style={{ fontFamily: font, fontWeight: 500, fontSize: 52, color: color.ink, letterSpacing: -0.5 }}>Save your time with us</div>
        <div style={{ fontFamily: font, fontWeight: 600, fontSize: 40, color: color.nar, marginTop: 18 }}>yazilnow.az</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
