import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { CalendarDays, CircleUser, Compass, Map, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, ease, fonts, iconStroke } from '@/theme/tokens';

import { haptic } from './ui/PressableScale';

export const TAB_BAR_HEIGHT = 64;

/** Bottom inset every tab screen reserves so content clears the floating bar. */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 24;
}

const meta: Record<string, { label: string; icon: LucideIcon }> = {
  index: { label: 'Discover', icon: Compass },
  map: { label: 'Map', icon: Map },
  bookings: { label: 'Bookings', icon: CalendarDays },
  profile: { label: 'Profile', icon: CircleUser },
};

/**
 * Floating capsule. Tabs are peers, so screens switch instantly; only the
 * active pill glides between them (ease-in-out — it moves, it doesn't enter).
 */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { c, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const upcoming = useStore(
    (s) => s.bookings.filter((b) => b.status === 'upcoming' && new Date(b.start) > new Date()).length,
  );
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const tabW = width / count;
  const x = useSharedValue(0);
  const placed = useSharedValue(0);

  useEffect(() => {
    if (!tabW) return;
    const target = state.index * tabW;
    x.set(placed.get() && !reduced ? withTiming(target, { duration: duration.medium, easing: ease.inOut }) : target);
    placed.set(1);
  }, [state.index, tabW, reduced, x, placed]);

  const pill = useAnimatedStyle(() => ({ opacity: placed.get(), transform: [{ translateX: x.get() }] }));

  const Background =
    Platform.OS === 'ios' ? (
      <BlurView intensity={40} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
    ) : null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: Math.max(insets.bottom, 12) }]}>
      <View
        accessibilityRole="tablist"
        style={[
          styles.bar,
          {
            backgroundColor: Platform.OS === 'ios' ? c.glass : c.surface,
            borderColor: c.line,
            shadowColor: '#000',
          },
        ]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width - 12)}
      >
        {Background}
        {tabW > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.pill, { width: tabW, backgroundColor: c.primary }, pill]}
          />
        ) : null}
        {state.routes.map((route, index) => {
          const m = meta[route.name] ?? { label: route.name, icon: Compass };
          const focused = state.index === index;
          const Icon = m.icon;
          const fg = focused ? c.onPrimary : c.inkSoft;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={m.label}
              style={styles.tab}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  haptic('selection');
                  navigation.navigate(route.name);
                }
              }}
            >
              <View>
                <Icon size={20} color={fg} strokeWidth={iconStroke} />
                {route.name === 'bookings' && upcoming > 0 ? (
                  <View
                    style={[styles.badge, { backgroundColor: c.accent, borderColor: focused ? c.primary : c.surface }]}
                  />
                ) : null}
              </View>
              <Animated.Text
                maxFontSizeMultiplier={1.2}
                style={[
                  styles.label,
                  {
                    color: fg,
                    transitionProperty: 'color',
                    transitionDuration: duration.small,
                    transitionTimingFunction: cssEase.out,
                  },
                ]}
              >
                {m.label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  bar: {
    width: '100%',
    maxWidth: 480,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 6,
    overflow: 'hidden',
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  pill: { position: 'absolute', top: 6, bottom: 6, left: 6, borderRadius: (TAB_BAR_HEIGHT - 12) / 2 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 0.1 },
  badge: { position: 'absolute', top: -2, right: -4, width: 9, height: 9, borderRadius: 5, borderWidth: 1.5 },
});
