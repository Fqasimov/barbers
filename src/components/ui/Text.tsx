import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type Palette } from '@/theme/tokens';

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
  | 'stat';

type Tone = 'ink' | 'soft' | 'muted' | 'accent' | 'onPrimary' | 'success' | 'danger' | 'inherit';

const variants: Record<TextVariant, TextStyle> = {
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
};

const maxScale: Partial<Record<TextVariant, number>> = { largeTitle: 1.25, title: 1.3, stat: 1.25, micro: 1.4 };

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
  return (
    <RNText
      maxFontSizeMultiplier={maxScale[variant] ?? 1.6}
      {...rest}
      style={[variants[variant], { color: toneColor(c, tone), textAlign: align }, style]}
    />
  );
}
