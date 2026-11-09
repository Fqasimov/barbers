import React from "react";
import { AbsoluteFill, Audio, Freeze, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";

import iconTrack from "../../public/ugc/ad20-icon-track.json";
import { Clip, TRIAL_DEMO_CODE } from "../Clip";
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
// 20 s ad: footage up to the tap on the app (with the real icon), then the real app
// ---------------------------------------------------------------------------

const CUT = 209; // footage up to the tap on the app icon (its own "app opening" follows)
const ZOOM = 12; // the app opens out of the icon, like iOS
export const FIXED_AD_FRAMES = 600;

/** Where the footage's home-screen icon is, per frame (template-tracked), as [x, y, size]. */
const ICON: Record<string, [number, number, number]> = iconTrack as unknown as Record<string, [number, number, number]>;

/** Pieces of the "trial" take, laid end to end inside the phone. */
const PIECES = (() => {
  const raw = [
    { from: 0, to: 140, rate: 1.4 }, // the yazılnow launch animation
    { from: 545, to: 1080, rate: 3.2 }, // salon sign-up: owner, salon, email code
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
                <Clip name="trial" from={p.from} playbackRate={p.rate} hide={[TRIAL_DEMO_CODE]} />
              </Sequence>
            ))}
          </Phone>
        </div>
      </div>
      <Grain />
    </AbsoluteFill>
  );
};

/** The real app icon over the footage's made-up one, following it; dimmed while pressed. */
const RealIcon: React.FC = () => {
  const frame = useCurrentFrame();
  const box = ICON[String(frame)];
  if (!box) return null;
  const [x, y, size] = box;
  const pressed = 1;
  // The footage is soft and slightly green; match it.
  const soft = frame < 168 ? 2.2 : 0.8;
  return (
    <Img
      src={staticFile("ugc/app-icon.png")}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size * 0.225,
        filter: `blur(${soft}px) brightness(${0.93 * pressed}) saturate(0.85) sepia(0.12) hue-rotate(18deg)`,
      }}
    />
  );
};

export const FixedAd: React.FC = () => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [CUT, CUT + ZOOM], [0, 1], { ...clamp, easing: ease.ios });
  const [ix, iy, isz] = ICON["208"];
  const cx = ix + isz / 2;
  const cy = iy + isz / 2;
  const sc = interpolate(open, [0, 1], [isz / W, 1]);
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Audio src={staticFile("ugc/ad20.mp4")} />
      <Sequence durationInFrames={CUT + ZOOM} layout="none">
        <OffthreadVideo src={staticFile("ugc/ad20.mp4")} muted style={{ width: W, height: H, objectFit: "cover" }} />
        <RealIcon />
      </Sequence>
      <Sequence from={CUT} layout="none">
        <AbsoluteFill
          style={{
            transformOrigin: "0 0",
            transform: `translate(${(1 - open) * (cx - (W * sc) / 2)}px, ${(1 - open) * (cy - (H * sc) / 2)}px) scale(${sc})`,
            borderRadius: (1 - open) * 220,
            overflow: "hidden",
            opacity: interpolate(open, [0, 0.25], [0.6, 1], clamp),
          }}
        >
          <AppPhone />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// 10 s barber video: footage, then the real scissors cut and the logo
// ---------------------------------------------------------------------------

const B_CUT = 165; // footage until its (made-up) logo card
const B_XF = 12;
const SNIP = 27; // the launch animation's scissors cut, up to the scissors at rest
const LOGO_AT = 130; // the finished logo in the launch animation
const LOGO_XF = 10;
export const FIXED_BARBER_FRAMES = 300;

/** A frame of the app screen scaled to cover the picture (the launch animation is centred). */
const FullScreenApp: React.FC<{ from: number }> = ({ from }) => {
  const s = W / PT.w;
  return (
    <AbsoluteFill style={{ background: color.linen, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: (H - PT.h * s) / 2, width: PT.w, height: PT.h, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <Clip name="trial" from={from} />
      </div>
    </AbsoluteFill>
  );
};

/** Only the scissors cut, then the logo: the tools in between are left out. */
export const FixedBarber: React.FC = () => {
  const frame = useCurrentFrame();
  const at = B_CUT - B_XF;
  const local = frame - at;
  const appIn = interpolate(frame, [at, B_CUT], [0, 1], clamp);
  const logo = interpolate(local, [SNIP, SNIP + LOGO_XF], [0, 1], { ...clamp, easing: ease.out });
  const tag = interpolate(local, [SNIP + LOGO_XF, SNIP + LOGO_XF + 22], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill style={{ background: "black" }}>
      <Audio src={staticFile("ugc/barber.mp4")} />
      <Sequence durationInFrames={B_CUT} layout="none">
        <OffthreadVideo src={staticFile("ugc/barber.mp4")} muted style={{ width: W, height: H, objectFit: "cover" }} />
      </Sequence>
      <Sequence from={at} layout="none">
        <AbsoluteFill style={{ opacity: appIn }}>
          {local < SNIP ? (
            <FullScreenApp from={0} />
          ) : (
            <Freeze frame={SNIP}>
              <FullScreenApp from={0} />
            </Freeze>
          )}
          <AbsoluteFill style={{ opacity: logo }}>
            <Freeze frame={0}>
              <FullScreenApp from={LOGO_AT} />
            </Freeze>
          </AbsoluteFill>
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
