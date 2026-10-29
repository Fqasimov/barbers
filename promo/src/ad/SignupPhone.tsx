import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";

import { Clip, takes } from "../Clip";
import { Phone, phoneSize } from "../Phone";
import { Backdrop, Grain } from "../Promo";
import { clamp, color, ease } from "../theme";

/**
 * A salon owner signs up and starts the free trial: only the real app, recorded
 * frame-accurately, in the titanium phone. No captions, no logos.
 *
 * The take's typing and between-field scrolls play at 2×; taps, screen changes
 * and the "trial started" moment play at real speed. The camera starts close
 * (the whole screen in frame, the titanium edges at both sides), drifts
 * gently, then pulls back to the whole phone and fades to white for the next clip.
 */

const TAKE = takes.signup;
const FAST = 2;
/** Skip most of the still opening before the first tap. */
const START = 6;
/** On the dashboard at full size before the pull-back, from the trial tap. */
const DASH_HOLD = 30;
const ZOOM = 30;
const FADE = 15;

type Piece = { from: number; to: number; rate: number; at: number; length: number };

/** The take cut into real-speed and fast pieces, laid end to end. */
const pieces: Piece[] = (() => {
  const fast = [...(TAKE.segments ?? [])].sort((a, b) => a.from - b.from);
  const spans: { from: number; to: number; rate: number }[] = [];
  let cursor = START;
  for (const s of fast) {
    if (s.to <= cursor) continue;
    if (s.from > cursor) spans.push({ from: cursor, to: s.from, rate: 1 });
    const prev = spans[spans.length - 1];
    if (prev && prev.rate === FAST && prev.to === Math.max(s.from, cursor)) prev.to = s.to;
    else spans.push({ from: Math.max(s.from, cursor), to: s.to, rate: FAST });
    cursor = s.to;
  }
  spans.push({ from: cursor, to: TAKE.frames, rate: 1 });
  let at = 0;
  return spans.map((s) => {
    const length = Math.ceil((s.to - s.from) / s.rate);
    const p = { ...s, at, length };
    at += length;
    return p;
  });
})();

/** Output frame showing source frame `f` (real-speed parts only need to be exact). */
const outputFrame = (f: number) => {
  const p = pieces.find((x) => f >= x.from && f < x.to) ?? pieces[pieces.length - 1];
  return p.at + Math.floor((f - p.from) / p.rate);
};

const lastTap = TAKE.events.filter((e) => !e.drag).slice(-1)[0].frame;
const ZOOM_AT = outputFrame(lastTap) + DASH_HOLD;
export const SIGNUP_PHONE_FRAMES = Math.min(pieces[pieces.length - 1].at + pieces[pieces.length - 1].length, ZOOM_AT + ZOOM + FADE);

const W = 1080;
const H = 1920;
/**
 * Close-up: the whole screen fills the frame's height, with the titanium edges
 * and a sliver of backdrop at both sides, like looking at your own phone.
 */
const PHONE_W = 900;
/** The whole phone, with room for its contact shadow. */
const WIDE = 0.8;

export const SignupPhone: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = phoneSize(PHONE_W);

  const pull = interpolate(frame, [ZOOM_AT, ZOOM_AT + ZOOM], [0, 1], { ...clamp, easing: ease.inOut });
  const scale = interpolate(pull, [0, 1], [1, WIDE]);
  // Slow handheld drift while typing; it settles as the camera pulls back.
  const t = frame / 30;
  const calm = 1 - pull;
  const turnY = (Math.sin(t * 0.7) * 2.4 + Math.sin(t * 1.9) * 0.5) * calm - 6 * pull;
  const turnX = (Math.sin(t * 0.55 + 1.2) * 1.6) * calm + 4 * pull;
  const driftY = Math.sin(t * 0.45) * 14 * calm;
  const white = interpolate(frame, [SIGNUP_PHONE_FRAMES - FADE, SIGNUP_PHONE_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill style={{ background: color.linen }}>
      <Backdrop />
      <div
        style={{
          position: "absolute",
          left: (W - PHONE_W) / 2,
          top: (H - height) / 2 + driftY,
          width: PHONE_W,
          height,
          perspective: 2600,
          transform: `scale(${scale})`,
        }}
      >
        {/* Contact shadow on the backdrop, offset away from the key light; it grows in as the camera pulls back. */}
        <div
          style={{
            position: "absolute",
            left: 46,
            top: 80,
            width: PHONE_W,
            height: height - 40,
            borderRadius: 160,
            background: `rgba(42, 32, 21, ${0.12 + 0.2 * pull})`,
            filter: "blur(52px)",
            transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, transform: `rotateY(${turnY}deg) rotateX(${turnX}deg)`, transformStyle: "preserve-3d" }}>
          <Phone width={PHONE_W}>
            {pieces.map((p, i) => (
              <Sequence key={i} from={p.at} durationInFrames={p.length} layout="none">
                <Clip name="signup" from={p.from} playbackRate={p.rate} />
              </Sequence>
            ))}
          </Phone>
        </div>
      </div>
      <Grain />
      <AbsoluteFill style={{ background: "#fff", opacity: white }} />
    </AbsoluteFill>
  );
};
