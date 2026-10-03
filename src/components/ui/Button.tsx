import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts, iconStroke, radius } from '@/theme/tokens';

import { PressableScale, type HapticKind } from './PressableScale';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';
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

const heights: Record<Size, number> = { lg: 54, md: 44, sm: 36 };

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
    secondary: { bg: 'transparent', fg: c.ink, border: c.lineStrong },
    ghost: { bg: 'transparent', fg: c.ink, border: 'transparent' },
  }[variant];
  const inactive = disabled || loading;

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
          paddingHorizontal: size === 'sm' ? 14 : 22,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: disabled ? 0.38 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {Icon ? <Icon size={size === 'sm' ? 16 : 18} color={palette.fg} strokeWidth={iconStroke} /> : null}
          <Text
            variant={size === 'sm' ? 'caption' : 'bodyMedium'}
            style={{ color: palette.fg, fontFamily: fonts.bodyMedium }}
            numberOfLines={1}
          >
            {label}
          </Text>
          {IconRight ? <IconRight size={size === 'sm' ? 16 : 18} color={palette.fg} strokeWidth={iconStroke} /> : null}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
