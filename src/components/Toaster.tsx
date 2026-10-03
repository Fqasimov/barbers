import { Check, Info } from 'lucide-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { useTheme } from '@/theme/ThemeProvider';
import { ease, radius } from '@/theme/tokens';

import { Text } from './ui/Text';

type Toast = { id: number; message: string; kind: 'success' | 'info' };

const useToastStore = create<{
  toast: Toast | null;
  show: (message: string, kind?: Toast['kind']) => void;
  clear: () => void;
}>((set) => ({
  toast: null,
  show: (message, kind = 'success') => set({ toast: { id: Date.now(), message, kind } }),
  clear: () => set({ toast: null }),
}));

export const toast = (message: string, kind?: Toast['kind']) => useToastStore.getState().show(message, kind);

// Module scope — layout-animation builders should not be rebuilt per render.
// It exits the way it came in, ~20% faster.
const ENTER = FadeInUp.duration(280).easing(ease.out);
const EXIT = FadeOutUp.duration(220).easing(ease.out);

export function Toaster() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const current = useToastStore((s) => s.toast);
  const clear = useToastStore((s) => s.clear);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(clear, 2800);
    return () => clearTimeout(t);
  }, [current, clear]);

  const Icon = current?.kind === 'info' ? Info : Check;

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      {current ? (
        <Animated.View
          key={current.id}
          entering={ENTER}
          exiting={EXIT}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          style={[styles.toast, { backgroundColor: c.primary }]}
        >
          <View style={[styles.icon, { backgroundColor: c.accent }]}>
            <Icon size={14} color={c.onAccent} strokeWidth={2.2} />
          </View>
          <Text variant="callout" style={{ color: c.onPrimary, flexShrink: 1 }}>
            {current.message}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 50 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: radius.pill,
    maxWidth: 420,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  icon: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
