import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, Coffee, Phone, Plus } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi, type BusinessBooking } from '@/api/business';
import { isLive } from '@/api/client';
import { authErrorKey } from '@/auth/flow';
import { Card, useOwner } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { addDays, dayKey, fmtClock, minutesOfDay, startOfDay } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

const DAYS = 14;

const endOf = (b: BusinessBooking) =>
  b.end ? new Date(b.end).getTime() : new Date(b.start).getTime() + b.durationMin * 60_000;
/** Whether a booking or time off touches this calendar day. */
const onDay = (b: BusinessBooking, day: Date) =>
  new Date(b.start).getTime() < addDays(day, 1).getTime() && endOf(b) > day.getTime();

/** The salon's appointments and time off, a day at a time, with arrived / no-show / cancel. */
export default function BusinessBookings() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { token, business } = useOwner();
  const [today] = useState(() => startOfDay(new Date()));
  const [now, setNow] = useState(() => Date.now());
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(today, i)), [today]);
  const [selected, setSelected] = useState(0);
  const [items, setItems] = useState<BusinessBooking[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setItems(await businessApi.bookings(token, { from: dayKey(today), to: dayKey(addDays(today, DAYS - 1)) }));
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
      setItems((prev) => prev ?? []);
    }
  }, [token, today, i18n]);

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      void load();
    }, [load]),
  );

  const act = async (fn: (token: string) => Promise<BusinessBooking>, done?: string) => {
    if (!token) return;
    try {
      const updated = await fn(token);
      setItems((list) => list?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
      if (done) toast(done, 'info');
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
    }
  };

  const day = days[selected];
  const list = (items ?? [])
    // Reopened time off is gone, not "cancelled".
    .filter((b) => onDay(b, day) && !(b.kind === 'block' && b.status === 'cancelled'))
    .sort((a, b) => a.start.localeCompare(b.start));
  const countFor = (d: Date) =>
    (items ?? []).filter((b) => b.kind !== 'block' && b.status === 'upcoming' && onDay(b, d)).length;
  const masterName = (id: string) => business?.masters?.find((m) => m.id === id)?.name ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('bkTitle')} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: gutter, gap: 8, paddingBottom: 12 }}
      >
        {days.map((d, i) => {
          const n = countFor(d);
          return (
            <Chip
              key={dayKey(d)}
              size="sm"
              label={`${i18n.relativeDay(d)}${n ? ` · ${n}` : ''}`}
              selected={i === selected}
              onPress={() => setSelected(i)}
            />
          );
        })}
      </ScrollView>
      <ScrollView
        contentContainerStyle={{ padding: gutter, paddingTop: 4, paddingBottom: insets.bottom + 32, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
      >
        <View style={styles.tools}>
          <Button
            label={i18n.t('bkAdd')}
            icon={Plus}
            size="sm"
            onPress={() => router.push({ pathname: '/business/new-booking', params: { day: dayKey(day) } })}
          />
          <Button
            label={i18n.t('bkTimeOff')}
            icon={Coffee}
            size="sm"
            variant="secondary"
            onPress={() => router.push({ pathname: '/business/time-off', params: { day: dayKey(day) } })}
          />
        </View>
        {items === null ? (
          <ActivityIndicator color={c.inkSoft} style={{ marginTop: 48 }} />
        ) : list.length ? (
          list.map((b) =>
            b.kind === 'block' ? (
              <TimeOffCard
                key={b.id}
                block={b}
                masterName={masterName(b.masterId)}
                onReopen={() => void act((t) => businessApi.cancelBooking(t, b.id), i18n.t('bkReopened'))}
              />
            ) : (
              <BookingCard
                key={b.id}
                booking={b}
                serviceNames={(business?.services ?? [])
                  .filter((s) => b.serviceIds.includes(s.id))
                  .map((s) => i18n.tx(s.name))
                  .join(' + ')}
                masterName={masterName(b.masterId)}
                now={now}
                onComplete={() => act((t) => businessApi.completeBooking(t, b.id))}
                onNoShow={() => act((t) => businessApi.markNoShow(t, b.id))}
                onCancel={() => {
                  const go = () => void act((t) => businessApi.cancelBooking(t, b.id), i18n.t('bkCancelled'));
                  if (Platform.OS === 'web') return go();
                  Alert.alert(i18n.t('bkCancelTitle'), i18n.t('bkCancelBody'), [
                    { text: i18n.t('keep'), style: 'cancel' },
                    { text: i18n.t('bkCancel'), style: 'destructive', onPress: go },
                  ]);
                }}
              />
            ),
          )
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={i18n.t('bkEmptyTitle')}
            body={isLive ? i18n.t('bkEmptyBody') : i18n.t('bkDemoBody')}
          />
        )}
      </ScrollView>
    </View>
  );
}

function TimeOffCard({
  block: b,
  masterName,
  onReopen,
}: {
  block: BusinessBooking;
  masterName: string;
  onReopen: () => void;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const start = new Date(b.start);
  const end = new Date(endOf(b));
  const sameDayEnd = end.getTime() - startOfDay(start).getTime() <= 86_400_000;
  const range = sameDayEnd
    ? `${fmtClock(minutesOfDay(start))}–${end.getTime() === addDays(startOfDay(start), 1).getTime() ? '24:00' : fmtClock(minutesOfDay(end))}`
    : `${i18n.relativeDay(start)} ${fmtClock(minutesOfDay(start))} · ${i18n.t('bkUntil', { date: i18n.fullDate(new Date(end.getTime() - 1)) })}`;
  return (
    <View style={[styles.block, { borderColor: c.lineStrong, backgroundColor: c.sunken }]}>
      <View style={styles.head}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Coffee size={16} color={c.inkSoft} strokeWidth={2} />
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {i18n.t('bkTimeOff')}
            {masterName ? ` · ${masterName}` : ''}
          </Text>
        </View>
        <Button label={i18n.t('bkReopen')} size="sm" variant="ghost" onPress={onReopen} />
      </View>
      <Text variant="subhead" tone="soft">
        {range}
        {b.note ? ` · ${b.note}` : ''}
      </Text>
    </View>
  );
}

const STATUS: Record<BusinessBooking['status'], StringKey> = {
  upcoming: 'upcoming',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'noShow',
  pending_payment: 'pendingPayment',
};

function BookingCard({
  booking: b,
  serviceNames,
  masterName,
  onComplete,
  onNoShow,
  onCancel,
  now,
}: {
  booking: BusinessBooking;
  now: number;
  serviceNames: string;
  masterName: string;
  onComplete: () => void;
  onNoShow: () => void;
  onCancel: () => void;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const start = new Date(b.start);
  const startMin = minutesOfDay(start);
  const started = start.getTime() <= now;
  const open = b.status === 'upcoming';
  return (
    <Card>
      <View style={styles.card}>
        <View style={styles.head}>
          <Text variant="title">
            {fmtClock(startMin)}–{fmtClock(startMin + b.durationMin)}
          </Text>
          <Text variant="captionStrong" tone={b.status === 'cancelled' || b.status === 'no_show' ? 'danger' : 'soft'}>
            {i18n.t(STATUS[b.status])}
          </Text>
        </View>
        <Text variant="bodyStrong">
          {b.client.name}
          {b.source === 'salon' ? <Text variant="caption" tone="muted">{`  · ${i18n.t('bkBySalon')}`}</Text> : null}
        </Text>
        <Text variant="subhead" tone="soft">
          {serviceNames}
          {masterName ? ` · ${masterName}` : ''} · {i18n.price(b.total)}
        </Text>
        {b.deposit ? (
          <Text variant="caption" tone="soft">
            {i18n.t('depositLabel')} {i18n.price(b.deposit)} ·{' '}
            {b.depositStatus === 'kept'
              ? i18n.t('depositKept')
              : b.depositStatus === 'applied'
                ? i18n.t('depositApplied')
                : b.depositStatus === 'refunded' || b.depositStatus === 'refund_due'
                  ? i18n.t('depositRefunded')
                  : b.depositStatus === 'paid'
                    ? i18n.t('depositPaid', { price: i18n.price(b.deposit) })
                    : i18n.t('pendingPayment')}
          </Text>
        ) : null}
        {b.note ? (
          <Text variant="subhead" style={{ fontStyle: 'italic' }}>
            “{b.note}”
          </Text>
        ) : null}
        <View style={styles.actions}>
          {b.client.phone ? (
            <PressableScale
              onPress={() => Linking.openURL(`tel:${b.client.phone}`).catch(() => undefined)}
              accessibilityLabel={i18n.t('callClient')}
              hitSlop={8}
              style={[styles.call, { backgroundColor: c.sunken }]}
            >
              <Phone size={16} color={c.ink} strokeWidth={2} />
            </PressableScale>
          ) : null}
          {open && started ? (
            <>
              <Button label={i18n.t('bkComplete')} size="sm" onPress={onComplete} />
              <Button label={i18n.t('bkNoShow')} size="sm" variant="secondary" onPress={onNoShow} />
            </>
          ) : null}
          {open && !started ? (
            <Button label={i18n.t('bkCancel')} size="sm" variant="dangerGhost" onPress={onCancel} />
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  tools: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  block: { borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', padding: 14, gap: 4 },
  card: { paddingVertical: 14, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  call: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
