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
  largeTitle: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.7 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.45 },
  headline: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  callout: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 19 },
  subhead: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 19 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 17 },
  captionStrong: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17 },
  micro: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
  price: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, fontVariant: ['tabular-nums'] },
  stat: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 30, letterSpacing: -0.5 },
  overline: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.6, textTransform: 'uppercase' },
};

/**
 * In a browser the headings are the website's: Cormorant Garamond at a larger
 * optical size, and small uppercase labels with wide tracking (its "kicker").
 * Numerals stay lining so prices and counts line up.
 */
const siteVariants: Record<TextVariant, TextStyle> = {
  ...nativeVariants,
  largeTitle: { fontFamily: fonts.display, fontSize: 44, lineHeight: 44, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32, letterSpacing: -0.2 },
  stat: { fontFamily: fonts.displaySemibold, fontSize: 36, lineHeight: 38, letterSpacing: -0.3, fontVariant: ['lining-nums'] },
  price: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20, fontVariant: ['tabular-nums', 'lining-nums'] },
  overline: { fontFamily: fonts.semibold, fontSize: 11.5, lineHeight: 16, letterSpacing: 2.3, textTransform: 'uppercase' },
  micro: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.3, textTransform: 'uppercase' },
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

const hasManat = (children: unknown): boolean =>
  typeof children === 'string'
    ? children.includes('₼')
    : Array.isArray(children) && children.some((x) => typeof x === 'string' && x.includes('₼'));

export type TextProps = RNTextProps & { variant?: TextVariant; tone?: Tone; align?: TextStyle['textAlign'] };

export function Text({ variant = 'body', tone = 'ink', align, style, ...rest }: TextProps) {
  const { c } = useTheme();
  // Small soft emphasis is only ever used as a field or section label, so in the browser it
  // takes the website's label style (uppercase, wide tracking, muted) everywhere at once.
  const asLabel = isSite && variant === 'captionStrong' && tone === 'soft';
  const shown: TextVariant = asLabel ? 'overline' : variant;
  // The serif has no manat sign (₼), so amounts in a headline size use Onest, which does.
  const display = isSite && (variant === 'title' || variant === 'largeTitle' || variant === 'stat');
  const amount = display && hasManat(rest.children);
  return (
    <RNText
      maxFontSizeMultiplier={maxScale[shown] ?? 1.6}
      {...rest}
      style={[
        variants[shown],
        amount && { fontFamily: fonts.semibold, fontSize: variants[shown].fontSize! * 0.78, letterSpacing: -0.4 },
        { color: toneColor(c, asLabel ? 'muted' : tone), textAlign: align },
        style,
      ]}
    />
  );
}
