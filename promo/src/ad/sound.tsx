import React from "react";
import { getStaticFiles, Html5Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";

import { takes } from "../Clip";
import { clamp } from "../theme";
import {
  AT,
  BREAK,
  COIN_AT,
  CTA_LOGO,
  CTA_TAP,
  CUT,
  FEATURE_AT,
  GROWTH_CLIP_AT,
  MUSIC_SWELL,
  REVEAL_CUT,
  SALON_AD_FRAMES,
  SNIPS,
  TEAM_POPS,
} from "./timeline";

type Sfx = "boom" | "glass" | "whoosh" | "whoosh-down" | "snip" | "tick" | "coin" | "pop" | "riser" | "chime" | "drone";
type Cue = [frame: number, sfx: Sfx, volume: number];

/** Every sound effect, by absolute frame. The effects are synthesized by scripts/sfx.py. */
const CUES: Cue[] = [
  // 1. Address: a heavy hit on the first and last line.
  [AT.address + 10, "boom", 1],
  [AT.address + 38, "whoosh-down", 0.45],
  [AT.address + 64, "whoosh-down", 0.45],
  [AT.address + 90, "boom", 0.6],
  // 2. Rivals appear, crack, and shatter on "aldadılmısınız."
  ...[0, 1, 2, 3].map((i): Cue => [AT.rivals + 6 + i * 8, "tick", 0.5]),
  [AT.rivals + 90, "boom", 0.55],
  [AT.rivals + 98, "tick", 0.6],
  [AT.rivals + 106, "tick", 0.7],
  [AT.rivals + BREAK - 1, "glass", 1],
  [AT.rivals + BREAK - 1, "boom", 0.9],
  // 3. Every charge rings the till; the shears cut the bill.
  [AT.receipt + 16, "whoosh", 0.4],
  ...COIN_AT.map((f): Cue => [AT.receipt + f, "coin", 0.45]),
  [AT.receipt + 186, "riser", 0.7],
  ...SNIPS.map((f): Cue => [AT.receipt + f - 1, "snip", 0.8]),
  [AT.receipt + CUT, "whoosh", 0.8],
  // 4. Reveal.
  [AT.reveal + 6, "chime", 0.7],
  [AT.reveal + REVEAL_CUT - 3, "snip", 0.5],
  // 5. Team: a pop for every master who joins.
  [AT.team, "whoosh", 0.45],
  ...TEAM_POPS.map((f): Cue => [AT.team + f, "pop", 0.35]),
  // 6. Growth: the app's taps.
  [AT.growth, "whoosh", 0.4],
  ...takes.business.events.filter((e) => !e.drag).map((e): Cue => [AT.growth + GROWTH_CLIP_AT + e.frame, "pop", 0.3]),
  // 7. Features slide in.
  [AT.features, "whoosh", 0.4],
  ...FEATURE_AT.map((f): Cue => [AT.features + f - 4, "whoosh", 0.22]),
  // 8. CTA.
  [AT.cta, "whoosh", 0.5],
  [AT.cta + 30, "chime", 0.5],
  [AT.cta + CTA_TAP, "pop", 0.5],
  [AT.cta + CTA_LOGO + 15, "snip", 0.5],
];

/** Optional: put the background track here and the next render picks it up. */
const MUSIC = "audio/music.mp3";
/** Where in the song the ad starts, in seconds. */
const MUSIC_START_SEC = 0;

/** Headroom: the shatter stacks glass on a hit, which would clip at full level. */
const SFX_GAIN = 0.7;

const has = (name: string) => getStaticFiles().some((f) => f.name === name);

export const AdSound: React.FC = () => {
  const { fps } = useVideoConfig();
  const music = has(MUSIC);
  return (
    <>
      {/* A low drone holds the problem half together, and fades as the brand arrives. */}
      <Sequence name="drone" durationInFrames={MUSIC_SWELL + 30} layout="none">
        <Html5Audio
          src={staticFile("sfx/drone.wav")}
          volume={(f) => 0.5 * SFX_GAIN * interpolate(f, [MUSIC_SWELL - 20, MUSIC_SWELL + 20], [1, 0], clamp)}
        />
      </Sequence>
      {CUES.map(([at, sfx, volume], i) => (
        <Sequence key={i} name={sfx} from={at} durationInFrames={fps * 4} layout="none">
          <Html5Audio src={staticFile(`sfx/${sfx}.wav`)} volume={volume * SFX_GAIN} />
        </Sequence>
      ))}
      {music ? (
        <Html5Audio
          src={staticFile(MUSIC)}
          trimBefore={Math.round(MUSIC_START_SEC * fps)}
          volume={(f) =>
            interpolate(f, [0, 20, MUSIC_SWELL - 20, MUSIC_SWELL + 20, SALON_AD_FRAMES - 45, SALON_AD_FRAMES], [0, 0.35, 0.35, 0.85, 0.85, 0], clamp)
          }
        />
      ) : null}
    </>
  );
};
