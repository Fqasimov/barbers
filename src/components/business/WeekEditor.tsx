import { Copy } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { isClock, TimeField } from '@/components/business/kit';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { toMinutes, fromDayKey } from '@/lib/time';
import { WEEK_ORDER } from '@/lib/week';
import { useTheme } from '@/theme/ThemeProvider';

/** One day's times; null = closed / day off. */
export type Span = { from: string; to: string } | null;
/** Seven spans, index 0 = Sunday. */
export type WeekSpans = Span[];

/** Field errors for a week: day → which time is wrong. */
export type WeekErrors = Record<number, { from?: StringKey; to?: StringKey }>;

export function checkWeek(week: WeekSpans): WeekErrors {
  const out: WeekErrors = {};
  week.forEach((d, i) => {
    if (!d) return;
    const from = isClock(d.from) ? undefined : ('errClock' as const);
    const to = !isClock(d.to)
      ? ('errClock' as const)
      : !from && toMinutes(d.to) <= toMinutes(d.from)
        ? ('errCloseAfterOpen' as const)
        : undefined;
    if (from || to) out[i] = { from, to };
  });
  return out;
}

// 7 Jan 2024 was a Sunday.
const dateOf = (dow: number) => fromDayKey(`2024-01-${String(7 + dow).padStart(2, '0')}`)!;

/**
 * Seven rows, Monday first: open or closed, and from–to times for open days.
 * "Same for all" copies a day's times to every other open day.
 */
export function WeekEditor({
  value,
  onChange,
  errors = {},
  fromLabel,
  toLabel,
  onLabel,
  offLabel,
  fallback,
}: {
  value: WeekSpans;
  onChange: (week: WeekSpans) => void;
  errors?: WeekErrors;
  fromLabel: string;
  toLabel: string;
  onLabel: string;
  offLabel: string;
  /** Times a day gets when it is switched on. */
  fallback: { from: string; to: string };
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const set = (dow: number, span: Span) => onChange(value.map((d, i) => (i === dow ? span : d)));
  const copyToAll = (dow: number) => {
    const src = value[dow];
    if (!src) return;
    onChange(value.map((d) => (d ? { ...src } : d)));
  };

  return (
    <View style={{ gap: 4 }}>
      {WEEK_ORDER.map((dow, i) => {
        const day = value[dow];
        const err = errors[dow] ?? {};
        return (
          <View
            key={dow}
            style={[styles.row, i < 6 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
          >
            <View style={styles.head}>
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {i18n.weekdayLong(dateOf(dow))}
              </Text>
              {day ? (
                <PressableScale
                  onPress={() => copyToAll(dow)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={i18n.t('weekCopyAll')}
                  style={styles.copy}
                >
                  <Copy size={14} color={c.inkSoft} />
                  <Text variant="caption" tone="soft">
                    {i18n.t('weekCopyAll')}
                  </Text>
                </PressableScale>
              ) : null}
              <Chip
                size="sm"
                label={day ? onLabel : offLabel}
                selected={!!day}
                onPress={() => set(dow, day ? null : { ...fallback })}
                accessibilityLabel={`${i18n.weekdayLong(dateOf(dow))}: ${day ? onLabel : offLabel}`}
              />
            </View>
            {day ? (
              <View style={styles.pair}>
                <View style={{ flex: 1 }}>
                  <TimeField
                    label={fromLabel}
                    value={day.from}
                    onChange={(v) => set(dow, { ...day, from: v })}
                    error={err.from ? i18n.t(err.from) : null}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TimeField
                    label={toLabel}
                    value={day.to}
                    onChange={(v) => set(dow, { ...day, to: v })}
                    error={err.to ? i18n.t(err.to) : null}
                  />
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pair: { flexDirection: 'row', gap: 12 },
});
