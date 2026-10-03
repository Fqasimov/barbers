import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { DaySchedule } from '@/data/availability';
import { monthShort, sameDay, weekdayShort } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, fonts, radius } from '@/theme/tokens';

import { PressableScale } from '../ui/PressableScale';

type Props = { days: DaySchedule[]; selected: number; onSelect: (index: number) => void; now: Date };

/** The seven bookable days. Days off stay visible but inert, so the week reads as a week. */
export function WeekStrip({ days, selected, onSelect, now }: Props) {
  const { c } = useTheme();
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {days.map((d, i) => {
        const active = i === selected;
        const off = d.off || d.slots.length === 0;
        const today = sameDay(d.date, now);
        const fg = active ? c.onPrimary : off ? c.inkMuted : c.ink;
        return (
          <PressableScale
            key={d.date.toISOString()}
            hitStyle={{ flex: 1 }}
            disabled={off}
            onPress={() => onSelect(i)}
            haptic="selection"
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: off }}
            accessibilityLabel={`${weekdayShort(d.date)} ${d.date.getDate()} ${monthShort(d.date)}${
              d.off ? ', day off' : off ? ', fully booked' : `, ${d.slots.length} times free`
            }`}
          >
            <Animated.View
              style={[
                styles.cell,
                {
                  backgroundColor: active ? c.primary : 'transparent',
                  borderColor: active ? c.primary : c.line,
                  transitionProperty: ['backgroundColor', 'borderColor'],
                  transitionDuration: duration.small,
                  transitionTimingFunction: cssEase.out,
                },
              ]}
            >
              <Animated.Text style={[styles.weekday, { color: fg }]} maxFontSizeMultiplier={1.2}>
                {today ? 'TODAY' : weekdayShort(d.date).toUpperCase()}
              </Animated.Text>
              <Animated.Text
                style={[styles.date, { color: fg, textDecorationLine: d.off ? 'line-through' : 'none' }]}
                maxFontSizeMultiplier={1.2}
              >
                {d.date.getDate()}
              </Animated.Text>
              <View style={[styles.dot, { backgroundColor: off ? 'transparent' : active ? c.onPrimary : c.accent }]} />
            </Animated.View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  cell: {
    height: 78,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  weekday: { fontFamily: fonts.monoMedium, fontSize: 9.5, letterSpacing: 0.8 },
  date: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
