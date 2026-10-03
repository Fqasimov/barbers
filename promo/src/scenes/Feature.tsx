import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { clamp, color, ease, font } from "../theme";
import { MaskLine } from "./Headline";

export type FeatureProps = {
  index: string;
  overline: string;
  title: string;
  italic: string;
  screen: string;
};

const PHONE_W = 800;
const PHONE_H = Math.round((PHONE_W * 844) / 390);

/** One feature: a two-line serif title, and the real app screen rising into frame. */
export const Feature: React.FC<FeatureProps> = ({ index, overline, title, italic, screen }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const rise = interpolate(frame, [6, 40], [0, 1], { ...clamp, easing: ease.expo });
  // A slow drift while the scene holds, so the frame is never dead.
  const drift = interpolate(frame, [40, durationInFrames], [0, -36], clamp);
  const line: React.CSSProperties = {
    fontFamily: font.serif,
    fontWeight: 400,
    fontSize: 104,
    lineHeight: 1.02,
    letterSpacing: -2.5,
    color: color.ink,
  };

  return (
    <AbsoluteFill style={{ background: color.paper }}>
      <div style={{ position: "absolute", top: 150, left: 90, right: 90 }}>
        <div
          style={{
            display: "flex",
            gap: 22,
            fontFamily: font.mono,
            fontWeight: 500,
            fontSize: 28,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: interpolate(frame, [0, 14], [0, 1], { ...clamp, easing: ease.out }),
          }}
        >
          <span style={{ color: color.accent }}>{index}</span>
          <span style={{ color: color.inkMuted }}>{overline}</span>
        </div>
        <MaskLine delay={4} style={{ ...line, marginTop: 34 }}>
          {title}
        </MaskLine>
        <MaskLine delay={10} style={{ ...line, fontStyle: "italic", color: color.accent }}>
          {italic}
        </MaskLine>
      </div>

      <div
        style={{
          position: "absolute",
          left: (1080 - PHONE_W) / 2,
          top: 640,
          width: PHONE_W,
          height: PHONE_H,
          borderRadius: 112,
          background: color.night,
          padding: 18,
          boxShadow: "0 60px 120px rgba(23, 20, 15, 0.22), 0 12px 30px rgba(23, 20, 15, 0.12)",
          opacity: interpolate(rise, [0, 0.35], [0, 1], clamp),
          translate: `0px ${(1 - rise) * 260 + drift}px`,
          scale: interpolate(rise, [0, 1], [0.96, 1]),
        }}
      >
        <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 94, overflow: "hidden", background: color.paper }}>
          <Img src={staticFile(`screens/${screen}`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <div
            style={{
              position: "absolute",
              top: 22,
              left: "50%",
              width: 190,
              height: 54,
              marginLeft: -95,
              borderRadius: 27,
              background: color.night,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
