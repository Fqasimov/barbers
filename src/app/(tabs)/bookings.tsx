import { router, useFocusEffect } from 'expo-router';
import { Navigation, Star, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { useTabBarInset } from '@/components/TabBar';
import { toast } from '@/components/Toaster';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { salonById } from '@/data/salons';
import type { Booking } from '@/data/types';
import { openDirections } from '@/lib/actions';
import { fmtPrice } from '@/lib/format';
import { fmtClock, fmtDuration, minutesOfDay, monthShort, relativeDay, weekdayShort } from '@/lib/time';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, radius } from '@/theme/tokens';

type Tab = 'upcoming' | 'past';
const REFLOW = LinearTransition.duration(220);
const LEAVE = FadeOut.duration(160);

export default function BookingsScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const bookings = useStore((s) => s.bookings);
  const [tab, setTab] = useState<Tab>('upcoming');
  // Re-read the clock whenever the tab comes into view, so finished visits move to Past.
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => setNow(Date.now()), []));

  const { upcoming, past } = useMemo(() => {
    const end = (b: Booking) => new Date(b.start).getTime() + b.durationMin * 60_000;
    return {
      upcoming: bookings
        .filter((b) => b.status === 'upcoming' && end(b) > now)
        .sort((a, b) => a.start.localeCompare(b.start)),
      past: bookings
        .filter((b) => b.status === 'cancelled' || end(b) <= now)
        .sort((a, b) => b.start.localeCompare(a.start)),
    };
  }, [bookings, now]);

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom, paddingHorizontal: gutter }}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="label" tone="muted">
        Your diary
      </Text>
      <Text variant="display" style={{ marginTop: 8 }} accessibilityRole="header">
        Bookings
      </Text>
      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: `Upcoming${upcoming.length ? ` · ${upcoming.length}` : ''}` },
          { value: 'past', label: 'Past' },
        ]}
        style={{ marginTop: 20, marginBottom: 8 }}
      />

      {list.length === 0 ? (
        tab === 'upcoming' ? (
          <EmptyState
            title="Nothing booked yet"
            body="Find a master you trust and pick a time — it takes under a minute."
            action={{ label: 'Discover places', onPress: () => router.navigate('/') }}
          />
        ) : (
          <EmptyState title="No history yet" body="Visits you’ve had will appear here, ready to review or rebook." />
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
  const cancelBooking = useStore((s) => s.cancelBooking);
  const salon = salonById(booking.salonId);
  if (!salon) return null;
  const start = new Date(booking.start);
  const startMin = minutesOfDay(start);
  const master = salon.masters.find((m) => m.id === booking.masterId);
  const services = salon.services.filter((s) => booking.serviceIds.includes(s.id));
  const cancelled = booking.status === 'cancelled';

  const cancel = () => {
    const run = () => {
      cancelBooking(booking.id);
      toast('Booking cancelled. The slot is free again.', 'info');
    };
    if (Platform.OS === 'web') {
      run();
      return;
    }
    Alert.alert('Cancel this booking?', `${relativeDay(start)} at ${fmtClock(startMin)}, ${salon.name}.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: run },
    ]);
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line, opacity: cancelled ? 0.6 : 1 }]}>
      <PressableScale
        onPress={() => router.push({ pathname: '/salon/[id]', params: { id: salon.id } })}
        scaleTo={0.99}
        accessibilityLabel={`${salon.name}, ${relativeDay(start)} at ${fmtClock(startMin)}`}
        style={styles.top}
      >
        <View style={[styles.date, { backgroundColor: past ? c.sunken : c.primary }]}>
          <Text variant="label" style={{ color: past ? c.inkSoft : c.onPrimary, opacity: 0.8, fontSize: 10 }}>
            {weekdayShort(start)}
          </Text>
          <Text
            style={{ fontFamily: fonts.displayLight, fontSize: 30, lineHeight: 34, color: past ? c.ink : c.onPrimary }}
          >
            {start.getDate()}
          </Text>
          <Text variant="label" style={{ color: past ? c.inkSoft : c.onPrimary, opacity: 0.8, fontSize: 10 }}>
            {monthShort(start)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" tone={cancelled ? 'danger' : past ? 'muted' : 'accent'}>
            {cancelled ? 'Cancelled' : past ? 'Completed' : relativeDay(start)}
          </Text>
          <Text variant="headline" numberOfLines={1}>
            {salon.name}
          </Text>
          <Text variant="callout" tone="soft" numberOfLines={1}>
            {fmtClock(startMin)} – {fmtClock(startMin + booking.durationMin)} · {fmtDuration(booking.durationMin)}
          </Text>
        </View>
      </PressableScale>

      <View style={[styles.details, { borderColor: c.line }]}>
        {master ? (
          <View style={styles.masterRow}>
            <Avatar name={master.name} tone={master.tone} size={28} />
            <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
              {services.map((s) => s.name).join(' + ')} · {master.name.split(' ')[0]}
            </Text>
            <Text variant="price" style={{ fontSize: 15 }}>
              {fmtPrice(booking.total)}
            </Text>
          </View>
        ) : null}
        {booking.note ? (
          <Text variant="caption" tone="soft" italic style={{ marginTop: 8 }}>
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
                  Thanks for reviewing this visit.
                </Text>
              ) : (
                <Button
                  label="Rate your visit"
                  icon={Star}
                  size="sm"
                  onPress={() =>
                    router.push({ pathname: '/review/[id]', params: { id: salon.id, booking: booking.id } })
                  }
                />
              )}
              <Button
                label="Book again"
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
                label="Directions"
                icon={Navigation}
                size="sm"
                variant="secondary"
                onPress={() => openDirections(salon)}
              />
              <Button label="Cancel" icon={X} size="sm" variant="ghost" onPress={cancel} haptic="medium" />
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  date: { width: 62, height: 78, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  details: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
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
