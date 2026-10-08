import React, { useMemo } from "react";
import { interpolate, random } from "remotion";

import { clamp } from "../theme";

type Pt = [number, number];
type Shard = { poly: Pt[]; cx: number; cy: number; vx: number; vy: number; vr: number; vrx: number; vry: number; glint: number };
type Crack = { impact: Pt; spokes: Pt[]; rings: Pt[][] };

const SPOKES = 9;
const GRAVITY = 1.5;

/**
 * Glass-style fracture of a square: spokes from an impact point, crossed by two
 * jagged rings, gives wedge-shaped shards like a struck pane.
 */
const fracture = (seed: string, size: number): { shards: Shard[]; crack: Crack } => {
  const r = (k: string) => random(`${seed}-${k}`);
  const impact: Pt = [size * (0.38 + 0.24 * r("ix")), size * (0.38 + 0.24 * r("iy"))];
  const angles = Array.from({ length: SPOKES }, (_, i) => ((i + 0.25 + r(`a${i}`) * 0.5) / SPOKES) * Math.PI * 2);
  const radii = angles.map((_, i) => [0, size * (0.16 + 0.12 * r(`r1${i}`)), size * (0.44 + 0.2 * r(`r2${i}`)), size * 1.6]);
  const at = (i: number, k: number): Pt => {
    const a = angles[i % SPOKES];
    const rad = radii[i % SPOKES][k];
    return [impact[0] + Math.cos(a) * rad, impact[1] + Math.sin(a) * rad];
  };
  const inside = ([x, y]: Pt): Pt => [Math.min(size, Math.max(0, x)), Math.min(size, Math.max(0, y))];

  const shards: Shard[] = [];
  for (let i = 0; i < SPOKES; i++) {
    for (let k = 0; k < 3; k++) {
      const poly = k === 0 ? [impact, at(i, 1), at(i + 1, 1)] : [at(i, k), at(i + 1, k), at(i + 1, k + 1), at(i, k + 1)];
      const clamped = poly.map(inside);
      const cx = clamped.reduce((s, p) => s + p[0], 0) / clamped.length;
      const cy = clamped.reduce((s, p) => s + p[1], 0) / clamped.length;
      const dx = cx - impact[0];
      const dy = cy - impact[1];
      const len = Math.hypot(dx, dy) || 1;
      const speed = (5 + 13 * r(`s${i}${k}`)) * (1.25 - k * 0.2);
      shards.push({
        poly,
        cx,
        cy,
        vx: (dx / len) * speed + 2,
        vy: (dy / len) * speed - 7 * r(`u${i}${k}`),
        vr: (r(`vr${i}${k}`) - 0.5) * 22,
        vrx: (r(`vx${i}${k}`) - 0.5) * 30,
        vry: (r(`vy${i}${k}`) - 0.5) * 30,
        glint: r(`g${i}${k}`),
      });
    }
  }
  return {
    shards,
    crack: {
      impact,
      spokes: angles.map((_, i) => at(i, 3)),
      rings: [1, 2].map((k) => Array.from({ length: SPOKES + 1 }, (_, i) => at(i, k))),
    },
  };
};

const CrackLines: React.FC<{ crack: Crack; size: number; progress: number }> = ({ crack, size, progress }) => {
  if (progress <= 0) return null;
  const spoke = size * 1.6;
  const ring = interpolate(progress, [0.45, 1], [0, 1], clamp);
  return (
    <svg width={size} height={size} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <g stroke="rgba(255,255,255,0.92)" strokeWidth={2.2} fill="none" strokeLinecap="round">
        {crack.spokes.map(([x, y], i) => (
          <line
            key={i}
            x1={crack.impact[0]}
            y1={crack.impact[1]}
            x2={x}
            y2={y}
            strokeDasharray={spoke}
            strokeDashoffset={spoke * (1 - progress)}
          />
        ))}
        {crack.rings.map((pts, k) => (
          <polyline key={k} points={pts.map((p) => p.join(",")).join(" ")} opacity={ring} strokeWidth={1.6} />
        ))}
      </g>
      <circle cx={crack.impact[0]} cy={crack.impact[1]} r={6 * progress} fill="rgba(255,255,255,0.9)" />
    </svg>
  );
};

/**
 * Anything square that cracks (`crackAt`) and then bursts into falling glass
 * (`breakAt`). `frame` is the parent's frame; children are the intact face.
 */
export const Shatter: React.FC<{
  seed: string;
  size: number;
  frame: number;
  crackAt: number;
  breakAt: number;
  children: React.ReactNode;
}> = ({ seed, size, frame, crackAt, breakAt, children }) => {
  const { shards, crack } = useMemo(() => fracture(seed, size), [seed, size]);
  const crackP = interpolate(frame, [crackAt, breakAt - 2], [0, 1], { ...clamp, easing: (t) => 1 - Math.pow(1 - t, 3) });
  const t = frame - breakAt;

  if (t < 0) {
    return (
      <div style={{ position: "relative", width: size, height: size }}>
        {children}
        <CrackLines crack={crack} size={size} progress={crackP} />
      </div>
    );
  }

  const bits = Array.from({ length: 18 }, (_, i) => i);
  return (
    <div style={{ position: "relative", width: size, height: size, perspective: 900 }}>
      {shards.map((s, i) => {
        const x = s.vx * t;
        const y = s.vy * t + 0.5 * GRAVITY * t * t;
        const fade = interpolate(t, [18, 46], [1, 0], clamp);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `polygon(${s.poly.map(([px, py]) => `${px}px ${py}px`).join(",")})`,
              transformOrigin: `${s.cx}px ${s.cy}px`,
              transform: `translate(${x}px, ${y}px) rotateZ(${s.vr * t}deg) rotateX(${s.vrx * t}deg) rotateY(${s.vry * t}deg)`,
              opacity: fade,
            }}
          >
            {children}
            <CrackLines crack={crack} size={size} progress={1} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(${120 + s.glint * 90}deg, rgba(255,255,255,${0.1 + s.glint * 0.45}) 0%, rgba(255,255,255,0) 55%)`,
              }}
            />
          </div>
        );
      })}
      {bits.map((i) => {
        const a = random(`${seed}-b${i}`) * Math.PI * 2;
        const v = 10 + 22 * random(`${seed}-bv${i}`);
        const s = 3 + 8 * random(`${seed}-bs${i}`);
        const x = crack.impact[0] + Math.cos(a) * v * t;
        const y = crack.impact[1] + Math.sin(a) * v * t + 0.5 * GRAVITY * 1.4 * t * t;
        return (
          <div
            key={`b${i}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s,
              height: s * 0.7,
              background: "rgba(235,240,255,0.9)",
              boxShadow: "0 0 6px rgba(255,255,255,0.8)",
              transform: `rotate(${a * 57 + t * 20}deg)`,
              opacity: interpolate(t, [0, 30], [1, 0], clamp),
            }}
          />
        );
      })}
    </div>
  );
};
