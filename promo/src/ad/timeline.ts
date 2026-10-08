/** Where everything in the salon ad happens, in frames at 30 fps. Sound cues read the same numbers. */

/** Overlap between linen scenes while one moves into the next. */
export const OV = 14;

/** Scene-local beats. */
export const BREAK = 120; // rivals: "aldadılmısınız." lands and the logos shatter
export const COIN_AT = [40, 64, 84, 101, 115, 127]; // receipt: each new charge prints
export const SNIPS = [206, 216, 226, 236, 246]; // receipt: blades close while crossing
export const CUT = 252; // receipt: the bill splits open
export const REVEAL_CUT = 30; // reveal: the wordmark gets cut
export const TEAM_POPS = Array.from({ length: 12 }, (_, i) => 46 + i * 7);
export const GROWTH_CLIP_AT = 20; // growth: the app recording starts
export const FEATURE_AT = [26, 40, 54];
export const CTA_TAP = 104;
export const CTA_LOGO = 128;

/** Scene starts, absolute. */
export const AT = {
  address: 0,
  rivals: 150,
  receipt: 390,
  reveal: 390 + CUT - 2,
  team: 796,
  growth: 976,
  features: 1182,
  cta: 1338,
};

export const SALON_AD_FRAMES = AT.cta + 202;

/** The music gets loud when the brand appears. */
export const MUSIC_SWELL = AT.reveal;

