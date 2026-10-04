import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, fonts, radius } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Chip({ label, selected, onPress, icon: Icon, size = 'md', style, accessibilityLabel }: Props) {
  const { c } = useTheme();
  const fg = selected ? c.onPrimary : c.ink;
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: !!selected }}
      hitSlop={size === 'sm' ? 6 : 4}
      style={style}
    >
      <Animated.View
        style={[
          styles.chip,
          size === 'sm' && styles.small,
          {
            backgroundColor: selected ? c.primary : c.surface,
            borderColor: selected ? c.primary : c.line,
            transitionProperty: ['backgroundColor', 'borderColor'],
            transitionDuration: duration.small,
            transitionTimingFunction: cssEase.out,
          },
        ]}
      >
        {Icon ? <Icon size={15} color={fg} strokeWidth={2} /> : null}
        <Animated.Text
          maxFontSizeMultiplier={1.4}
          style={[
            styles.label,
            size === 'sm' && styles.smallLabel,
            {
              color: fg,
              transitionProperty: 'color',
              transitionDuration: duration.small,
              transitionTimingFunction: cssEase.out,
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  small: { height: 32, paddingHorizontal: 12 },
  label: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 18 },
  smallLabel: { fontSize: 13 },
});
