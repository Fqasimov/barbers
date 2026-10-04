import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, MessageCircle, Navigation, Star, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { SalonPhoto } from '@/components/SalonPhoto';
import { useTabBarInset } from '@/components/TabBar';
import { toast } from '@/components/Toaster';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { salonById } from '@/data/salons';
import type { Booking } from '@/data/types';
import { useI18n } from '@/i18n';
import { messageSalon, openDirections } from '@/lib/actions';
import { firstName } from '@/lib/format';
import { fmtClock, minutesOfDay } from '@/lib/time';
import { bookingEnd, useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, radius, shadow } from '@/theme/tokens';

type Tab = 'upcoming' | 'past';
const REFLOW = LinearTransition.duration(220);
const LEAVE = FadeOut.duration(160);

export default function BookingsScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const bookings = useStore((s) => s.bookings);
  const [tab, setTab] = useState<Tab>('upcoming');
  // Re-read the clock whenever the tab comes into view, so finished visits move to Past.
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const { upcoming, past } = useMemo(
    () => ({
      upcoming: bookings
        .filter((b) => b.status === 'upcoming' && bookingEnd(b) > now)
        .sort((a, b) => a.start.localeCompare(b.start)),
      past: bookings
        .filter((b) => b.status === 'cancelled' || bookingEnd(b) <= now)
        .sort((a, b) => b.start.localeCompare(a.start)),
    }),
    [bookings, now],
  );

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: bottom, paddingHorizontal: gutter }}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="largeTitle" accessibilityRole="header">
        {i18n.t('tabBookings')}
      </Text>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: `${i18n.t('upcoming')}${upcoming.length ? ` · ${upcoming.length}` : ''}` },
          { value: 'past', label: i18n.t('past') },
        ]}
        style={{ marginTop: 16, marginBottom: 8 }}
      />

      {list.length === 0 ? (
        tab === 'upcoming' ? (
          <EmptyState
            icon={CalendarDays}
            title={i18n.t('emptyUpcomingTitle')}
            body={i18n.t('emptyUpcomingBody')}
            action={{ label: i18n.t('discoverPlaces'), onPress: () => router.navigate('/') }}
          />
        ) : (
          <EmptyState icon={CalendarDays} title={i18n.t('emptyPastTitle')} body={i18n.t('emptyPastBody')} />
        )
      ) : (
        <View style={{ gap: 14, marginTop: 12 }}>
          {list.map((b) => (
            <Animated.View key={b.id} layout={REFLOW} exiting={LEAVE}>
              <BookingCard booking={b} past={tab === 'past'} />
            </Animated.View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function BookingCard({ booking, past }: { booking: Booking; past: boolean }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const cancelBooking = useStore((s) => s.cancelBooking);
  const salon = salonById(booking.salonId);
  if (!salon) return null;
  const start = new Date(booking.start);
  const startMin = minutesOfDay(start);
  const master = salon.masters.find((m) => m.id === booking.masterId);
  const services = salon.services.filter((s) => booking.serviceIds.includes(s.id));
  const cancelled = booking.status === 'cancelled';
  const serviceNames = services.map((s) => i18n.tx(s.name)).join(' + ');

  const cancel = () => {
    const run = () => {
      cancelBooking(booking.id);
      toast(i18n.t('cancelledToast'), 'info');
    };
    if (Platform.OS === 'web') return run();
    Alert.alert(i18n.t('cancelTitle'), `${i18n.relativeDay(start)}, ${fmtClock(startMin)} · ${salon.name}`, [
      { text: i18n.t('keep'), style: 'cancel' },
      { text: i18n.t('cancelBooking'), style: 'destructive', onPress: run },
    ]);
  };

  const whatsapp = () =>
    messageSalon(
      salon,
      i18n.t('waMessage', { day: i18n.relativeDay(start), time: fmtClock(startMin), services: serviceNames }),
    );

  const status = cancelled ? i18n.t('cancelled') : past ? i18n.t('completed') : i18n.relativeDay(start);

  return (
    <View style={[styles.card, { backgroundColor: c.surface, opacity: cancelled ? 0.6 : 1 }, shadow(c, 1)]}>
      <PressableScale
        onPress={() => router.push({ pathname: '/salon/[id]', params: { id: salon.id } })}
        scaleTo={0.99}
        accessibilityLabel={`${salon.name}, ${status}, ${fmtClock(startMin)}`}
        style={styles.top}
      >
        <View style={[styles.date, { backgroundColor: past ? c.sunken : c.primary }]}>
          <Text variant="micro" style={{ color: past ? c.inkSoft : c.onPrimary }}>
            {i18n.weekdayShort(start)}
          </Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 24, lineHeight: 28, color: past ? c.ink : c.onPrimary }}>
            {start.getDate()}
          </Text>
          <Text variant="micro" style={{ color: past ? c.inkSoft : c.onPrimary }}>
            {i18n.monthShort(start)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="captionStrong" style={{ color: cancelled ? c.danger : past ? c.inkMuted : c.success }}>
            {status}
          </Text>
          <Text variant="headline" numberOfLines={1}>
            {salon.name}
          </Text>
          <Text variant="subhead" tone="soft" numberOfLines={1}>
            {fmtClock(startMin)} – {fmtClock(startMin + booking.durationMin)} · {i18n.duration(booking.durationMin)}
          </Text>
        </View>
        <SalonPhoto salon={salon} width={48} height={48} radius={radius.sm} />
      </PressableScale>

      <View style={[styles.details, { borderColor: c.line }]}>
        {master ? (
          <View style={styles.masterRow}>
            <Avatar name={master.name} tone={master.tone} size={28} />
            <Text variant="subhead" style={{ flex: 1 }} numberOfLines={1}>
              {serviceNames} · {firstName(master.name)}
            </Text>
            <Text variant="price">{i18n.price(booking.total)}</Text>
          </View>
        ) : null}
        {booking.note ? (
          <Text variant="caption" tone="soft" style={{ marginTop: 8 }}>
            “{booking.note}”
          </Text>
        ) : null}
      </View>

      {!cancelled ? (
        <View style={styles.actions}>
          {past ? (
            <>
              {booking.reviewed ? (
                <Text variant="caption" tone="soft" style={{ flex: 1 }}>
                  {i18n.t('thanksReviewed')}
                </Text>
              ) : (
                <Button
                  label={i18n.t('rateVisit')}
                  icon={Star}
                  size="sm"
                  onPress={() =>
                    router.push({ pathname: '/review/[id]', params: { id: salon.id, booking: booking.id } })
                  }
                />
              )}
              <Button
                label={i18n.t('bookAgain')}
                size="sm"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/book/[id]',
                    params: { id: salon.id, services: booking.serviceIds.join(','), master: booking.masterId },
                  })
                }
              />
            </>
          ) : (
            <>
              <Button
                label={i18n.t('whatsapp')}
                icon={MessageCircle}
                size="sm"
                variant="secondary"
                onPress={whatsapp}
              />
              <Button
                label={i18n.t('directions')}
                icon={Navigation}
                size="sm"
                variant="secondary"
                onPress={() => openDirections(salon)}
              />
              <Button label={i18n.t('cancel')} icon={X} size="sm" variant="ghost" onPress={cancel} haptic="medium" />
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  date: { width: 56, height: 68, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  details: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12 },
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
    flexWrap: 'wrap',
  },
});
