import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";

import { Clip } from "../Clip";
import { Phone, phoneSize } from "../Phone";
import { Backdrop, Grain } from "../Promo";
import { clamp, color } from "../theme";

/**
 * Very short cut of the "trial" take: the yazılnow launch animation, then the plan
 * screen, Pro (49 ₼) and "start the free trial", landing on the trial dashboard.
 */
const PARTS = [
  { from: 0, to: 152 }, // the launch animation, up to the finished logo
  { from: 1080, to: 1205 }, // plans: Pro, start the trial, the dashboard
];
const XF = 8; // crossfade between the parts
const lengths = PARTS.map((p) => p.to - p.from);
export const TRIAL_SHORT_FRAMES = lengths[0] + lengths[1] - XF;

const W = 1080;
const H = 1920;
const PHONE_W = 900;

export const TrialShort: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = phoneSize(PHONE_W);
  const t = frame / 30;
  const turnY = Math.sin(t * 0.7) * 2.2 + Math.sin(t * 1.9) * 0.4;
  const turnX = Math.sin(t * 0.55 + 1.2) * 1.4;
  const driftY = Math.sin(t * 0.45) * 12;
  const second = lengths[0] - XF;
  const fadeIn = interpolate(frame, [second, second + XF], [0, 1], clamp);

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
            <Sequence durationInFrames={lengths[0]} layout="none">
              <Clip name="trial" from={PARTS[0].from} />
            </Sequence>
            <Sequence from={second} durationInFrames={lengths[1]} layout="none">
              <div style={{ position: "absolute", inset: 0, opacity: fadeIn }}>
                <Clip name="trial" from={PARTS[1].from} />
              </div>
            </Sequence>
          </Phone>
        </div>
      </div>
      <Grain />
    </AbsoluteFill>
  );
};
