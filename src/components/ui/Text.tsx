import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, isSite, type Palette } from '@/theme/tokens';

export type TextVariant =
  | 'largeTitle'
  | 'title'
  | 'headline'
  | 'body'
  | 'bodyStrong'
  | 'callout'
  | 'subhead'
  | 'caption'
  | 'captionStrong'
  | 'micro'
  | 'price'
  | 'stat'
  | 'overline';

type Tone = 'ink' | 'soft' | 'muted' | 'accent' | 'onPrimary' | 'success' | 'danger' | 'inherit';

const nativeVariants: Record<TextVariant, TextStyle> = {
  largeTitle: { fontFamily: fonts.semibold, fontSize: 30, lineHeight: 35, letterSpacing: -1.1 },
  title: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 27, letterSpacing: -0.6 },
  headline: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  callout: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19 },
  subhead: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17 },
  captionStrong: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17 },
  micro: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14 },
  price: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, fontVariant: ['tabular-nums'] },
  stat: { fontFamily: fonts.semibold, fontSize: 26, lineHeight: 30, letterSpacing: -0.9 },
  overline: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16 },
};

/**
 * In a browser the headings follow the website (2026 refresh): larger, tightly tracked Geist,
 * and its small labels set in Geist Mono, without capitals or wide tracking.
 */
const siteVariants: Record<TextVariant, TextStyle> = {
  ...nativeVariants,
  largeTitle: { fontFamily: fonts.display, fontSize: 44, lineHeight: 46, letterSpacing: -1.9 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -1 },
  stat: { fontFamily: fonts.displaySemibold, fontSize: 34, lineHeight: 38, letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  price: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, fontVariant: ['tabular-nums'] },
  overline: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 17 },
  micro: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14 },
};

const variants = isSite ? siteVariants : nativeVariants;

const maxScale: Partial<Record<TextVariant, number>> = { largeTitle: 1.25, title: 1.3, stat: 1.25, micro: 1.4, overline: 1.4 };

const toneColor = (c: Palette, tone: Tone) =>
  ({
    ink: c.ink,
    soft: c.inkSoft,
    muted: c.inkMuted,
    accent: c.accent,
    onPrimary: c.onPrimary,
    success: c.success,
    danger: c.danger,
    inherit: undefined,
  })[tone];

export type TextProps = RNTextProps & { variant?: TextVariant; tone?: Tone; align?: TextStyle['textAlign'] };

export function Text({ variant = 'body', tone = 'ink', align, style, ...rest }: TextProps) {
  const { c } = useTheme();
  // Small soft emphasis is only ever used as a field or section label, so in the browser it
  // takes the website's label style (Geist Mono, muted) everywhere at once.
  const asLabel = isSite && variant === 'captionStrong' && tone === 'soft';
  const shown: TextVariant = asLabel ? 'overline' : variant;
  return (
    <RNText
      maxFontSizeMultiplier={maxScale[shown] ?? 1.6}
      {...rest}
      style={[
        variants[shown],
        { color: toneColor(c, asLabel ? 'muted' : tone), textAlign: align },
        style,
      ]}
    />
  );
}
