import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

import { problem } from '../content';
import { clamp, color, ease } from './theme';

/** Long enough to hold the last message: the Player clears the frame when a composition ends. */
export const CHAT_FRAMES = 1800;
/** When each line of `problem.chat` lands (frames at 30 fps). */
const AT = [12, 48, 92, 118, 158];

/**
 * The problem in motion: a client asks a salon for a time over DM, waits two
 * hours, and gets "we're full". Drawn in the deck's own colours, not a
 * messenger's, so it reads as any DM.
 */
export function Chat() {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        padding: '56px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: 'Onest, sans-serif',
      }}
    >
      {problem.chat.map((m, i) => {
        const at = AT[i];
        const p = interpolate(f, [at, at + 12], [0, 1], { ...clamp, easing: ease.out });
        // The salon "types" for a moment before each reply.
        const typing = m.from === 'salon' && f >= at - 26 && f < at;
        if (f < at - 26 || (m.from !== 'salon' && f < at)) return null;
        if (m.from === 'time') {
          return (
            <div
              key={i}
              style={{
                alignSelf: 'center',
                opacity: p,
                transform: `scale(${0.96 + 0.04 * p})`,
                font: '600 22px/1 Onest',
                color: color.inkSoft,
                padding: '10px 18px',
                borderRadius: 999,
                background: 'rgba(20,18,16,0.06)',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <Clock spin={f} /> {m.text}
            </div>
          );
        }
        const mine = m.from === 'client';
        const last = i === problem.chat.length - 1;
        return (
          <div key={i} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%' }}>
            {typing ? (
              <Typing f={f} />
            ) : (
              <div
                style={{
                  opacity: p,
                  transform: `translateY(${(1 - p) * 10}px) scale(${0.97 + 0.03 * p})`,
                  transformOrigin: mine ? 'right bottom' : 'left bottom',
                  font: '500 30px/1.3 Onest',
                  padding: '18px 24px',
                  borderRadius: mine ? '26px 26px 8px 26px' : '26px 26px 26px 8px',
                  background: mine ? color.ink : last ? '#f3e3e4' : '#fff',
                  color: mine ? color.linen : last ? color.burgundy : color.ink,
                  boxShadow: mine ? 'none' : '0 1px 0 rgba(20,18,16,0.08)',
                }}
              >
                {m.text}
              </div>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function Typing({ f }: { f: number }) {
  return (
    <div
      style={{ display: 'flex', gap: 8, padding: '22px 26px', borderRadius: '26px 26px 26px 8px', background: '#fff' }}
    >
      {[0, 1, 2].map((k) => (
        <span
          key={k}
          style={{
            width: 11,
            height: 11,
            borderRadius: 6,
            background: color.silver,
            opacity: 0.4 + 0.6 * Math.max(0, Math.sin((f - k * 4) / 4)),
          }}
        />
      ))}
    </div>
  );
}

function Clock({ spin }: { spin: number }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color.inkSoft}
      strokeWidth={2}
      strokeLinecap="round"
    >
      <circle cx={12} cy={12} r={9} />
      <path d={`M12 12 L${12 + 6 * Math.sin(spin / 3)} ${12 - 6 * Math.cos(spin / 3)}`} />
      <path d="M12 12 L12 8" />
    </svg>
  );
}
