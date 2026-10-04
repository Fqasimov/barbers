import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { CalendarDays, CircleUser, Compass, Map, type LucideIcon } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

import { haptic } from './ui/PressableScale';

export const TAB_BAR_HEIGHT = 56;

/** Bottom inset every tab screen reserves so content clears the bar. */
export function useTabBarInset() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 20;
}

const meta: Record<string, { label: StringKey; icon: LucideIcon }> = {
  index: { label: 'tabDiscover', icon: Compass },
  map: { label: 'tabMap', icon: Map },
  bookings: { label: 'tabBookings', icon: CalendarDays },
  profile: { label: 'tabProfile', icon: CircleUser },
};

/** A plain, platform-like tab bar. Tabs are peers, so switching is instant. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { c, scheme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const upcoming = useStore(
    (s) => s.bookings.filter((b) => b.status === 'upcoming' && new Date(b.start).getTime() > Date.now()).length,
  );

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : c.surface,
          borderColor: c.line,
        },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={60} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glass }]} />
        </BlurView>
      ) : null}
      {state.routes.map((route, index) => {
        const m = meta[route.name] ?? { label: 'tabDiscover', icon: Compass };
        const focused = state.index === index;
        const Icon = m.icon;
        const fg = focused ? c.ink : c.inkMuted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={t(m.label)}
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
              <Icon size={23} color={fg} strokeWidth={focused ? 2.3 : 1.8} />
              {route.name === 'bookings' && upcoming > 0 ? (
                <View style={[styles.badge, { backgroundColor: c.accent, borderColor: c.surface }]} />
              ) : null}
            </View>
            <Text style={[styles.label, { color: fg, fontFamily: focused ? fonts.semibold : fonts.medium }]}>
              {t(m.label)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: TAB_BAR_HEIGHT - 8 },
  label: { fontSize: 11, letterSpacing: 0.1 },
  badge: { position: 'absolute', top: -1, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
});
