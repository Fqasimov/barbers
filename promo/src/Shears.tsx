import React from "react";
import { Img, staticFile } from "remotion";

/** 13 rendered frames of steel barber shears, 0° (shut) to 30° (open) — the same art as the app's splash. */
export const SHEAR_FRAMES = 13;
const ASPECT = 830 / 1130;

/** `open` runs 0 (shut) → 1 (wide open). Every frame is mounted so none pops in late. */
export const Shears: React.FC<{ width: number; open: number; style?: React.CSSProperties }> = ({ width, open, style }) => {
  const index = Math.round(Math.min(1, Math.max(0, open)) * (SHEAR_FRAMES - 1));
  return (
    <div style={{ position: "relative", width, height: width * ASPECT, ...style }}>
      {Array.from({ length: SHEAR_FRAMES }, (_, i) => (
        <Img
          key={i}
          src={staticFile(`shears/${String(i).padStart(2, "0")}.webp`)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: i === index ? 1 : 0 }}
        />
      ))}
    </div>
  );
};

/**
 * A snip as a function of time: quick open, quicker close (blades accelerate
 * into each other), a beat of rest. Returns 0..1.
 */
export const snip = (frame: number, start: number, { open = 9, close = 5, depth = 1 } = {}) => {
  const t = frame - start;
  if (t <= 0) return 0;
  if (t < open) {
    const p = t / open;
    return depth * (1 - Math.pow(1 - p, 2));
  }
  if (t < open + close) {
    const p = (t - open) / close;
    return depth * (1 - p * p);
  }
  return 0;
};
