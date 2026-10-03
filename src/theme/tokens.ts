import { cubicBezier, Easing } from 'react-native-reanimated';

/**
 * Usta design tokens.
 *
 * Palette: warm paper + ink, one bronze accent. Contrast measured against
 * `bg` and `surface` (WCAG): ink ≥ 16:1, inkSoft ≥ 6.4:1, inkMuted ≥ 4.6:1,
 * accent ≥ 5.1:1 — every text tone passes AA at small sizes.
 */
const light = {
  bg: '#F3EFE8',
  surface: '#FBF9F5',
  raised: '#FFFFFF',
  sunken: '#EAE5DC',
  ink: '#17140F',
  inkSoft: '#5C554B',
  inkMuted: '#6B645A',
  line: '#E1DBD0',
  lineStrong: '#CFC7BA',
  accent: '#8A5A22',
  accentSoft: '#EFE3D0',
  onAccent: '#FFFFFF',
  primary: '#17140F',
  onPrimary: '#F3EFE8',
  success: '#2E6A4C',
  successSoft: '#DCE9E0',
  danger: '#A13A28',
  dangerSoft: '#F3DED8',
  scrim: 'rgba(23, 20, 15, 0.42)',
  glass: 'rgba(251, 249, 245, 0.82)',
};

const dark: typeof light = {
  bg: '#0E0D0B',
  surface: '#181614',
  raised: '#211E1B',
  sunken: '#0A0908',
  ink: '#F2ECE3',
  inkSoft: '#ABA295',
  inkMuted: '#918A7E',
  line: '#2A2622',
  lineStrong: '#3A3530',
  accent: '#CFA772',
  accentSoft: '#2B2219',
  onAccent: '#17140F',
  primary: '#F2ECE3',
  onPrimary: '#17140F',
  success: '#7DBF9A',
  successSoft: '#17271F',
  danger: '#E58A76',
  dangerSoft: '#2E1915',
  scrim: 'rgba(0, 0, 0, 0.6)',
  glass: 'rgba(24, 22, 20, 0.82)',
};

export const palettes = { light, dark };
export type Palette = typeof light;
export type Scheme = keyof typeof palettes;

/** The splash is always ink — it matches the native splash screen. */
export const brand = {
  ink: '#0E0D0B',
  brass: '#CFA772',
  brassDeep: '#9C7039',
  brassLight: '#EBCF9F',
  bone: '#F3EFE8',
};

/** Art-directed cover tones for venues. Muted, never neon. */
export const tones = {
  oxblood: { bg: '#5A1F1B', fg: '#E9C9B5' },
  forest: { bg: '#1E3A2E', fg: '#C8D9C2' },
  navy: { bg: '#1A2333', fg: '#C9D2E0' },
  clay: { bg: '#9A5638', fg: '#F6DCC8' },
  olive: { bg: '#4A4A2C', fg: '#E3DFB8' },
  sand: { bg: '#CDBB9E', fg: '#3A2E20' },
  slate: { bg: '#383C42', fg: '#D8D3CB' },
  rose: { bg: '#7A4A45', fg: '#F2D6CF' },
  ink: { bg: '#1B1815', fg: '#D9B98A' },
  bone: { bg: '#E7DFD2', fg: '#4A3B2A' },
} as const;
export type ToneName = keyof typeof tones;

/**
 * Newsreader covers the full Azerbaijani alphabet (ə, Ə) and the manat sign (₼);
 * Geist does not have ₼, so prices are always set in the serif.
 */
export const fonts = {
  displayLight: 'Newsreader_300Light',
  display: 'Newsreader_400Regular',
  displayMedium: 'Newsreader_500Medium',
  displayItalic: 'Newsreader_400Regular_Italic',
  displayLightItalic: 'Newsreader_300Light_Italic',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
  bodySemibold: 'Geist_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
};

/** 4pt rhythm. */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const gutter = 20;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

/**
 * Motion — Emil Kowalski's curves. Never ease-in on UI.
 * Durations stay under 300ms for UI; only the once-per-launch splash runs longer.
 */
export const ease = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
};

/** The same curves for Reanimated CSS transitions. */
export const cssEase = {
  out: cubicBezier(0.23, 1, 0.32, 1),
  inOut: cubicBezier(0.77, 0, 0.175, 1),
};

export const duration = {
  press: 120,
  small: 180,
  medium: 240,
  large: 300,
};

export const spring = {
  settle: { duration: 400, dampingRatio: 1 },
  snap: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
};

export const iconSize = { sm: 16, md: 20, lg: 24 };
export const iconStroke = 1.6;
