import { Star } from 'lucide-react-native';
import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration } from '@/theme/tokens';

import { haptic } from './ui/PressableScale';

const SIZE = 40;
const GAP = 10;

/**
 * Tap a star, or drag across the row to scrub. The value is tracked on the UI
 * thread; React (and the selection tick) only hear about it when it changes.
 */
export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { c } = useTheme();
  const { t } = useI18n();
  const current = useSharedValue(value);
  useEffect(() => {
    current.set(value);
  }, [value, current]);

  const commit = useCallback(
    (v: number) => {
      haptic('selection');
      onChange(v);
    },
    [onChange],
  );

  const gesture = useMemo(() => {
    const set = (x: number) => {
      'worklet';
      const v = Math.max(1, Math.min(5, Math.ceil((x + GAP / 2) / (SIZE + GAP))));
      if (v !== current.get()) {
        current.set(v);
        scheduleOnRN(commit, v);
      }
    };
    const tap = Gesture.Tap().onEnd((e) => set(e.x));
    const pan = Gesture.Pan()
      .activeOffsetX([-6, 6])
      .onBegin((e) => set(e.x))
      .onUpdate((e) => set(e.x));
    return Gesture.Exclusive(pan, tap);
  }, [current, commit]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.row}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={t('ratingLabel')}
        accessibilityValue={{ min: 0, max: 5, now: value, text: value ? t('ofFive', { n: value }) : t('notRated') }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') onChange(Math.min(5, value + 1));
          if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(1, value - 1));
        }}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const on = i <= value;
          return (
            <Animated.View
              key={i}
              style={{
                transform: [{ scale: on ? 1 : 0.88 }],
                transitionProperty: 'transform',
                transitionDuration: duration.small,
                transitionTimingFunction: cssEase.out,
              }}
            >
              <Star
                size={SIZE}
                color={on ? c.star : c.lineStrong}
                fill={on ? c.star : 'transparent'}
                strokeWidth={1.1}
              />
            </Animated.View>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: GAP, alignSelf: 'flex-start', paddingVertical: 6 },
});
