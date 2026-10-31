import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';

import { businessApi, type Stats } from '@/api/business';
import { hasFeature } from '@/auth/plans';
import { Card, Stat, useOwner, useOwnerData } from '@/components/business/kit';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { Loc } from '@/i18n/types';
import { dayKey } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius } from '@/theme/tokens';

type Range = 7 | 30 | 90;

/** Pro: how the salon is doing, for this location or (owner) all of them. */
export default function StatsScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { business } = useOwner();
  const [days, setDays] = useState<Range>(30);
  const [scope, setScope] = useState<'location' | 'all'>('location');
  const many =
    (business?.locations?.length ?? 1) > 1 && business?.role !== 'manager' && hasFeature(business, 'branches');
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1));
  const { data } = useOwnerData(
    (t) => businessApi.stats(t, { from: dayKey(from), to: dayKey(today), scope }),
    [days, scope],
  );
  const name = (n: string | Loc) => (typeof n === 'string' ? n : i18n.tx(n));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('statsTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <SegmentedControl<string>
          options={([7, 30, 90] as Range[]).map((d) => ({ value: String(d), label: i18n.t('statsDays', { n: d }) }))}
          value={String(days)}
          onChange={(v) => setDays(Number(v) as Range)}
        />
        {many ? (
          <SegmentedControl<'location' | 'all'>
            options={[
              { value: 'location', label: i18n.t('statsThisLocation') },
              { value: 'all', label: i18n.t('statsAllLocations') },
            ]}
            value={scope}
            onChange={setScope}
          />
        ) : null}
        {data ? <Body data={data} name={name} /> : null}
      </ScrollView>
    </View>
  );
}

function Body({ data, name }: { data: Stats; name: (n: string | Loc) => string }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const t = data.totals;
  const max = Math.max(1, ...data.byDay.map((d) => d.bookings));
  const pct = (n: number) => (t.bookings ? `${Math.round((n / t.bookings) * 100)}%` : '0%');
  return (
    <>
      <View style={styles.grid}>
        <Stat
          label={i18n.t('statsBookings')}
          value={String(t.bookings)}
          detail={`${i18n.t('statsFromApp')}: ${t.fromApp}`}
        />
        <Stat label={i18n.t('statsRevenue')} value={i18n.price(t.revenue)} />
        <Stat label={i18n.t('statsCompleted')} value={String(t.completed)} detail={pct(t.completed)} />
        <Stat label={i18n.t('statsNoShows')} value={String(t.noShow)} detail={pct(t.noShow)} />
        <Stat label={i18n.t('statsCancelled')} value={String(t.cancelled)} detail={pct(t.cancelled)} />
        <Stat
          label={i18n.t('statsClients')}
          value={String(t.clients)}
          detail={i18n.t('statsNewClients', { n: t.newClients })}
        />
        <Stat label={i18n.t('statsDepositsKept')} value={i18n.price(t.depositsKept)} />
        <Stat label={i18n.t('statsWaitlist')} value={String(t.waitlist)} />
      </View>

      <Text variant="headline">{i18n.t('statsPerDay')}</Text>
      <View style={[styles.chart, { borderColor: c.line }]} accessibilityRole="image">
        {data.byDay.map((d) => (
          <View key={d.date} style={styles.barSlot}>
            <View
              style={{
                height: `${Math.round((d.bookings / max) * 100)}%`,
                minHeight: d.bookings ? 3 : 0,
                backgroundColor: c.primary,
                borderRadius: 2,
              }}
            />
          </View>
        ))}
      </View>

      {data.scope === 'all' && data.byLocation.length > 1 ? (
        <Breakdown title={i18n.t('statsByLocation')} rows={data.byLocation} name={name} />
      ) : null}
      <Breakdown title={i18n.t('statsByMaster')} rows={data.byMaster} name={name} />
      <Breakdown title={i18n.t('statsByService')} rows={data.byService} name={name} />
    </>
  );
}

function Breakdown({
  title,
  rows,
  name,
}: {
  title: string;
  rows: Stats['byMaster'];
  name: (n: string | Loc) => string;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  if (!rows.length) return null;
  return (
    <>
      <Text variant="headline">{title}</Text>
      <Card>
        {rows.map((r, i) => (
          <View
            key={r.id}
            style={[
              styles.row,
              i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
            ]}
          >
            <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
              {name(r.name)}
            </Text>
            <Text variant="caption" tone="soft">
              {r.bookings} · {i18n.price(r.revenue)}
              {r.rating ? ` · ★ ${i18n.rating(r.rating)}` : ''}
            </Text>
          </View>
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chart: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    borderBottomWidth: 1,
    borderRadius: radius.sm,
  },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
});
