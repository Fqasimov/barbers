import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, fonts, iconStroke, radius } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: LucideIcon;
  count?: number;
  size?: 'md' | 'sm';
  /** Serif label — used for the ₼ price chips, since Geist has no manat glyph. */
  serif?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Chip({
  label,
  selected,
  onPress,
  icon: Icon,
  count,
  size = 'md',
  serif,
  style,
  accessibilityLabel,
}: Props) {
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
            backgroundColor: selected ? c.primary : 'transparent',
            borderColor: selected ? c.primary : c.lineStrong,
            transitionProperty: ['backgroundColor', 'borderColor'],
            transitionDuration: duration.small,
            transitionTimingFunction: cssEase.out,
          },
        ]}
      >
        {Icon ? <Icon size={15} color={fg} strokeWidth={iconStroke} /> : null}
        <Animated.Text
          maxFontSizeMultiplier={1.4}
          style={[
            styles.label,
            serif && styles.serif,
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
        {count !== undefined ? (
          <View style={[styles.count, { backgroundColor: selected ? c.onPrimary : c.sunken }]}>
            <Animated.Text style={[styles.countText, { color: selected ? c.primary : c.inkSoft }]}>
              {count}
            </Animated.Text>
          </View>
        ) : null}
      </Animated.View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  small: { height: 32, paddingHorizontal: 12 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 18 },
  smallLabel: { fontSize: 13 },
  serif: { fontFamily: fonts.displayMedium, fontSize: 15 },
  count: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countText: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 12 },
});
