import React from "react";

import { color, font } from "./theme";

/** The recordings are iPhone 15 points: 390 × 844, with real 47 pt / 34 pt safe-area insets. */
export const PT = { w: 390, h: 844 };
const FRAME = 7;
const BEZEL = 13;

export const phoneSize = (width: number) => {
  const screen = width - 2 * (FRAME + BEZEL);
  const s = screen / PT.w;
  return { s, screenW: screen, screenH: PT.h * s, height: PT.h * s + 2 * (FRAME + BEZEL) };
};

const titanium =
  "linear-gradient(90deg, #77756f 0%, #d9d6cf 3%, #a19e97 9%, #8a8780 50%, #a19e97 91%, #d9d6cf 97%, #77756f 100%)";

/**
 * A titanium-framed phone. Screen content is laid out in points (390 × 844) and
 * scaled, so recordings, touches and the status bar all share one coordinate space.
 */
export const Phone: React.FC<{ width: number; children: React.ReactNode; statusBar?: "dark" | "light" }> = ({
  width,
  children,
  statusBar = "dark",
}) => {
  const { s, screenW, screenH, height } = phoneSize(width);
  const screenRadius = 55 * s;
  const button = (side: "left" | "right", top: number, h: number): React.CSSProperties => ({
    position: "absolute",
    [side]: -3.5,
    top,
    width: 6,
    height: h,
    borderRadius: 3,
    background: "linear-gradient(90deg, #6d6b66, #cfccc5 45%, #7a7872)",
  });

  return (
    <div style={{ position: "relative", width, height }}>
      <div style={button("left", height * 0.17, 54)} />
      <div style={button("left", height * 0.235, 100)} />
      <div style={button("left", height * 0.31, 100)} />
      <div style={button("right", height * 0.25, 160)} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: screenRadius + BEZEL + FRAME,
          background: titanium,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.35), inset 0 2px 3px rgba(255,255,255,0.45)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: FRAME,
          borderRadius: screenRadius + BEZEL,
          background: "#0b0b0b",
          boxShadow: "inset 0 0 0 1.5px #1d1d1f",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: FRAME + BEZEL,
          top: FRAME + BEZEL,
          width: screenW,
          height: screenH,
          borderRadius: screenRadius,
          overflow: "hidden",
          background: color.linen,
        }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: PT.w, height: PT.h, transform: `scale(${s})`, transformOrigin: "0 0" }}>
          {children}
          <StatusBar tone={statusBar} />
          <div
            style={{
              position: "absolute",
              left: (PT.w - 134) / 2,
              bottom: 8,
              width: 134,
              height: 5,
              borderRadius: 3,
              background: statusBar === "light" ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: (PT.w - 125) / 2,
              top: 11,
              width: 125,
              height: 37,
              borderRadius: 19,
              background: "#000",
            }}
          />
        </div>
        {/* Cover glass: a soft sheen from the key light, upper left. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(118deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 26%, rgba(255,255,255,0) 42%, rgba(255,255,255,0) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ tone: "dark" | "light" }> = ({ tone }) => {
  const c = tone === "light" ? "#fff" : "#000";
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 47, display: "flex", alignItems: "center", padding: "4px 30px 0 46px", justifyContent: "space-between" }}>
      <span style={{ fontFamily: font, fontWeight: 600, fontSize: 17, letterSpacing: -0.2, color: c }}>9:41</span>
      <svg width={78} height={14} viewBox="0 0 78 14" fill={c}>
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 5.2} y={10 - i * 2.6} width={3.4} height={3.4 + i * 2.6} rx={1} />
        ))}
        <path d="M31 4.2a10.6 10.6 0 0 1 14.6 0l-1.5 1.6a8.4 8.4 0 0 0-11.6 0Z M33.6 7a6.8 6.8 0 0 1 9.4 0l-1.5 1.6a4.6 4.6 0 0 0-6.4 0Z M36.2 9.8a3 3 0 0 1 4.2 0L38.3 12Z" />
        <rect x={52} y={1.5} width={22} height={11} rx={3.2} fill="none" stroke={c} strokeOpacity={0.4} />
        <rect x={54} y={3.5} width={16} height={7} rx={1.6} />
        <path d="M75.4 5.5v3a1.6 1.6 0 0 0 0-3Z" fillOpacity={0.45} />
      </svg>
    </div>
  );
};
