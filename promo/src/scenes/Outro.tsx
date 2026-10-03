import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { Scissors } from "../Scissors";
import { clamp, color, ease, font } from "../theme";

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const open = interpolate(frame, [10, 19, 24], [0, 20, 0], { ...clamp, easing: [ease.inOut, ease.out] });
  const fade = (from: number) => ({
    opacity: interpolate(frame, [from, from + 18], [0, 1], { ...clamp, easing: ease.out }),
    translate: `0px ${interpolate(frame, [from, from + 18], [18, 0], { ...clamp, easing: ease.out })}px`,
  });
  return (
    <AbsoluteFill style={{ background: color.night, alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...fade(0), rotate: "-90deg" }}>
        <Scissors size={300} open={open} />
      </div>
      <div
        style={{
          ...fade(16),
          fontFamily: font.serif,
          fontStyle: "italic",
          fontWeight: 300,
          fontSize: 230,
          letterSpacing: -5,
          color: color.bone,
          marginTop: 30,
          lineHeight: 1,
        }}
      >
        Usta
      </div>
      <div style={{ ...fade(26), fontFamily: font.serif, fontSize: 60, color: color.brassLight, marginTop: 34 }}>
        Book the hands you trust.
      </div>
      <div
        style={{
          ...fade(36),
          fontFamily: font.mono,
          fontSize: 26,
          letterSpacing: 6,
          color: color.brass,
          opacity: interpolate(frame, [36, 54], [0, 0.85], { ...clamp, easing: ease.out }),
          marginTop: 90,
        }}
      >
        BAKU · iOS · ANDROID
      </div>
    </AbsoluteFill>
  );
};
