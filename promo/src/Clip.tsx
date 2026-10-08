import React from "react";
import { interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";

import book from "../public/rec/book.json";
import business from "../public/rec/business.json";
import compare from "../public/rec/compare.json";
import find from "../public/rec/find.json";
import home from "../public/rec/home.json";
import map from "../public/rec/map.json";
import past from "../public/rec/past.json";
import review from "../public/rec/review.json";
import salon from "../public/rec/salon.json";
import { PT } from "./Phone";
import { clamp } from "./theme";

type Touch = { frame: number; x: number; y: number; drag?: boolean };
type Take = { frames: number; events: Touch[] };

/** Frame-accurate recordings of the real app (see promo/README.md for how they're made). */
export const takes = { home, find, salon, book, map, compare, past, review, business } as Record<string, Take>;
export type TakeName = keyof typeof takes;

/** Frame of the n-th tap in a take — for cutting right after a navigation tap. */
export const tapAt = (name: TakeName, n: number) => takes[name].events.filter((e) => !e.drag)[n].frame;

/** One recording, trimmed, with iOS-style "show touches" circles where the finger landed. */
export const Clip: React.FC<{ name: TakeName; from?: number }> = ({ name, from = 0 }) => {
  const frame = useCurrentFrame() + from;
  const { events } = takes[name];
  const taps = events.filter((e) => !e.drag);
  const drag = events.filter((e) => e.drag);
  const last = drag[drag.length - 1];
  const dragNow = drag.find((e) => e.frame === frame) ?? (last && frame === last.frame + 1 ? last : undefined);

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: PT.w, height: PT.h }}>
      <OffthreadVideo
        src={staticFile(`rec/${name}.mp4`)}
        trimBefore={from}
        muted
        style={{ width: PT.w, height: PT.h, display: "block" }}
      />
      {taps.map((t, i) => {
        const age = frame - t.frame;
        if (age < 0 || age > 18) return null;
        const scale = interpolate(age, [0, 3], [0.7, 1], clamp);
        const opacity = interpolate(age, [0, 1, 6, 16], [0, 1, 1, 0], clamp);
        return <Dot key={i} x={t.x} y={t.y} scale={scale} opacity={opacity} />;
      })}
      {dragNow ? <Dot x={dragNow.x} y={dragNow.y} scale={1} opacity={1} /> : null}
    </div>
  );
};

const Dot: React.FC<{ x: number; y: number; scale: number; opacity: number }> = ({ x, y, scale, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: x - 21,
      top: y - 21,
      width: 42,
      height: 42,
      borderRadius: 21,
      background: "rgba(40, 36, 32, 0.22)",
      border: "1.5px solid rgba(255, 255, 255, 0.7)",
      boxShadow: "0 1px 6px rgba(0,0,0,0.12)",
      transform: `scale(${scale})`,
      opacity,
    }}
  />
);
