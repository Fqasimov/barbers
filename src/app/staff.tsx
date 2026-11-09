import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { CalendarDays, LogIn, LogOut, UserRound } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Stats } from '@/api/business';
import { staffApi, type StaffCabinet } from '@/api/staff';
import { authErrorKey } from '@/auth/flow';
import { useSession } from '@/auth/useSession';
import { Card } from '@/components/business/kit';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { Loc } from '@/i18n/types';
import { addDays, dayKey, fromDayKey, startOfDay } from '@/lib/time';
import { masterDay, WEEK_ORDER } from '@/lib/week';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, isSite, radius } from '@/theme/tokens';
import { useWide } from '@/theme/wide';

import { StatsBody } from './business/stats';

type Range = 'month' | 30 | 90;

/**
 * A master's own cabinet. They tick when they arrive and when they leave; the
 * owner sees it under Attendance. Also: today's shift, upcoming bookings, the
 * weekly schedule and what they earned.
 */
export default function StaffCabinetScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const wide = useWide();
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);
  const token = session?.token ?? null;
  const [data, setData] = useState<StaffCabinet | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [range, setRange] = useState<Range>('month');
  const [stats, setStats] = useState<Stats | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setData(await staffApi.me(token));
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [token]);

  // First load; later ones (pull to refresh, after a check-in) call `load`.
  useEffect(() => {
    if (!token) return;
    let alive = true;
    staffApi
      .me(token)
      .then((d) => alive && (setData(d), setFailed(false)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [token]);

  // The running shift's clock ticks every half minute.
  useEffect(() => {
    if (!data?.checkedIn) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [data?.checkedIn]);

  useEffect(() => {
    if (!token || range === 'month') return;
    const today = startOfDay(new Date());
    let alive = true;
    staffApi
      .stats(token, { from: dayKey(addDays(today, -(range - 1))), to: dayKey(today) })
      .then((s) => alive && setStats(s))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [token, range]);

  if (!session) return <Redirect href="/auth/sign-in" />;

  const clock = async (kind: 'in' | 'out') => {
    if (!token) return;
    setBusy(true);
    try {
      await (kind === 'in' ? staffApi.checkIn(token) : staffApi.checkOut(token));
      toast(i18n.t(kind === 'in' ? 'staffCheckedIn' : 'staffCheckedOut'));
      setNow(Date.now());
      await load();
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
    } finally {
      setBusy(false);
    }
  };

  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString(i18n.locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  const duration = (min: number) =>
    i18n.t('attHours', { h: Math.floor(min / 60), m: String(min % 60).padStart(2, '0') });
  const name = (n: string | Loc) => (typeof n === 'string' ? n : i18n.tx(n));

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader title={i18n.t('staffCabinet')} />
        {failed ? (
          <View style={{ padding: gutter, gap: 12 }}>
            <Text variant="title">{i18n.t('staffNoCabinet')}</Text>
            <Text variant="body" tone="soft">
              {i18n.t('staffNoCabinetBody')}
            </Text>
            <Button label={i18n.t('retry')} variant="secondary" onPress={() => void load()} />
          </View>
        ) : null}
      </View>
    );
  }

  const today = new Date();
  const shift = masterDay(data.master, today.getDay());
  const open = data.openShift;
  const runningMin = open ? Math.max(0, Math.floor((now - new Date(open.checkInAt).getTime()) / 60_000)) : 0;
  // Checked out already today: say when, rather than "not checked in".
  const lastOut = data.today.reduce<string | null>(
    (t, r) => (r.checkOutAt && (!t || r.checkOutAt > t) ? r.checkOutAt : t),
    null,
  );
  const workedToday = data.today.reduce((sum, r) => sum + (r.minutes ?? 0), 0) + runningMin;
  const todayBookings = data.bookings.filter((b) => dayKey(new Date(b.startAt)) === dayKey(today));
  const laterBookings = data.bookings.filter((b) => dayKey(new Date(b.startAt)) !== dayKey(today));
  const shown = range === 'month' ? data.stats : stats;
  const dateOf = (dow: number) => fromDayKey(`2024-01-${String(7 + dow).padStart(2, '0')}`)!;

  const clockCard = (
    <View style={[styles.clock, { backgroundColor: c.primary }]}>
      <Text variant="overline" style={{ color: c.onPrimary, opacity: 0.7 }}>
        {i18n.fullDate(today)}
      </Text>
      <Text variant="title" style={{ color: c.onPrimary }}>
        {open
          ? i18n.t('staffAtWorkSince', { time: time(open.checkInAt) })
          : lastOut
            ? i18n.t('staffLeftAt', { time: time(lastOut) })
            : i18n.t('staffNotAtWork')}
      </Text>
      <Text variant="body" style={{ color: c.onPrimary, opacity: 0.8 }}>
        {shift ? i18n.t('staffShiftToday', { from: shift.start, to: shift.end }) : i18n.t('staffDayOff')}
        {workedToday ? ` · ${i18n.t('staffWorkedToday', { time: duration(workedToday) })}` : ''}
      </Text>
      {open?.lateMinutes ? (
        <Text variant="caption" style={{ color: c.onPrimary, opacity: 0.8 }}>
          {i18n.t('attLateBy', { n: open.lateMinutes })}
        </Text>
      ) : null}
      <Button
        label={open ? i18n.t('staffCheckOut') : i18n.t('staffCheckIn')}
        icon={open ? LogOut : LogIn}
        variant="onPrimary"
        loading={busy}
        onPress={() => void clock(open ? 'out' : 'in')}
        style={{ marginTop: 6 }}
      />
    </View>
  );

  const bookingsCard = (
    <View style={{ gap: 12 }}>
      <Text variant="headline">{i18n.t('staffTodayBookings')}</Text>
      {todayBookings.length ? (
        <BookingList rows={todayBookings} time={time} />
      ) : (
        <Text variant="subhead" tone="soft">
          {i18n.t('staffNoBookingsToday')}
        </Text>
      )}
      {laterBookings.length ? (
        <>
          <Text variant="headline">{i18n.t('staffNextDays')}</Text>
          <BookingList rows={laterBookings} time={time} withDate />
        </>
      ) : null}
    </View>
  );

  const weekCard = (
    <View style={{ gap: 12 }}>
      <Text variant="headline">{i18n.t('staffMyWeek')}</Text>
      <Card>
        {WEEK_ORDER.map((dow, i) => {
          const s = masterDay(data.master, dow);
          const isToday = dow === today.getDay();
          return (
            <View
              key={dow}
              style={[styles.row, i < 6 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
            >
              <Text variant={isToday ? 'bodyStrong' : 'body'} style={{ flex: 1 }}>
                {i18n.weekdayLong(dateOf(dow))}
              </Text>
              <Text variant={isToday ? 'bodyStrong' : 'body'} tone={s ? undefined : 'muted'} style={styles.tabular}>
                {s ? `${s.start}–${s.end}` : i18n.t('weekDayOff')}
              </Text>
            </View>
          );
        })}
      </Card>
    </View>
  );

  const historyCard = data.recent.length ? (
    <View style={{ gap: 12 }}>
      <Text variant="headline">{i18n.t('staffHistory')}</Text>
      <Card>
        {data.recent.map((r, i) => (
          <View
            key={r.id}
            style={[
              styles.row,
              i < data.recent.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
            ]}
          >
            <Text variant="body" style={{ flex: 1 }}>
              {i18n.shortDate(fromDayKey(r.day)!)}
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="bodyStrong" style={styles.tabular}>
                {time(r.checkInAt)} – {r.checkOutAt ? time(r.checkOutAt) : i18n.t('attNow')}
              </Text>
              <Text variant="caption" tone={r.lateMinutes ? 'danger' : 'soft'}>
                {r.lateMinutes
                  ? i18n.t('attLateBy', { n: r.lateMinutes })
                  : r.minutes !== null
                    ? duration(r.minutes)
                    : ''}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  ) : null;

  const statsCard = (
    <View style={{ gap: 12 }}>
      <Text variant="headline">{i18n.t('staffMyNumbers')}</Text>
      <SegmentedControl<string>
        options={[
          { value: 'month', label: i18n.t('staffThisMonth') },
          { value: '30', label: i18n.t('statsDays', { n: 30 }) },
          { value: '90', label: i18n.t('statsDays', { n: 90 }) },
        ]}
        value={String(range)}
        onChange={(v) => setRange(v === 'month' ? 'month' : (Number(v) as 30 | 90))}
      />
      {shown ? <StatsBody data={shown} name={name} mine /> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('staffCabinet')} />
      <ScrollView
        contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 20 }}
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
        <View style={styles.titleRow}>
          <View style={[styles.avatar, { backgroundColor: c.sunken, borderColor: c.line }]}>
            {data.master.photoUrl ? (
              <Image source={{ uri: data.master.photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <UserRound size={28} color={c.inkMuted} strokeWidth={1.6} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="largeTitle">{data.master.name}</Text>
            <Text variant="subhead" tone="soft">
              {i18n.tx(data.master.role)} · {data.salon.name}
            </Text>
          </View>
          {data.salon.logoUrl ? (
            <Image
              source={{ uri: data.salon.logoUrl }}
              style={[styles.logo, { borderColor: c.line }]}
              contentFit="cover"
              accessibilityLabel={data.salon.name}
            />
          ) : null}
        </View>

        {wide ? (
          <View style={styles.cols}>
            <View style={{ flex: 1, gap: 24 }}>
              {clockCard}
              {bookingsCard}
              {weekCard}
            </View>
            <View style={{ flex: 1.2, gap: 24 }}>
              {statsCard}
              {historyCard}
            </View>
          </View>
        ) : (
          <>
            {clockCard}
            {bookingsCard}
            {weekCard}
            {statsCard}
            {historyCard}
          </>
        )}

        <Button
          label={i18n.t('signOut')}
          icon={LogOut}
          variant="ghost"
          onPress={async () => {
            await signOut();
            useStore.getState().clearAccountData();
            toast(i18n.t('signedOut'), 'info');
            router.replace('/panel');
          }}
        />
      </ScrollView>
    </View>
  );
}

function BookingList({
  rows,
  time,
  withDate = false,
}: {
  rows: StaffCabinet['bookings'];
  time: (iso: string) => string;
  withDate?: boolean;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  return (
    <Card>
      {rows.map((b, i) => (
        <View
          key={b.id}
          style={[
            styles.row,
            i < rows.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
          ]}
        >
          <View style={styles.when}>
            {withDate ? (
              <Text variant="caption" tone="soft">
                {i18n.shortDate(new Date(b.startAt))}
              </Text>
            ) : (
              <CalendarDays size={14} color={c.inkMuted} />
            )}
            <Text variant="bodyStrong" style={styles.tabular}>
              {time(b.startAt)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {b.services.join(', ')}
            </Text>
            <Text variant="caption" tone="soft" numberOfLines={1}>
              {b.client ?? i18n.t('staffClient')} · {i18n.price(b.total)}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 48, height: 48, borderRadius: isSite ? radius.sm : radius.md, borderWidth: 1 },
  clock: { borderRadius: radius.lg, padding: 20, gap: 8 },
  cols: { flexDirection: 'row', alignItems: 'flex-start', gap: 56 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  when: { width: 64, gap: 2 },
  tabular: { fontVariant: ['tabular-nums'] },
});
