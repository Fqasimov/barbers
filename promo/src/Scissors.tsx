import React from "react";

import { color } from "./theme";

/**
 * The app's scissors (src/components/splash/Scissors.tsx), drawn on a 240×240
 * box with the pivot at the centre so each half rotates about the screw.
 */
const BOX = 240;

const blade = (m: (y: number) => number) =>
  `M 100 ${m(121)} L 228 ${m(119.4)} C 204 ${m(113.5)} 166 ${m(105.5)} 132 ${m(104)} ` +
  `C 117 ${m(103.6)} 104 ${m(108)} 100 ${m(114)} Z`;
const highlight = (m: (y: number) => number) =>
  `M 132 ${m(105.6)} C 166 ${m(107)} 200 ${m(114)} 222 ${m(119)}`;
const shank = (m: (y: number) => number) =>
  `M 104 ${m(113)} C 92 ${m(122)} 80 ${m(133)} 66 ${m(147)} L 74 ${m(155)} C 88 ${m(142)} 102 ${m(131)} 117 ${m(124)} Z`;

const same = (y: number) => y;
const mirror = (y: number) => BOX - y;

const Half: React.FC<{ flipped?: boolean; id: string; angle: number }> = ({ flipped, id, angle }) => {
  const m = flipped ? mirror : same;
  const fill = `url(#${id})`;
  return (
    <g transform={`rotate(${angle} 120 120)`}>
      <defs>
        <linearGradient id={id} x1="0" y1={flipped ? "1" : "0"} x2="1" y2={flipped ? "0" : "1"}>
          <stop offset="0" stopColor={color.brassLight} />
          <stop offset="0.48" stopColor={color.brass} />
          <stop offset="1" stopColor={color.brassDeep} />
        </linearGradient>
      </defs>
      <path d={blade(m)} fill={fill} />
      <path d={highlight(m)} stroke="#FFF1D6" strokeOpacity={0.55} strokeWidth={0.9} fill="none" />
      <path d={shank(m)} fill={fill} />
      <circle cx={46} cy={m(166)} r={20} stroke={fill} strokeWidth={9} fill="none" />
    </g>
  );
};

/** `open` is the blade angle in degrees; 0 is closed. */
export const Scissors: React.FC<{ size: number; open: number }> = ({ size, open }) => (
  <svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`} style={{ overflow: "visible" }}>
    <Half flipped id="promo-blade-b" angle={open} />
    <Half id="promo-blade-a" angle={-open} />
    <circle cx={120} cy={120} r={6.5} fill={color.brassLight} />
    <circle cx={120} cy={120} r={2.2} fill={color.night} />
  </svg>
);
