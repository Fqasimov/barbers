import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";

import { Clip } from "../Clip";
import { Phone, phoneSize } from "../Phone";
import { Grain } from "../Promo";
import { clamp, color } from "../theme";

/**
 * 16:9 version of TrialShort, cut to follow the brand film (1280×720) that ends
 * pushing in on the yazılnow app icon. It opens on that film's last frame and keeps
 * its push-in, dissolves into the app's cream launch screen (in our cream), then pulls back to reveal the phone as the logo
 * animation plays. Then: Pro (49 ₼) and the free trial starting.
 */
const W = 1920;
const H = 1080;
const PHONE_W = 452; // phone about 1000 px tall
const HANDOFF = 12; // frames on the film's last frame
const XF = 10; // dissolve into our launch screen
const PULL = 42; // pull back to the whole phone
const INTRO = { from: 0, to: 152 };
const TRIAL = { from: 1080, to: 1205 };
const CUT = 8;
const introAt = HANDOFF - 2;
const trialAt = introAt + (INTRO.to - INTRO.from) - CUT;
export const TRIAL_SHORT_WIDE_FRAMES = trialAt + (TRIAL.to - TRIAL.from);

const inOut = Easing.bezier(0.77, 0, 0.175, 1);

export const TrialShortWide: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = phoneSize(PHONE_W);
  // Their push-in continues on the held frame.
  const filmScale = interpolate(frame, [0, HANDOFF + XF], [1, 1.12], clamp);
  const filmOpacity = interpolate(frame, [HANDOFF, HANDOFF + XF], [1, 0], clamp);
  // Start with the screen filling the frame, then pull back to the whole phone.
  const pullStart = HANDOFF + 4;
  const p = interpolate(frame, [pullStart, pullStart + PULL], [0, 1], { ...clamp, easing: inOut });
  // Our shears about the size of the icon in the film, centred where it was.
  const startScale = 3.4;
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
      <Grain />
      {/* The film's last frame, still pushing in, dissolving away. */}
      <AbsoluteFill style={{ opacity: filmOpacity }}>
        <Img
          src={staticFile("bridge/opening-last.png")}
          style={{ width: W, height: H, objectFit: "cover", transform: `scale(${filmScale})` }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
