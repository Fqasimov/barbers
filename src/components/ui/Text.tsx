import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, type Palette } from '@/theme/tokens';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'headline'
  | 'serif'
  | 'price'
  | 'body'
  | 'bodyMedium'
  | 'callout'
  | 'caption'
  | 'label'
  | 'mono';

type Tone = 'ink' | 'soft' | 'muted' | 'accent' | 'onPrimary' | 'success' | 'danger' | 'inherit';

const variants: Record<TextVariant, TextStyle> = {
  hero: { fontFamily: fonts.displayLight, fontSize: 44, lineHeight: 46, letterSpacing: -1.1 },
  display: { fontFamily: fonts.displayLight, fontSize: 36, lineHeight: 40, letterSpacing: -0.8 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, letterSpacing: -0.5 },
  headline: { fontFamily: fonts.display, fontSize: 21, lineHeight: 26, letterSpacing: -0.2 },
  serif: { fontFamily: fonts.display, fontSize: 17, lineHeight: 22, letterSpacing: -0.1 },
  price: { fontFamily: fonts.displayMedium, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.monoMedium, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  mono: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
};

const italicFor: Partial<Record<TextVariant, string>> = {
  hero: fonts.displayLightItalic,
  display: fonts.displayLightItalic,
  title: fonts.displayItalic,
  headline: fonts.displayItalic,
  serif: fonts.displayItalic,
};

/** Display sizes cap their scaling so hero type never breaks the layout. */
const maxScale: Partial<Record<TextVariant, number>> = { hero: 1.2, display: 1.25, title: 1.3, label: 1.4 };

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

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: Tone;
  italic?: boolean;
  align?: TextStyle['textAlign'];
};

export function Text({ variant = 'body', tone = 'ink', italic, align, style, ...rest }: TextProps) {
  const { c } = useTheme();
  const base = variants[variant];
  const family = italic && italicFor[variant] ? italicFor[variant] : base.fontFamily;
  return (
    <RNText
      maxFontSizeMultiplier={maxScale[variant] ?? 1.6}
      {...rest}
      style={[base, { fontFamily: family, color: toneColor(c, tone), textAlign: align }, style]}
    />
  );
}
