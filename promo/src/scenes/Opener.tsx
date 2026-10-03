import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { Scissors } from "../Scissors";
import { clamp, color, ease, font } from "../theme";

/**
 * The app's launch, as film: three snips, one decisive cut, a hairline that
 * shoots across the frame, and the ink sheet parting along it.
 */
export const OPENER_FRAMES = 100;

const snip = (frame: number, start: number, peak: number, openFor = 9, closeFor = 5) =>
  interpolate(frame, [start, start + openFor, start + openFor + closeFor], [0, peak, 0], {
    ...clamp,
    easing: [ease.inOut, ease.out],
  });

export const Opener: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const half = height / 2;

  const open = Math.max(snip(frame, 8, 22), snip(frame, 24, 22), snip(frame, 40, 22), snip(frame, 56, 34, 7, 4));
  const cut = interpolate(frame, [67, 76], [0, 1], { ...clamp, easing: ease.out });
  const tools = interpolate(frame, [74, 80], [1, 0], { ...clamp, easing: ease.out });
  const split = interpolate(frame, [77, 99], [0, 1], { ...clamp, easing: ease.inOut });
  const word = interpolate(frame, [8, 28], [0, 1], { ...clamp, easing: ease.out });
  const edge = interpolate(split, [0, 0.02, 1], [0, 0.7, 0.25], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: half,
          background: color.night,
          translate: `0px ${-split * (half + 6)}px`,
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: color.brass, opacity: edge }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: half,
          height: half,
          background: color.night,
          translate: `0px ${split * (half + 6)}px`,
        }}
      >
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: color.brass, opacity: edge }} />
        <div
          style={{
            position: "absolute",
            top: 250,
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: word,
            translate: `0px ${(1 - word) * 24}px`,
          }}
        >
          <div style={{ fontFamily: font.serif, fontStyle: "italic", fontWeight: 300, fontSize: 132, color: color.bone, letterSpacing: -2 }}>
            Usta
          </div>
          <div style={{ fontFamily: font.mono, fontSize: 26, letterSpacing: 7, color: color.brass, opacity: 0.85, marginTop: 10 }}>
            BARBERS · SALONS · MASTERS
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: half - 1.5,
          height: 3,
          background: color.brassLight,
          opacity: tools,
          scale: `${cut} 1`,
        }}
      />

      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: tools }}>
        <div style={{ scale: interpolate(tools, [0, 1], [0.94, 1]) }}>
          <Scissors size={480} open={open} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
