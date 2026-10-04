import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, CalendarCheck, Clock, MapPin, Users } from 'lucide-react-native';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  FadeOutRight,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SuccessMark } from '@/components/booking/SuccessMark';
import { TimeGrid } from '@/components/booking/TimeGrid';
import { WeekStrip } from '@/components/booking/WeekStrip';
import { goBack, ScreenHeader } from '@/components/ScreenHeader';
import { ServiceRow } from '@/components/ServiceRow';
import { toast } from '@/components/Toaster';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PressableScale } from '@/components/ui/PressableScale';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { anyMasterWeek, eligibleMasters, nextAvailable, weekSchedule } from '@/data/availability';
import { categoryById } from '@/data/categories';
import { slotStillFree } from '@/data/find';
import type { Master, Salon } from '@/data/types';
import { useSalon } from '@/hooks/useSalon';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { firstName } from '@/lib/format';
import { atMinutes, fmtClock, fromDayKey, minutesOfDay, sameDay } from '@/lib/time';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, ease, gutter, iconStroke, radius, shadow } from '@/theme/tokens';

type Step = 'services' | 'master' | 'time' | 'confirm';
const STEPS: Step[] = ['services', 'master', 'time', 'confirm'];
const TITLES: Record<Step, StringKey> = {
  services: 'stepServices',
  master: 'stepMaster',
  time: 'stepTime',
  confirm: 'stepConfirm',
};

// Builders at module scope. Forward slides in from the right, back from the left.
const IN_FWD = FadeInRight.duration(240).easing(ease.out);
const OUT_FWD = FadeOutLeft.duration(180).easing(ease.out);
const IN_BACK = FadeInLeft.duration(240).easing(ease.out);
const OUT_BACK = FadeOutRight.duration(180).easing(ease.out);
const IN_FADE = FadeIn.duration(200);
const OUT_FADE = FadeOut.duration(160);

type Params = { id: string; services?: string; master?: string; date?: string; time?: string };

export default function BookScreen() {
  const params = useLocalSearchParams<Params>();
  const salon = useSalon(params.id);
  if (!salon) return null;
  return <Booking salon={salon} params={params} />;
}

function Booking({ salon, params }: { salon: Salon; params: Params }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const bookings = useStore((s) => s.bookings);
  const addBooking = useStore((s) => s.addBooking);
  const [now] = useState(() => new Date());

  const lockedMaster = salon.masters.find((m) => m.id === params.master);
  const initialServices = (params.services?.split(',') ?? []).filter((id) => salon.services.some((s) => s.id === id));

  // A deep link from search can carry an exact slot; honour it only if it is still free.
  const initial = useMemo(() => {
    const date = params.date ? fromDayKey(params.date) : null;
    const time = params.time ? Number(params.time) : NaN;
    const minutes = salon.services.filter((s) => initialServices.includes(s.id)).reduce((a, s) => a + s.durationMin, 0);
    if (lockedMaster && date && Number.isFinite(time) && minutes) {
      const free = slotStillFree({ salon, master: lockedMaster, date, time, durationMin: minutes, bookings, now });
      if (free) {
        const dayIndex = Math.round((date.getTime() - new Date(now).setHours(0, 0, 0, 0)) / 86_400_000);
        return { step: 'confirm' as Step, dayIndex, slot: time };
      }
      return { step: 'time' as Step, dayIndex: null, slot: null, stale: true };
    }
    return {
      step: (initialServices.length ? (lockedMaster ? 'time' : 'master') : 'services') as Step,
      dayIndex: null,
      slot: null,
    };
    // Computed once for the screen's first render.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [services, setServices] = useState<string[]>(initialServices);
  const [masterId, setMasterId] = useState<string | 'any' | null>(lockedMaster?.id ?? null);
  const [step, setStep] = useState<Step>(initial.step);
  const [dir, setDir] = useState<1 | -1>(1);
  const [dayIndex, setDayIndex] = useState<number | null>(initial.dayIndex);
  const [slot, setSlot] = useState<number | null>(initial.slot);
  const [note, setNote] = useState('');
  const [doneId, setDoneId] = useState<string | null>(null);
  useEffect(() => {
    if ('stale' in initial && initial.stale) toast(i18n.t('slotTaken'), 'info');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const picked = salon.services.filter((s) => services.includes(s.id));
  const minutes = picked.reduce((a, s) => a + s.durationMin, 0);
  const total = picked.reduce((a, s) => a + s.price, 0);
  const eligible = useMemo(() => eligibleMasters(salon, services), [salon, services]);

  const schedule = useMemo(() => {
    if (!minutes || !masterId) return null;
    if (masterId === 'any') return anyMasterWeek({ salon, masters: eligible, durationMin: minutes, bookings, now });
    const master = salon.masters.find((m) => m.id === masterId);
    if (!master) return null;
    const days = weekSchedule({ salon, master, durationMin: minutes, bookings, now });
    return { days, assign: () => master };
  }, [salon, masterId, eligible, minutes, bookings, now]);

  const firstOpenDay = schedule?.days.findIndex((d) => d.slots.length > 0) ?? -1;
  const activeDay = dayIndex ?? (firstOpenDay >= 0 ? firstOpenDay : 0);
  const day = schedule?.days[activeDay];

  const go = (to: Step) => {
    setDir(STEPS.indexOf(to) > STEPS.indexOf(step) ? 1 : -1);
    setStep(to);
  };

  const toggleService = (id: string) =>
    setServices((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const next = () => {
    if (step === 'services') {
      if (masterId && masterId !== 'any' && !eligibleMasters(salon, services).some((m) => m.id === masterId))
        setMasterId(null);
      setSlot(null);
      setDayIndex(null);
      go(lockedMaster && eligible.some((m) => m.id === lockedMaster.id) ? 'time' : 'master');
    } else if (step === 'master') go('time');
    else if (step === 'time') go('confirm');
    else confirm();
  };

  const back = () => {
    if (step === 'services') return goBack();
    if (step === 'time' && lockedMaster && masterId === lockedMaster.id) return go('services');
    go(STEPS[STEPS.indexOf(step) - 1]);
  };

  const confirm = () => {
    if (!schedule || !day || slot === null) return;
    const master = schedule.assign(day.date, slot);
    if (!master) return;
    const booking = addBooking({
      salonId: salon.id,
      masterId: master.id,
      serviceIds: services,
      start: atMinutes(day.date, slot).toISOString(),
      durationMin: minutes,
      total,
      note: note.trim() || undefined,
    });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDoneId(booking.id);
  };

  if (doneId) return <Done bookingId={doneId} salon={salon} />;

  const canContinue =
    (step === 'services' && services.length > 0) ||
    (step === 'master' && !!masterId && (masterId === 'any' ? eligible.length > 0 : true)) ||
    (step === 'time' && slot !== null) ||
    step === 'confirm';

  const entering = reduced ? IN_FADE : dir === 1 ? IN_FWD : IN_BACK;
  const exiting = reduced ? OUT_FADE : dir === 1 ? OUT_FWD : OUT_BACK;
  const stepNo = STEPS.indexOf(step) + 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader
        mode="close"
        inset={Platform.OS !== 'ios'}
        title={salon.name}
        right={
          step !== 'services' ? (
            <PressableScale onPress={back} hitSlop={12} accessibilityLabel={i18n.t('back')} style={styles.backLink}>
              <ArrowLeft size={16} color={c.inkSoft} strokeWidth={iconStroke} />
              <Text variant="callout" tone="soft">
                {i18n.t('back')}
              </Text>
            </PressableScale>
          ) : null
        }
      />

      <View style={styles.progressWrap}>
        <View
          style={styles.progress}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: 4, now: stepNo }}
        >
          {STEPS.map((s, i) => (
            <Animated.View
              key={s}
              style={[
                styles.segment,
                {
                  backgroundColor: i < stepNo ? c.ink : c.lineStrong,
                  transitionProperty: 'backgroundColor',
                  transitionDuration: duration.medium,
                  transitionTimingFunction: cssEase.out,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <Animated.View key={step} entering={entering} exiting={exiting} style={StyleSheet.absoluteFill}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 + insets.bottom }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text variant="caption" tone="muted" style={{ marginTop: 14 }}>
              {i18n.t('stepOf', { n: stepNo })}
            </Text>
            <Text variant="largeTitle" style={{ marginTop: 2, marginBottom: 18 }} accessibilityRole="header">
              {i18n.t(TITLES[step])}
            </Text>

            {step === 'services' ? (
              <ServicesStep salon={salon} selected={services} onToggle={toggleService} locked={lockedMaster} />
            ) : null}

            {step === 'master' ? (
              <MasterStep
                salon={salon}
                eligible={eligible}
                value={masterId}
                minutes={minutes}
                now={now}
                onChange={(m) => {
                  setMasterId(m);
                  setSlot(null);
                  setDayIndex(null);
                }}
              />
            ) : null}

            {step === 'time' && schedule ? (
              <View style={{ gap: 24 }}>
                <WeekStrip
                  days={schedule.days}
                  selected={activeDay}
                  now={now}
                  onSelect={(i) => {
                    setDayIndex(i);
                    setSlot(null);
                  }}
                />
                {day ? (
                  <Animated.View key={activeDay} entering={IN_FADE}>
                    <Text variant="title" style={{ marginBottom: 14 }}>
                      {i18n.fullDate(day.date)}
                    </Text>
                    {day.slots.length ? (
                      <TimeGrid slots={day.slots} selected={slot} onSelect={setSlot} />
                    ) : (
                      <Text tone="soft">{day.off ? i18n.t('dayOff') : i18n.t('dayFull')}</Text>
                    )}
                  </Animated.View>
                ) : null}
              </View>
            ) : null}

            {step === 'confirm' && schedule && day && slot !== null ? (
              <ConfirmStep
                salon={salon}
                master={schedule.assign(day.date, slot)}
                anyMaster={masterId === 'any'}
                date={atMinutes(day.date, slot)}
                minutes={minutes}
                total={total}
                services={picked}
                note={note}
                onNote={setNote}
              />
            ) : null}
          </ScrollView>
        </Animated.View>
      </View>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.surface, borderColor: c.line },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="soft" numberOfLines={1}>
            {picked.length
              ? `${i18n.n(picked.length, 'service')} · ${i18n.duration(minutes)}`
              : i18n.t('nothingSelected')}
            {step === 'time' && slot !== null ? ` · ${fmtClock(slot)}` : ''}
          </Text>
          <Text variant="title">{i18n.price(total)}</Text>
        </View>
        <Button
          label={step === 'confirm' ? i18n.t('confirmBooking') : i18n.t('continue')}
          iconRight={step === 'confirm' ? undefined : ArrowRight}
          icon={step === 'confirm' ? CalendarCheck : undefined}
          disabled={!canContinue}
          haptic={step === 'confirm' ? 'none' : 'light'}
          onPress={next}
        />
      </View>
    </View>
  );
}

function ServicesStep({
  salon,
  selected,
  onToggle,
  locked,
}: {
  salon: Salon;
  selected: string[];
  onToggle: (id: string) => void;
  locked?: Master;
}) {
  const i18n = useI18n();
  const available = locked ? salon.services.filter((s) => locked.serviceIds.includes(s.id)) : salon.services;
  const cats = salon.categories.filter((cat) => available.some((s) => s.category === cat));
  return (
    <View>
      {locked ? (
        <View style={styles.lockedRow}>
          <Avatar name={locked.name} tone={locked.tone} size={32} />
          <Text variant="callout" tone="soft">
            {i18n.t('showingMaster', { name: firstName(locked.name) })}
          </Text>
        </View>
      ) : null}
      {cats.map((cat) => {
        const items = available.filter((s) => s.category === cat);
        return (
          <View key={cat} style={{ marginBottom: 12 }}>
            {cats.length > 1 ? <Text variant="headline">{i18n.tx(categoryById[cat].label)}</Text> : null}
            {items.map((s, i) => (
              <ServiceRow
                key={s.id}
                service={s}
                selected={selected.includes(s.id)}
                onToggle={onToggle}
                last={i === items.length - 1}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function MasterStep({
  salon,
  eligible,
  value,
  minutes,
  now,
  onChange,
}: {
  salon: Salon;
  eligible: Master[];
  value: string | 'any' | null;
  minutes: number;
  now: Date;
  onChange: (id: string | 'any') => void;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const bookings = useStore((s) => s.bookings);
  const nextFor = (m: Master) => nextAvailable({ salon, master: m, durationMin: minutes, bookings, now });
  const soonest = eligible
    .map(nextFor)
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!eligible.length) return <Text tone="soft">{i18n.t('noSingleMaster')}</Text>;

  return (
    <View style={{ gap: 10 }}>
      <Option
        selected={value === 'any'}
        onPress={() => onChange('any')}
        label={i18n.t('anyMasterLabel')}
        left={
          <View style={[styles.anyIcon, { backgroundColor: c.sunken }]}>
            <Users size={22} color={c.ink} strokeWidth={iconStroke} />
          </View>
        }
        title={i18n.t('anyMaster')}
        subtitle={i18n.t('anyMasterSub')}
        right={soonest ? <NextFree date={soonest} /> : null}
      />
      <Text variant="headline" style={{ marginTop: 14, marginBottom: 4 }}>
        {i18n.t('mastersForBooking', { masters: i18n.n(eligible.length, 'master') })}
      </Text>
      {eligible.map((m) => {
        const next = nextFor(m);
        return (
          <Option
            key={m.id}
            selected={value === m.id}
            onPress={() => onChange(m.id)}
            label={`${m.name}, ${i18n.tx(m.role)}`}
            left={<Avatar name={m.name} tone={m.tone} size={48} selected={value === m.id} />}
            title={m.name}
            subtitle={`${i18n.tx(m.role)} · ${i18n.n(m.years, 'year')}`}
            extra={<RatingInline rating={m.rating} count={m.reviewCount} size="sm" />}
            right={
              next ? (
                <NextFree date={next} />
              ) : (
                <Text variant="caption" tone="muted">
                  {i18n.t('fullyBooked')}
                </Text>
              )
            }
          />
        );
      })}
    </View>
  );
}

function NextFree({ date }: { date: Date }) {
  const { c } = useTheme();
  const i18n = useI18n();
  return (
    <View style={{ alignItems: 'flex-end', gap: 1 }}>
      <Text variant="caption" tone="muted">
        {i18n.t('nextFree')}
      </Text>
      <Text variant="captionStrong">{i18n.relativeDay(date)}</Text>
      <Text variant="bodyStrong" style={{ color: c.success }}>
        {fmtClock(minutesOfDay(date))}
      </Text>
    </View>
  );
}

function Option({
  selected,
  onPress,
  label,
  left,
  title,
  subtitle,
  extra,
  right,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  left: ReactNode;
  title: string;
  subtitle: string;
  extra?: ReactNode;
  right?: ReactNode;
}) {
  const { c } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      scaleTo={0.985}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.option,
          {
            backgroundColor: c.surface,
            borderColor: selected ? c.ink : c.line,
            transitionProperty: 'borderColor',
            transitionDuration: duration.small,
          },
        ]}
      >
        {left}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="headline">{title}</Text>
          <Text variant="caption" tone="soft">
            {subtitle}
          </Text>
          {extra ? <View style={{ marginTop: 4 }}>{extra}</View> : null}
        </View>
        {right}
      </Animated.View>
    </PressableScale>
  );
}

function ConfirmStep({
  salon,
  master,
  anyMaster,
  date,
  minutes,
  total,
  services,
  note,
  onNote,
}: {
  salon: Salon;
  master?: Master;
  anyMaster: boolean;
  date: Date;
  minutes: number;
  total: number;
  services: Salon['services'];
  note: string;
  onNote: (s: string) => void;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const start = minutesOfDay(date);
  return (
    <View style={{ gap: 18 }}>
      <View style={[styles.ticket, { backgroundColor: c.surface }, shadow(c, 1)]}>
        <Text variant="caption" tone="muted">
          {i18n.relativeDay(date)}
        </Text>
        <Text variant="title" style={{ marginTop: 2 }}>
          {i18n.fullDate(date)}
        </Text>
        <View style={styles.ticketRow}>
          <Clock size={16} color={c.inkSoft} strokeWidth={iconStroke} />
          <Text variant="bodyStrong">
            {fmtClock(start)} – {fmtClock(start + minutes)}
          </Text>
          <Text variant="caption" tone="soft">
            {i18n.duration(minutes)}
          </Text>
        </View>
        <View style={styles.ticketRow}>
          <MapPin size={16} color={c.inkSoft} strokeWidth={iconStroke} />
          <Text variant="subhead" style={{ flex: 1 }}>
            {salon.name} · {salon.address}
          </Text>
        </View>

        <View style={[styles.rule, { borderColor: c.line }]} />

        {master ? (
          <View style={styles.masterRow}>
            <Avatar name={master.name} tone={master.tone} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{master.name}</Text>
              <Text variant="caption" tone="soft">
                {anyMaster ? `${i18n.t('firstAvailable')} · ` : ''}
                {i18n.tx(master.role)}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 14, gap: 10 }}>
          {services.map((s) => (
            <View key={s.id} style={styles.lineItem}>
              <Text variant="subhead" style={{ flex: 1 }}>
                {i18n.tx(s.name)}
              </Text>
              <Text variant="price">{i18n.price(s.price)}</Text>
            </View>
          ))}
          <View style={[styles.lineItem, styles.totalRow, { borderColor: c.line }]}>
            <Text variant="bodyStrong" style={{ flex: 1 }}>
              {i18n.t('totalAtVenue')}
            </Text>
            <Text variant="title">{i18n.price(total)}</Text>
          </View>
        </View>
      </View>

      <View>
        <Text variant="headline" style={{ marginBottom: 8 }}>
          {i18n.t('noteForMaster')}
        </Text>
        <Field
          value={note}
          onChangeText={onNote}
          placeholder={i18n.t('notePlaceholder')}
          multiline
          multilineHeight={88}
          maxLength={240}
          accessibilityLabel={i18n.t('noteForMaster')}
        />
      </View>

      <Text variant="caption" tone="soft">
        {i18n.t('policy', { salon: salon.name })}
      </Text>
    </View>
  );
}

function Done({ bookingId, salon }: { bookingId: string; salon: Salon }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const booking = useStore((s) => s.bookings.find((b) => b.id === bookingId));
  if (!booking) return null;
  const start = new Date(booking.start);
  const master = salon.masters.find((m) => m.id === booking.masterId);
  const today = new Date();
  const dayLabel = sameDay(start, today) ? i18n.t('today') : i18n.fullDate(start);
  return (
    <Animated.View
      entering={IN_FADE}
      style={[styles.done, { backgroundColor: c.bg, paddingBottom: insets.bottom + 20 }]}
    >
      <View style={{ alignItems: 'center', gap: 16, flex: 1, justifyContent: 'center' }}>
        <SuccessMark />
        <Text variant="largeTitle" align="center">
          {i18n.t('booked')}
        </Text>
        <Text variant="body" tone="soft" align="center" style={{ maxWidth: 310 }}>
          {i18n.t('bookedBody', {
            day: dayLabel,
            time: fmtClock(minutesOfDay(start)),
            master: master ? firstName(master.name) : i18n.t('yourMaster'),
            salon: salon.name,
          })}
        </Text>
      </View>
      <View style={{ gap: 10, alignSelf: 'stretch' }}>
        <Button
          label={i18n.t('viewBookings')}
          onPress={() => {
            router.dismissAll();
            router.navigate('/bookings');
          }}
        />
        <Button label={i18n.t('done')} variant="ghost" onPress={goBack} haptic="none" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 44 },
  progressWrap: { paddingHorizontal: gutter, paddingTop: 2 },
  progress: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 3, borderRadius: 2 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  anyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', margin: 4 },
  ticket: { borderRadius: radius.lg, padding: 18 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  rule: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 16, marginHorizontal: -18 },
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineItem: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 4 },
  done: { flex: 1, padding: gutter, alignItems: 'center' },
});
