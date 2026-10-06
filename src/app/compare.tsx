import { router } from 'expo-router';
import { ArrowLeftRight, Plus, X } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { SalonPhoto } from '@/components/SalonPhoto';
import { SalonRow } from '@/components/SalonRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { Text } from '@/components/ui/Text';
import { anyMasterWeek, eligibleMasters } from '@/data/availability';
import { liveRating, openState, rankForMap } from '@/data/ranking';
import { salonById } from '@/data/salons';
import type { Salon } from '@/data/types';
import { useOrigin } from '@/hooks/useOrigin';
import { useI18n } from '@/i18n';
import { distanceKm } from '@/lib/geo';
import { atMinutes, fmtClock } from '@/lib/time';
import { useVisibleSalons } from '@/hooks/useVisibleSalons';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, shadow } from '@/theme/tokens';

const REFLOW = LinearTransition.duration(220);
const IN = FadeIn.duration(180);

type Column = {
  salon: Salon;
  price?: number;
  rating: number;
  count: number;
  distance: number;
  next?: Date;
  masters: number;
};

/** Side-by-side comparison of 2–3 venues for one service. */
export default function CompareScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { origin } = useOrigin();
  const ids = useStore((s) => s.compare);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const bookings = useStore((s) => s.bookings);
  const localReviews = useStore((s) => s.reviews);
  const salons = useVisibleSalons();
  const [now] = useState(() => new Date());

  const chosen = useMemo(() => ids.map((id) => salonById(id)).filter((s): s is Salon => !!s), [ids]);

  // Services offered by at least one venue, most widely offered first.
  const serviceKeys = useMemo(() => {
    const counts = new Map<string, number>();
    chosen.forEach((s) => s.services.forEach((sv) => counts.set(sv.key, (counts.get(sv.key) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, [chosen]);
  const [picked, setPicked] = useState<string | null>(null);
  const serviceKey = picked && serviceKeys.includes(picked) ? picked : serviceKeys[0];

  const columns: Column[] = useMemo(
    () =>
      chosen.map((salon) => {
        const service = salon.services.find((s) => s.key === serviceKey);
        const live = liveRating(salon, localReviews);
        let next: Date | undefined;
        if (service) {
          const { days } = anyMasterWeek({
            salon,
            masters: eligibleMasters(salon, [service.id]),
            durationMin: service.durationMin,
            bookings,
            now,
          });
          const day = days.find((d) => d.slots.length);
          if (day) next = atMinutes(day.date, day.slots[0]);
        }
        return {
          salon,
          price: service?.price,
          rating: live.rating,
          count: live.count,
          distance: distanceKm(origin, salon.coords),
          next,
          masters: service ? eligibleMasters(salon, [service.id]).length : 0,
        };
      }),
    [chosen, serviceKey, localReviews, bookings, now, origin],
  );

  const best = (pick: (c: Column) => number | undefined, mode: 'min' | 'max') => {
    const vals = columns.map(pick).filter((v): v is number => v !== undefined);
    if (vals.length < 2) return undefined;
    return mode === 'min' ? Math.min(...vals) : Math.max(...vals);
  };
  const bestPrice = best((x) => x.price, 'min');
  const bestRating = best((x) => Math.floor(x.rating * 10) / 10, 'max');
  const bestDistance = best((x) => x.distance, 'min');
  const bestNext = best((x) => x.next?.getTime(), 'min');

  const suggestions = useMemo(
    () =>
      rankForMap({
        salons: salons.filter(
          (s) => !ids.includes(s.id) && (!chosen[0] || s.categories.some((cat) => chosen[0].categories.includes(cat))),
        ),
        localReviews,
        origin,
        priceLevels: [],
        category: null,
        sort: 'best',
      }).slice(0, 5),
    [salons, ids, chosen, localReviews, origin],
  );

  const sample = chosen.flatMap((s) => s.services).find((s) => s.key === serviceKey);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: gutter }}>
          <Text variant="largeTitle" accessibilityRole="header">
            {i18n.t('compareTitle')}
          </Text>
        </View>

        {chosen.length === 0 ? (
          <EmptyState icon={ArrowLeftRight} title={i18n.t('compareEmptyTitle')} body={i18n.t('compareEmpty')} />
        ) : (
          <>
            <Text variant="headline" style={styles.label}>
              {i18n.t('compareFor')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {serviceKeys.map((key) => {
                const sv = chosen.flatMap((s) => s.services).find((s) => s.key === key)!;
                return (
                  <Chip
                    key={key}
                    size="sm"
                    label={i18n.tx(sv.name)}
                    selected={key === serviceKey}
                    onPress={() => setPicked(key)}
                  />
                );
              })}
            </ScrollView>

            <Animated.View layout={REFLOW} style={[styles.table, { backgroundColor: c.surface }, shadow(c, 1)]}>
              <View style={styles.cols}>
                {columns.map((col) => (
                  <Animated.View key={col.salon.id} entering={IN} style={styles.col}>
                    <SalonPhoto salon={col.salon} width="100%" height={84} radius={radius.sm}>
                      <IconButton
                        icon={X}
                        label={i18n.t('removeFromCompare')}
                        variant="float"
                        size={28}
                        onPress={() => toggleCompare(col.salon.id)}
                        style={{ position: 'absolute', top: 6, right: 6 }}
                      />
                    </SalonPhoto>
                    <Text variant="bodyStrong" numberOfLines={2} style={{ marginTop: 8 }}>
                      {col.salon.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {col.salon.district}
                    </Text>
                  </Animated.View>
                ))}
              </View>

              <Row label={`${i18n.t('rowPrice')}${sample ? ` · ${i18n.duration(sample.durationMin)}` : ''}`}>
                {columns.map((col) => (
                  <Cell key={col.salon.id} highlight={col.price !== undefined && col.price === bestPrice}>
                    {col.price !== undefined ? i18n.price(col.price) : i18n.t('notOffered')}
                  </Cell>
                ))}
              </Row>
              <Row label={i18n.t('rowRating')}>
                {columns.map((col) => (
                  <Cell
                    key={col.salon.id}
                    highlight={Math.floor(col.rating * 10) / 10 === bestRating}
                    sub={i18n.n(col.count, 'review')}
                  >
                    {`★ ${i18n.rating(col.rating)}`}
                  </Cell>
                ))}
              </Row>
              <Row label={i18n.t('rowDistance')}>
                {columns.map((col) => (
                  <Cell key={col.salon.id} highlight={col.distance === bestDistance}>
                    {i18n.distance(col.distance)}
                  </Cell>
                ))}
              </Row>
              <Row label={i18n.t('rowNextFree')}>
                {columns.map((col) => (
                  <Cell
                    key={col.salon.id}
                    highlight={!!col.next && col.next.getTime() === bestNext}
                    sub={col.next ? i18n.relativeDay(col.next) : undefined}
                  >
                    {col.next ? fmtClock(col.next.getHours() * 60 + col.next.getMinutes()) : '—'}
                  </Cell>
                ))}
              </Row>
              <Row label={i18n.t('rowToday')}>
                {columns.map((col) => {
                  const o = openState(col.salon, now);
                  return (
                    <Cell key={col.salon.id} tone={o.open ? 'success' : 'muted'}>
                      {i18n.t(o.kind, { time: o.time ?? '' })}
                    </Cell>
                  );
                })}
              </Row>
              <Row label={i18n.t('rowMasters')}>
                {columns.map((col) => (
                  <Cell key={col.salon.id} sub={col.salon.womenOnly ? i18n.t('womenOnly') : undefined}>
                    {String(col.masters)}
                  </Cell>
                ))}
              </Row>

              <View style={[styles.cols, { marginTop: 14 }]}>
                {columns.map((col) => {
                  const service = col.salon.services.find((s) => s.key === serviceKey);
                  return (
                    <View key={col.salon.id} style={styles.col}>
                      <Button
                        label={i18n.t('bookHere')}
                        size="sm"
                        variant={service ? 'primary' : 'tinted'}
                        disabled={!service}
                        onPress={() =>
                          router.push({
                            pathname: '/book/[id]',
                            params: { id: col.salon.id, ...(service ? { services: service.id } : {}) },
                          })
                        }
                      />
                    </View>
                  );
                })}
              </View>
            </Animated.View>
          </>
        )}

        {chosen.length < 3 ? (
          <>
            <Text variant="title" style={[styles.label, { marginTop: 32 }]}>
              {i18n.t('addPlace')}
            </Text>
            {suggestions.map((item, i) => (
              <SalonRow
                key={item.salon.id}
                item={item}
                last={i === suggestions.length - 1}
                onPress={() => {
                  if (!toggleCompare(item.salon.id)) toast(i18n.t('compareLimit'), 'info');
                }}
                right={
                  <View style={[styles.add, { backgroundColor: c.primary }]}>
                    <Plus size={16} color={c.onPrimary} strokeWidth={2.4} />
                  </View>
                }
              />
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={[styles.row, { borderColor: c.line }]}>
      <Text variant="caption" tone="muted" style={{ marginBottom: 6 }}>
        {label}
      </Text>
      <View style={styles.cols}>{children}</View>
    </View>
  );
}

function Cell({
  children,
  highlight,
  sub,
  tone,
}: {
  children: string;
  highlight?: boolean;
  sub?: string;
  tone?: 'success' | 'muted';
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const color = highlight || tone === 'success' ? c.success : tone === 'muted' ? c.inkMuted : c.ink;
  return (
    <View style={styles.col}>
      <Text variant={tone ? 'captionStrong' : 'bodyStrong'} style={{ color }} numberOfLines={2}>
        {children}
      </Text>
      {sub ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
      {highlight ? (
        <View style={[styles.best, { backgroundColor: c.successSoft }]}>
          <Text variant="micro" style={{ color: c.success }}>
            {i18n.t('best')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { paddingHorizontal: gutter, marginTop: 20, marginBottom: 10 },
  chips: { paddingHorizontal: gutter, gap: 8 },
  table: { marginHorizontal: gutter, marginTop: 18, borderRadius: radius.lg, padding: 14 },
  cols: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, minWidth: 0 },
  row: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 12 },
  best: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  add: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
