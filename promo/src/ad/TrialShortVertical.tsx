import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";

import { Clip } from "../Clip";
import { Phone, phoneSize } from "../Phone";
import { Grain } from "../Promo";
import { clamp, color, font } from "../theme";

/**
 * 9:16, with short captions at the sides of the phone. Otherwise the same as the
 * 16:9 cut below.
 *
 * 16:9 version of TrialShort, cut to follow the brand film (1280×720) that ends
 * pushing in on the yazılnow app icon. It opens on that film's last frame and keeps
 * its push-in, dissolves into the app's cream launch screen (in our cream), then pulls back to reveal the phone as the logo
 * animation plays. Then: Pro (49 ₼) and the free trial starting.
 */
const W = 1080;
const H = 1920;
const PHONE_W = 560; // leaves room for captions at both sides
const HANDOFF = 0; // opens straight on the launch screen (the film ends on the icon)
const PULL = 42; // pull back to the whole phone
const INTRO = { from: 0, to: 152 };
const TRIAL = { from: 1080, to: 1205 };
const CUT = 8;
const introAt = HANDOFF;
const trialAt = introAt + (INTRO.to - INTRO.from) - CUT;
export const TRIAL_SHORT_VERTICAL_FRAMES = trialAt + (TRIAL.to - TRIAL.from);

const inOut = Easing.bezier(0.77, 0, 0.175, 1);

export const TrialShortVertical: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = phoneSize(PHONE_W);
  // Their push-in continues on the held frame.
  // Start with the screen filling the frame, then pull back to the whole phone.
  const pullStart = 6;
  const p = interpolate(frame, [pullStart, pullStart + PULL], [0, 1], { ...clamp, easing: inOut });
  // Our shears about the size of the icon in the film, centred where it was.
  const startScale = 3.3;
  const scale = interpolate(p, [0, 1], [startScale, 1]);
  const t = frame / 30;
  const settle = p;
  const turnY = (Math.sin(t * 0.7) * 2 + Math.sin(t * 1.9) * 0.4) * settle;
  const turnX = Math.sin(t * 0.55 + 1.2) * 1.3 * settle;
  const fadeTrial = interpolate(frame, [trialAt, trialAt + CUT], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: color.linen }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(90% 120% at 30% 20%, rgba(255,253,249,0.9) 0%, rgba(255,253,249,0) 60%), radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,0) 55%, rgba(60,44,28,0.16) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (W - PHONE_W) / 2,
          top: (H - height) / 2,
          width: PHONE_W,
          height,
          perspective: 2200,
          transform: `scale(${scale})`,
          transformOrigin: "50% 50%",
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
            background: `rgba(42, 32, 21, ${0.16 * p})`,
            filter: "blur(30px)",
            transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)` }}>
          <Phone width={PHONE_W}>
            <Sequence from={introAt} durationInFrames={INTRO.to - INTRO.from} layout="none">
              <Clip name="trial" from={INTRO.from} />
            </Sequence>
            <Sequence from={trialAt} durationInFrames={TRIAL.to - TRIAL.from} layout="none">
              <div style={{ position: "absolute", inset: 0, opacity: fadeTrial }}>
                <Clip name="trial" from={TRIAL.from} />
              </div>
            </Sequence>
          </Phone>
        </div>
      </div>
      {CAPTIONS.map((c, i) => (
        <Caption key={i} {...c} frame={frame} />
      ))}
      <Grain />
    </AbsoluteFill>
  );
};

type Cap = { text: string; side: "left" | "right"; from: number; to: number; y: number; strong?: boolean };
/** Short lines beside the phone, in turn, never two at once on one side. */
const CAPTIONS: Cap[] = [
  { text: "Bakının salonları", side: "left", from: 50, to: 146, y: 700, strong: true },
  { text: "bir tətbiqdə", side: "left", from: 56, to: 146, y: 812 },
  { text: "Bərbər, saç, dırnaq, spa", side: "right", from: 80, to: 146, y: 1040 },
  { text: "Pro plan", side: "left", from: trialAt + 6, to: TRIAL_SHORT_VERTICAL_FRAMES, y: 690 },
  { text: "49 ₼ / ay", side: "left", from: trialAt + 12, to: TRIAL_SHORT_VERTICAL_FRAMES, y: 750, strong: true },
  { text: "30 gün pulsuz", side: "right", from: trialAt + 40, to: TRIAL_SHORT_VERTICAL_FRAMES, y: 1000, strong: true },
  { text: "Kart tələb olunmur", side: "right", from: trialAt + 52, to: TRIAL_SHORT_VERTICAL_FRAMES, y: 1130 },
];
const MARGIN = (W - PHONE_W) / 2;

const Caption: React.FC<Cap & { frame: number }> = ({ text, side, from, to, y, strong, frame }) => {
  const inP = interpolate(frame, [from, from + 10], [0, 1], { ...clamp, easing: Easing.bezier(0.23, 1, 0.32, 1) });
  const outP = to >= TRIAL_SHORT_VERTICAL_FRAMES ? 0 : interpolate(frame, [to - 8, to], [0, 1], clamp);
  if (frame < from || frame > to) return null;
  const dx = (1 - inP) * (side === "left" ? -18 : 18);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        [side]: 24,
        width: MARGIN - 44,
        textAlign: side === "left" ? "right" : "left",
        fontFamily: font,
        fontWeight: strong ? 700 : 500,
        fontSize: strong ? 46 : 32,
        lineHeight: 1.15,
        letterSpacing: -0.4,
        color: strong ? color.ink : "#5B544B",
        opacity: inP * (1 - outP),
        transform: `translateX(${dx}px)`,
      }}
    >
      {text}
    </div>
  );
};
