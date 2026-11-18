import { router, useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Coffee, Maximize2, Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { businessApi, type BusinessBooking } from '@/api/business';
import type { Business } from '@/auth/types';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { addDays, dayKey, fmtClock, minutesOfDay, startOfDay } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadow } from '@/theme/tokens';

const DAYS = 7;
const HOUR = 52; // px per hour
const GUTTER = 44; // the hours column
const COMPACT = 380; // grid height until expanded

const startMin = (b: BusinessBooking) => minutesOfDay(new Date(b.start));
const endOf = (b: BusinessBooking) =>
  b.end ? new Date(b.end).getTime() : new Date(b.start).getTime() + b.durationMin * 60_000;
const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

/**
 * The dashboard's calendar, like a phone's week view: hours down the left, the next 7 days as
 * columns, each appointment and time off as a block at its time. Arrows move a week back (past
 * visits) or forward. Compact until "expand"; a tap on a block opens the full calendar, a tap on
 * an empty hour writes a booking for that day.
 */
export function DashboardCalendar({ token, business }: { token: string | null; business: Business }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const [today] = useState(() => startOfDay(new Date()));
  const [from, setFrom] = useState(today);
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<{ from: string; list: BusinessBooking[] } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(from, i)), [from]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    const key = dayKey(from);
    if (!token) return setItems({ from: key, list: [] });
    try {
      const list = await businessApi.bookings(token, { from: key, to: dayKey(addDays(from, DAYS - 1)) });
      setItems({ from: key, list });
    } catch {
      setItems({ from: key, list: [] });
    }
  }, [token, from]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const list = (items?.from === dayKey(from) ? items.list : []).filter(
    (b) => !(b.kind === 'block' && b.status === 'cancelled'),
  );

  // Hours shown: the salon's opening hours, widened to fit any booking outside them.
  const opens = (business.hoursWeek?.length === 7 ? business.hoursWeek : [business.hours]).filter(
    (h): h is NonNullable<typeof h> => !!h,
  );
  let first = Math.min(9 * 60, ...opens.map((h) => toMin(h.open)));
  let last = Math.max(18 * 60, ...opens.map((h) => toMin(h.close)));
  for (const b of list) {
    first = Math.min(first, startMin(b));
    last = Math.max(last, startMin(b) + b.durationMin);
  }
  const h0 = Math.max(0, Math.floor(first / 60));
  const h1 = Math.min(24, Math.ceil(last / 60));
  const hours = Array.from({ length: h1 - h0 }, (_, i) => h0 + i);
  const gridH = hours.length * HOUR;
  const y = (min: number) => ((min - h0 * 60) / 60) * HOUR;
  const nowMin = minutesOfDay(new Date(now));

  const masterName = (id: string) => business.masters?.find((m) => m.id === id)?.name ?? '';
  const serviceNames = (b: BusinessBooking) =>
    (business.services ?? [])
      .filter((s) => b.serviceIds.includes(s.id))
      .map((s) => i18n.tx(s.name))
      .join(' + ');
  const label = `${days[0].getDate()} ${i18n.monthShort(days[0])} – ${days[6].getDate()} ${i18n.monthShort(days[6])}`;

  /** A day's bookings, side by side where they overlap (several masters at the same time). */
  const laidOut = (day: Date) => {
    const dayStart = day.getTime();
    const placed = list
      .filter((b) => new Date(b.start).getTime() < addDays(day, 1).getTime() && endOf(b) > dayStart)
      .sort((a, b) => a.start.localeCompare(b.start))
      .reduce<{ b: BusinessBooking; s: number; e: number; lane: number }[]>((acc, b) => {
        const s = new Date(b.start).getTime() < dayStart ? 0 : startMin(b);
        const e = Math.min(24 * 60, Math.max(s + 15, Math.round((endOf(b) - dayStart) / 60_000)));
        let lane = 0;
        while (acc.some((o) => o.lane === lane && o.s < e && o.e > s)) lane++;
        acc.push({ b, s, e, lane });
        return acc;
      }, []);
    return placed.map((x) => ({
      ...x,
      lanes: Math.max(...placed.filter((o) => o.s < x.e && o.e > x.s).map((o) => o.lane)) + 1,
    }));
  };

  return (
    <View style={[styles.wrap, { backgroundColor: c.surface }, shadow(c, 1)]}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text variant="title">{i18n.t('calTitle')}</Text>
          <Text variant="caption" tone="soft">
            {label}
          </Text>
        </View>
        <PressableScale
          onPress={() => setFrom(addDays(from, -DAYS))}
          accessibilityLabel={i18n.t('calPrev')}
          style={[styles.nav, { borderColor: c.line }]}
        >
          <ChevronLeft size={18} color={c.ink} />
        </PressableScale>
        <PressableScale onPress={() => setFrom(today)} style={[styles.todayBtn, { borderColor: c.line }]}>
          <Text variant="captionStrong">{i18n.t('calToday')}</Text>
        </PressableScale>
        <PressableScale
          onPress={() => setFrom(addDays(from, DAYS))}
          accessibilityLabel={i18n.t('calNext')}
          style={[styles.nav, { borderColor: c.line }]}
        >
          <ChevronRight size={18} color={c.ink} />
        </PressableScale>
      </View>

      <View style={[styles.row, { paddingLeft: GUTTER }]}>
        {days.map((d) => {
          const isToday = d.getTime() === today.getTime();
          return (
            <View key={dayKey(d)} style={styles.dayHead}>
              <Text variant="micro" tone={isToday ? 'danger' : 'soft'}>
                {i18n.weekdayShort(d)}
              </Text>
              <View style={[styles.dateDot, isToday && { backgroundColor: c.danger }]}>
                <Text variant="bodyStrong" style={{ color: isToday ? '#fff' : c.ink }}>
                  {d.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={{
          maxHeight: expanded ? undefined : COMPACT,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: c.line,
        }}
        contentOffset={{ x: 0, y: expanded ? 0 : Math.max(0, y(Math.min(Math.max(nowMin, h0 * 60), h1 * 60)) - HOUR) }}
        nestedScrollEnabled
      >
        <View style={[styles.row, { height: gridH }]}>
          <View style={{ width: GUTTER }}>
            {hours.map((h) =>
              h === h0 ? null : (
                <Text key={h} variant="micro" tone="muted" style={[styles.hourLabel, { top: (h - h0) * HOUR - 7 }]}>
                  {`${String(h).padStart(2, '0')}:00`}
                </Text>
              ),
            )}
          </View>
          {days.map((d) => {
            const isToday = d.getTime() === today.getTime();
            return (
              <View
                key={dayKey(d)}
                style={[styles.dayCol, { borderLeftWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
              >
                {hours.map((h) => (
                  <PressableScale
                    key={h}
                    scaleTo={1}
                    accessibilityLabel={`${i18n.t('bkAdd')} · ${i18n.fullDate(d)} ${String(h).padStart(2, '0')}:00`}
                    onPress={() => router.push({ pathname: '/business/new-booking', params: { day: dayKey(d) } })}
                    hitStyle={[
                      styles.slot,
                      {
                        top: (h - h0) * HOUR,
                        height: HOUR,
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderColor: c.line,
                      },
                    ]}
                  >
                    <View style={{ height: HOUR - 1 }} />
                  </PressableScale>
                ))}
                {laidOut(d).map(({ b, s, e, lane, lanes }) => {
                  const block = b.kind === 'block';
                  const gone = b.status === 'cancelled' || b.status === 'no_show';
                  const done = b.status === 'completed';
                  const bar = block || gone ? c.lineStrong : done ? c.success : c.accent;
                  const h = Math.max(18, y(e) - y(s) - 2);
                  return (
                    <PressableScale
                      key={b.id}
                      scaleTo={0.98}
                      onPress={() => router.push('/business/bookings')}
                      accessibilityLabel={`${fmtClock(s)} ${block ? i18n.t('bkTimeOff') : b.client.name}`}
                      hitStyle={[
                        styles.event,
                        { top: y(s) + 1, height: h, left: `${(lane / lanes) * 100}%`, width: `${100 / lanes}%` },
                      ]}
                      style={[
                        styles.eventInner,
                        { height: h, backgroundColor: block || gone ? c.sunken : c.bg, borderLeftColor: bar },
                      ]}
                    >
                      <Text variant="micro" numberOfLines={1} style={{ opacity: gone ? 0.55 : 1 }}>
                        {fmtClock(s)}
                      </Text>
                      {h > 30 ? (
                        <Text
                          variant="micro"
                          numberOfLines={h > 60 ? 3 : 1}
                          style={{
                            fontWeight: '600',
                            textDecorationLine: gone ? 'line-through' : 'none',
                            opacity: gone ? 0.55 : 1,
                          }}
                        >
                          {block ? i18n.t('bkTimeOff') : b.client.name}
                          {h > 60 && !block ? `\n${serviceNames(b)}` : ''}
                          {h > 90 ? `\n${masterName(b.masterId)}` : ''}
                        </Text>
                      ) : null}
                    </PressableScale>
                  );
                })}
                {isToday && nowMin >= h0 * 60 && nowMin <= h1 * 60 ? (
                  <View pointerEvents="none" style={[styles.nowLine, { top: y(nowMin), backgroundColor: c.danger }]}>
                    <View style={[styles.nowDot, { backgroundColor: c.danger }]} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <PressableScale onPress={() => setExpanded((v) => !v)} style={styles.more}>
        {expanded ? <ChevronUp size={16} color={c.ink} /> : <ChevronDown size={16} color={c.ink} />}
        <Text variant="captionStrong">{expanded ? i18n.t('calCollapse') : i18n.t('calExpand')}</Text>
      </PressableScale>

      <View style={styles.actions}>
        <Button
          label={i18n.t('bkAdd')}
          icon={Plus}
          size="sm"
          onPress={() => router.push({ pathname: '/business/new-booking', params: { day: dayKey(today) } })}
        />
        <Button
          label={i18n.t('bkTimeOff')}
          icon={Coffee}
          size="sm"
          variant="secondary"
          onPress={() => router.push({ pathname: '/business/time-off', params: { day: dayKey(today) } })}
        />
        <Button
          label={i18n.t('calOpen')}
          icon={Maximize2}
          size="sm"
          variant="ghost"
          onPress={() => router.push('/business/bookings')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.lg, padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nav: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtn: { height: 34, paddingHorizontal: 10, borderRadius: radius.md, borderWidth: 1, justifyContent: 'center' },
  row: { flexDirection: 'row' },
  dayHead: { flex: 1, alignItems: 'center', gap: 2 },
  dateDot: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  hourLabel: { position: 'absolute', right: 6 },
  dayCol: { flex: 1, position: 'relative' },
  slot: { position: 'absolute', left: 0, right: 0 },
  event: { position: 'absolute', paddingHorizontal: 1 },
  eventInner: { borderRadius: 6, borderLeftWidth: 3, paddingHorizontal: 4, paddingVertical: 2, overflow: 'hidden' },
  nowLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  nowDot: { position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: 4 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 2 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
