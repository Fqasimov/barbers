import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { clamp, color, ease, font } from "../theme";

/** A line that rises out of its own mask. */
export const MaskLine: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ overflow: "hidden", paddingBottom: "0.08em", ...style }}>
      <div
        style={{
          translate: `0px ${interpolate(frame, [delay, delay + 26], [110, 0], { ...clamp, easing: ease.expo })}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Headline: React.FC = () => {
  const frame = useCurrentFrame();
  const big: React.CSSProperties = {
    fontFamily: font.serif,
    fontWeight: 300,
    fontSize: 170,
    lineHeight: 1,
    letterSpacing: -5,
    color: color.ink,
  };
  return (
    <AbsoluteFill style={{ background: color.paper, padding: "0 90px", justifyContent: "center" }}>
      <div
        style={{
          fontFamily: font.mono,
          fontWeight: 500,
          fontSize: 28,
          letterSpacing: 6,
          color: color.inkMuted,
          marginBottom: 48,
          opacity: interpolate(frame, [4, 20], [0, 1], { ...clamp, easing: ease.out }),
        }}
      >
        BAKU · BARBERS · SALONS
      </div>
      <MaskLine delay={8} style={big}>
        Book the
      </MaskLine>
      <MaskLine delay={14} style={{ ...big, fontStyle: "italic", color: color.accent }}>
        hands
      </MaskLine>
      <MaskLine delay={20} style={big}>
        you trust.
      </MaskLine>
      <div
        style={{
          height: 2,
          background: color.ink,
          marginTop: 70,
          transformOrigin: "left center",
          scale: `${interpolate(frame, [30, 56], [0, 1], { ...clamp, easing: ease.inOut })} 1`,
        }}
      />
      <div
        style={{
          fontFamily: font.sans,
          fontSize: 44,
          lineHeight: 1.35,
          color: color.inkSoft,
          marginTop: 44,
          maxWidth: 820,
          opacity: interpolate(frame, [40, 58], [0, 1], { ...clamp, easing: ease.out }),
          translate: `0px ${interpolate(frame, [40, 58], [16, 0], { ...clamp, easing: ease.out })}px`,
        }}
      >
        Barbers, salons and the masters behind them — booked in under a minute.
      </div>
    </AbsoluteFill>
  );
};
