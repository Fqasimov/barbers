import { cubicBezier, Easing } from 'react-native-reanimated';

/**
 * Usta design tokens, v2.
 *
 * Linen background, white cards, ink-black actions and one brand colour —
 * nar (pomegranate) red, used sparingly for the brand and favourites.
 * Every text tone passes WCAG AA on bg, surface and sunken (measured).
 */
const light = {
  bg: '#F3EFE8',
  surface: '#FFFFFF',
  raised: '#FFFFFF',
  sunken: '#EAE5DC',
  ink: '#141210',
  inkSoft: '#5B554C',
  inkMuted: '#6A6359',
  line: '#E3DDD3',
  lineStrong: '#D2CBBF',
  accent: '#B4233C',
  accentSoft: '#F6E3E3',
  onAccent: '#FFFFFF',
  primary: '#141210',
  onPrimary: '#FFFFFF',
  success: '#276F44',
  successSoft: '#E1EEE4',
  danger: '#B4233C',
  dangerSoft: '#F6E3E3',
  star: '#141210',
  scrim: 'rgba(20, 18, 16, 0.45)',
  glass: 'rgba(255, 255, 255, 0.9)',
  shadow: '#2A2015',
};

const dark: typeof light = {
  bg: '#0F0E0D',
  surface: '#1A1816',
  raised: '#221F1C',
  sunken: '#25221F',
  ink: '#F4F0EA',
  inkSoft: '#B3AB9F',
  inkMuted: '#958D82',
  line: '#2B2724',
  lineStrong: '#3A3531',
  accent: '#F2697B',
  accentSoft: '#3A1D22',
  onAccent: '#141210',
  primary: '#F4F0EA',
  onPrimary: '#141210',
  success: '#6FC394',
  successSoft: '#17271F',
  danger: '#F2697B',
  dangerSoft: '#3A1D22',
  star: '#F4F0EA',
  scrim: 'rgba(0, 0, 0, 0.6)',
  glass: 'rgba(26, 24, 22, 0.92)',
  shadow: '#000000',
};

export const palettes = { light, dark };
export type Palette = typeof light;
export type Scheme = keyof typeof palettes;

/** Launch screen is always ink, matching the native splash. */
export const brand = {
  ink: '#0F0E0D',
  linen: '#F3EFE8',
  nar: '#B4233C',
};

/** Fallback cover tones when a venue has no photo. Muted, photographic. */
export const tones = {
  oxblood: { bg: '#4A2321', fg: '#F1E3DA' },
  forest: { bg: '#24382E', fg: '#E3ECE4' },
  navy: { bg: '#232B38', fg: '#E2E6EE' },
  clay: { bg: '#8A5A44', fg: '#F7E9DE' },
  olive: { bg: '#4B4A33', fg: '#EFEDD9' },
  sand: { bg: '#B9A88E', fg: '#2A2218' },
  slate: { bg: '#3B3E43', fg: '#E8E6E2' },
  rose: { bg: '#7C5551', fg: '#F6E6E2' },
  ink: { bg: '#1E1B18', fg: '#EFE8DE' },
  bone: { bg: '#DDD3C3', fg: '#2E261C' },
} as const;
export type ToneName = keyof typeof tones;

/** Onest covers ə/Ə, Cyrillic and the manat sign — one family for everything. */
export const fonts = {
  regular: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  semibold: 'Onest_600SemiBold',
  bold: 'Onest_700Bold',
};

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 };
export const gutter = 20;
export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

/** Motion — Emil Kowalski's curves. Never ease-in on UI. */
export const ease = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
};
export const cssEase = {
  out: cubicBezier(0.23, 1, 0.32, 1),
  inOut: cubicBezier(0.77, 0, 0.175, 1),
};
export const duration = { press: 120, small: 180, medium: 240, large: 300 };
export const spring = {
  settle: { duration: 400, dampingRatio: 1 },
  snap: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
};

export const iconSize = { sm: 16, md: 20, lg: 24 };
export const iconStroke = 1.9;

/** Soft, warm card shadow (iOS) / elevation (Android). */
export const shadow = (c: Palette, level: 1 | 2 = 1) => ({
  shadowColor: c.shadow,
  shadowOpacity: level === 1 ? 0.06 : 0.12,
  shadowRadius: level === 1 ? 10 : 22,
  shadowOffset: { width: 0, height: level === 1 ? 3 : 10 },
  elevation: level === 1 ? 2 : 6,
});
