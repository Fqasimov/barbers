import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, fonts, iconStroke, isSite, radius } from '@/theme/tokens';

import { PressableScale, type HapticKind } from './PressableScale';
import { Text } from './Text';

/**
 * `ghostOnPrimary`: an outline button for use on a `primary`-coloured surface.
 * `onPrimary`: a solid light button for the same dark surfaces.
 */
type Variant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'ghostOnPrimary'
  | 'onPrimary'
  | 'accent'
  | 'tinted'
  | 'danger'
  | 'dangerGhost';
type Size = 'lg' | 'md' | 'sm';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  haptic?: HapticKind;
  style?: StyleProp<ViewStyle>;
  hitStyle?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const heights: Record<Size, number> = isSite ? { lg: 54, md: 46, sm: 40 } : { lg: 52, md: 44, sm: 36 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon: Icon,
  iconRight: IconRight,
  disabled,
  loading,
  haptic = 'light',
  style,
  hitStyle,
  accessibilityHint,
}: Props) {
  const { c } = useTheme();
  // Only a mouse hovers: touch screens never fire these, so the effect is desktop-only by construction.
  const [hovered, setHovered] = useState(false);
  const palette = {
    primary: { bg: c.primary, fg: c.onPrimary, border: c.primary },
    accent: { bg: c.accent, fg: c.onAccent, border: c.accent },
    secondary: { bg: c.surface, fg: c.ink, border: c.lineStrong },
    tinted: { bg: c.sunken, fg: c.ink, border: c.sunken },
    ghost: { bg: 'transparent', fg: c.ink, border: 'transparent' },
    ghostOnPrimary: { bg: 'transparent', fg: c.onPrimary, border: c.onPrimary },
    onPrimary: isSite
      ? { bg: c.onPrimary, fg: c.primary, border: c.onPrimary }
      : { bg: c.surface, fg: c.ink, border: c.lineStrong },
    danger: { bg: c.danger, fg: '#FFFFFF', border: c.danger },
    dangerGhost: { bg: 'transparent', fg: c.danger, border: 'transparent' },
  }[variant];
  if (isSite) {
    // The website's buttons: ink fill, outline, ghost with a stronger rule; hover turns ink to burgundy
    // and fills the outline with ink.
    const site = {
      primary: { bg: c.primary, fg: c.onPrimary, border: c.primary },
      secondary: { bg: 'transparent', fg: c.ink, border: c.ink },
      ghost: { bg: 'transparent', fg: c.ink, border: c.lineStrong },
      tinted: { bg: c.sunken, fg: c.ink, border: c.sunken },
    }[variant as 'primary' | 'secondary' | 'ghost' | 'tinted'];
    if (site) Object.assign(palette, site);
    if (hovered && !disabled && !loading) {
      if (variant === 'primary') Object.assign(palette, { bg: c.accent, border: c.accent, fg: c.onAccent });
      else if (variant === 'secondary') Object.assign(palette, { bg: c.ink, fg: c.onPrimary });
      else if (variant === 'ghost') Object.assign(palette, { border: c.ink });
      else if (variant === 'onPrimary') Object.assign(palette, { bg: 'transparent', fg: c.onPrimary });
      else if (variant === 'ghostOnPrimary') Object.assign(palette, { bg: c.onPrimary, fg: c.primary });
    }
  }
  const inactive = disabled || loading;
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      haptic={haptic}
      hitStyle={hitStyle}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      hitSlop={size === 'sm' ? 6 : 0}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        {
          height: heights[size],
          borderRadius: size === 'lg' ? radius.md : radius.sm,
          paddingHorizontal: isSite ? (size === 'sm' ? 20 : 30) : size === 'sm' ? 12 : 20,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? (isSite ? 0.5 : 0.35) : 1,
          ...(isSite
            ? ({
                transitionProperty: ['backgroundColor', 'borderColor', 'opacity'],
                transitionDuration: duration.small,
                transitionTimingFunction: cssEase.out,
              } as object)
            : null),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={iconSize} color={palette.fg} strokeWidth={iconStroke} /> : null}
          <Text
            numberOfLines={1}
            style={{
              color: palette.fg,
              fontFamily: fonts.semibold,
              fontSize: isSite ? (size === 'sm' ? 11.5 : 12.5) : size === 'sm' ? 13.5 : 15.5,
              lineHeight: 20,
              ...(isSite ? { letterSpacing: size === 'sm' ? 1.8 : 2, textTransform: 'uppercase' as const } : null),
            }}
          >
            {label}
          </Text>
          {IconRight ? <IconRight size={iconSize} color={palette.fg} strokeWidth={iconStroke} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
