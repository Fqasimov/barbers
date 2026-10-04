import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutRectangle, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { duration, ease, fonts, radius } from '@/theme/tokens';

import { PressableScale } from './PressableScale';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'pill' | 'underline';
  style?: StyleProp<ViewStyle>;
};

/**
 * Tabs/segments with a single indicator that glides between measured
 * positions. The indicator is absolute and childless, so animating its width
 * is safe (no sibling relayout) and keeps the pill's radius crisp.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, variant = 'pill', style }: Props<T>) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const [layouts, setLayouts] = useState<Partial<Record<T, LayoutRectangle>>>({});
  const x = useSharedValue(0);
  const w = useSharedValue(0);
  const ready = useSharedValue(0);

  useEffect(() => {
    const l = layouts[value];
    if (!l) return;
    const animate = ready.get() === 1 && !reduced;
    const cfg = { duration: duration.medium, easing: ease.inOut };
    x.set(animate ? withTiming(l.x, cfg) : l.x);
    w.set(animate ? withTiming(l.width, cfg) : l.width);
    ready.set(1);
  }, [value, layouts, reduced, x, w, ready]);

  const indicator = useAnimatedStyle(() => ({
    opacity: ready.get(),
    transform: [{ translateX: x.get() }],
    width: w.get(),
  }));

  const underline = variant === 'underline';

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.track,
        underline
          ? { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line, borderRadius: 0, padding: 0 }
          : { backgroundColor: c.sunken },
        style,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          underline ? styles.underline : styles.pill,
          underline ? { backgroundColor: c.ink } : { backgroundColor: c.surface, shadowColor: c.shadow },
          indicator,
        ]}
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale
            key={o.value}
            hitStyle={styles.flex}
            onPress={() => onChange(o.value)}
            haptic={active ? 'none' : 'selection'}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onLayout={(e) => {
              const layout = e.nativeEvent.layout;
              setLayouts((prev) => ({ ...prev, [o.value]: layout }));
            }}
          >
            <View style={[styles.segment, underline && styles.segmentUnderline]}>
              <Animated.Text
                maxFontSizeMultiplier={1.3}
                style={[
                  styles.label,
                  {
                    color: active ? c.ink : c.inkSoft,
                    transitionProperty: 'color',
                    transitionDuration: duration.small,
                  },
                ]}
              >
                {o.label}
              </Animated.Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.pill, padding: 4 },
  flex: { flex: 1 },
  pill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: radius.pill,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  underline: { position: 'absolute', bottom: -StyleSheet.hairlineWidth, left: 0, height: 2 },
  segment: { height: 36, alignItems: 'center', justifyContent: 'center' },
  segmentUnderline: { height: 44 },
  label: { fontFamily: fonts.semibold, fontSize: 14 },
});
