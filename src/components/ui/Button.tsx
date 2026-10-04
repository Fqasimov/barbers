import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, iconStroke, radius } from '@/theme/tokens';

import { PressableScale, type HapticKind } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'tinted';
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

const heights: Record<Size, number> = { lg: 52, md: 44, sm: 36 };

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
  const palette = {
    primary: { bg: c.primary, fg: c.onPrimary, border: c.primary },
    accent: { bg: c.accent, fg: c.onAccent, border: c.accent },
    secondary: { bg: c.surface, fg: c.ink, border: c.lineStrong },
    tinted: { bg: c.sunken, fg: c.ink, border: c.sunken },
    ghost: { bg: 'transparent', fg: c.ink, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;
  const iconSize = size === 'sm' ? 16 : 18;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      haptic={haptic}
      hitStyle={hitStyle}
      hitSlop={size === 'sm' ? 6 : 0}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={[
        styles.base,
        {
          height: heights[size],
          borderRadius: size === 'lg' ? radius.md : radius.sm,
          paddingHorizontal: size === 'sm' ? 12 : 20,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.35 : 1,
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
              fontSize: size === 'sm' ? 13.5 : 15.5,
              lineHeight: 20,
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
