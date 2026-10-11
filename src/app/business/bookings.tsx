import { useFocusEffect } from 'expo-router';
import { CalendarDays, Phone } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { addDays, dayKey, fmtClock, minutesOfDay, sameDay, startOfDay } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

const DAYS = 7;

/** The salon's appointments, a day at a time, with arrived / no-show / cancel. */
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
  const list = (items ?? []).filter((b) => sameDay(new Date(b.start), day)).sort((a, b) => a.start.localeCompare(b.start));
  const countFor = (d: Date) => (items ?? []).filter((b) => b.status === 'upcoming' && sameDay(new Date(b.start), d)).length;

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
        {items === null ? (
          <ActivityIndicator color={c.inkSoft} style={{ marginTop: 48 }} />
        ) : list.length ? (
          list.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              serviceNames={(business?.services ?? [])
                .filter((s) => b.serviceIds.includes(s.id))
                .map((s) => i18n.tx(s.name))
                .join(' + ')}
              masterName={business?.masters?.find((m) => m.id === b.masterId)?.name ?? ''}
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
          ))
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

const STATUS: Record<BusinessBooking['status'], StringKey> = {
  upcoming: 'upcoming',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'noShow',
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
        <Text variant="bodyStrong">{b.client.name}</Text>
        <Text variant="subhead" tone="soft">
          {serviceNames}
          {masterName ? ` · ${masterName}` : ''} · {i18n.price(b.total)}
        </Text>
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
          {open && !started ? <Button label={i18n.t('bkCancel')} size="sm" variant="dangerGhost" onPress={onCancel} /> : null}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 14, gap: 4 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  call: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
