import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { iconStroke, shadow } from '@/theme/tokens';

import { PressableScale, type HapticKind } from './PressableScale';

type Props = {
  icon: LucideIcon;
  label: string;
  onPress?: () => void;
  /** 'float' sits over photos and maps: white disc with a soft shadow. */
  variant?: 'float' | 'surface' | 'plain' | 'solid';
  size?: number;
  active?: boolean;
  activeColor?: string;
  filled?: boolean;
  haptic?: HapticKind;
  style?: StyleProp<ViewStyle>;
};

/** 44pt minimum touch target, even when the glyph is 20pt. */
export function IconButton({
  icon: Icon,
  label,
  onPress,
  variant = 'surface',
  size = 44,
  active,
  activeColor,
  filled,
  haptic = 'selection',
  style,
}: Props) {
  const { c } = useTheme();
  const bg = { float: c.surface, surface: c.surface, plain: 'transparent', solid: c.primary }[variant];
  const fg = variant === 'solid' ? c.onPrimary : active && activeColor ? activeColor : c.ink;
  return (
    <PressableScale
      onPress={onPress}
      haptic={haptic}
      scaleTo={0.92}
      accessibilityLabel={label}
      accessibilityState={active === undefined ? undefined : { selected: active }}
      hitSlop={size < 44 ? (44 - size) / 2 : 0}
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          borderColor: variant === 'surface' ? c.line : 'transparent',
        },
        variant === 'float' && shadow(c, 1),
        style,
      ]}
    >
      <Icon
        size={Math.round(size * 0.45)}
        color={fg}
        strokeWidth={iconStroke}
        fill={(active || filled) && activeColor ? activeColor : 'transparent'}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});
