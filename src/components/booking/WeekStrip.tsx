import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { DaySchedule } from '@/data/availability';
import { useI18n } from '@/i18n';
import { sameDay } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, fonts, radius } from '@/theme/tokens';

import { PressableScale } from '../ui/PressableScale';

type Props = { days: DaySchedule[]; selected: number; onSelect: (index: number) => void; now: Date };

/** The seven bookable days. Days off stay visible but inert, so the week reads as a week. */
export function WeekStrip({ days, selected, onSelect, now }: Props) {
  const { c } = useTheme();
  const i18n = useI18n();
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
            accessibilityLabel={`${i18n.shortDate(d.date)}, ${
              d.off ? i18n.t('closed') : off ? i18n.t('fullyBooked') : i18n.n(d.slots.length, 'slot')
            }`}
          >
            <Animated.View
              style={[
                styles.cell,
                {
                  backgroundColor: active ? c.primary : c.surface,
                  borderColor: active ? c.primary : c.line,
                  transitionProperty: ['backgroundColor', 'borderColor'],
                  transitionDuration: duration.small,
                  transitionTimingFunction: cssEase.out,
                },
              ]}
            >
              <Animated.Text style={[styles.weekday, { color: fg }]} maxFontSizeMultiplier={1.2}>
                {today ? i18n.t('today') : i18n.weekdayShort(d.date)}
              </Animated.Text>
              <Animated.Text
                style={[styles.date, { color: fg, textDecorationLine: d.off ? 'line-through' : 'none' }]}
                maxFontSizeMultiplier={1.2}
              >
                {d.date.getDate()}
              </Animated.Text>
              <View style={[styles.dot, { backgroundColor: off ? 'transparent' : active ? c.onPrimary : c.success }]} />
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
  weekday: { fontFamily: fonts.medium, fontSize: 11 },
  date: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
