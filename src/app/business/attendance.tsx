import { router } from 'expo-router';
import { ClipboardCheck, UserCog } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi, type AttendanceRow } from '@/api/business';
import { Card, useOwner, useOwnerData } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { addDays, dayKey, fromDayKey, startOfDay } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, isSite, radius } from '@/theme/tokens';
import { useWide } from '@/theme/wide';

type Range = 7 | 30;

/** When each master checked in and out, against their planned shift. They tick it in their own cabinet. */
export default function AttendanceScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const wide = useWide();
  const { business } = useOwner();
  const [days, setDays] = useState<Range>(7);
  const today = startOfDay(new Date());
  const { data } = useOwnerData(
    (t) => businessApi.attendance(t, { from: dayKey(addDays(today, -(days - 1))), to: dayKey(today) }),
    [days],
  );
  const owner = business?.role !== 'manager';
  const time = (iso: string | null) =>
    iso ? new Date(iso).toLocaleTimeString(i18n.locale, { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
  const hours = (min: number) => i18n.t('attHours', { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') });

  // Newest day first, each day's check-ins together.
  const byDay = new Map<string, AttendanceRow[]>();
  data?.rows.forEach((r) => byDay.set(r.day, [...(byDay.get(r.day) ?? []), r]));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('attTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Text variant="subhead" tone="soft">
          {i18n.t('attSub')}
        </Text>
        <SegmentedControl<string>
          options={([7, 30] as Range[]).map((d) => ({ value: String(d), label: i18n.t('statsDays', { n: d }) }))}
          value={String(days)}
          onChange={(v) => setDays(Number(v) as Range)}
        />

        {data ? (
          <View style={wide ? styles.cols : { gap: 16 }}>
            <View style={wide ? { flex: 1, gap: 12 } : { gap: 12 }}>
              <Text variant="headline">{i18n.t('attSummary')}</Text>
              <Card>
                {data.byMaster.map((m, i) => (
                  <View
                    key={m.masterId}
                    style={[
                      styles.row,
                      i < data.byMaster.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderColor: c.line,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong">{m.name}</Text>
                      <Text variant="caption" tone="soft">
                        {i18n.t('attDaysWorked', { n: m.days })} · {hours(m.minutes)}
                        {m.late ? ` · ${i18n.t('attLateTimes', { n: m.late })}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: m.checkedIn ? c.successSoft : c.sunken }]}>
                      <Text variant="micro" tone={m.checkedIn ? 'success' : 'muted'}>
                        {i18n.t(m.checkedIn ? 'attAtWork' : 'attAway')}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
              {owner ? (
                <Button
                  label={i18n.t('attInvite')}
                  icon={UserCog}
                  variant="secondary"
                  size="md"
                  onPress={() => router.push('/business/team')}
                />
              ) : null}
            </View>

            <View style={wide ? { flex: 1.3, gap: 12 } : { gap: 12 }}>
              <Text variant="headline">{i18n.t('attLog')}</Text>
              {data.rows.length ? (
                [...byDay.entries()].map(([day, rows]) => (
                  <View key={day} style={{ gap: 8 }}>
                    <Text variant="overline" tone="muted">
                      {i18n.fullDate(fromDayKey(day)!)}
                    </Text>
                    <Card>
                      {rows.map((r, i) => (
                        <View
                          key={r.id}
                          style={[
                            styles.row,
                            i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                          ]}
                        >
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text variant="bodyStrong">{r.masterName ?? '—'}</Text>
                            <Text variant="caption" tone="soft">
                              {r.shift
                                ? i18n.t('attPlanned', { from: r.shift.start, to: r.shift.end })
                                : i18n.t('attNoShift')}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 2 }}>
                            <Text variant="bodyStrong" style={styles.times}>
                              {time(r.checkInAt)} – {r.checkOutAt ? time(r.checkOutAt) : i18n.t('attNow')}
                            </Text>
                            <Text variant="caption" tone={r.lateMinutes ? 'danger' : 'soft'}>
                              {r.lateMinutes
                                ? i18n.t('attLateBy', { n: r.lateMinutes })
                                : r.minutes !== null
                                  ? hours(r.minutes)
                                  : i18n.t('attAtWork')}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </Card>
                  </View>
                ))
              ) : (
                <EmptyState icon={ClipboardCheck} title={i18n.t('attEmpty')} body={i18n.t('attEmptyBody')} />
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  cols: { flexDirection: 'row', alignItems: 'flex-start', gap: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: isSite ? radius.sm : 999 },
  times: { fontVariant: ['tabular-nums'] },
});
