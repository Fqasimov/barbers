import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ArrowRight, CalendarCheck, Clock, MapPin, Users } from 'lucide-react-native';
import { useMemo, useState, type ReactNode } from 'react';
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
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { PressableScale } from '@/components/ui/PressableScale';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { anyMasterWeek, eligibleMasters, nextAvailable, weekSchedule } from '@/data/availability';
import { categoryById } from '@/data/categories';
import type { Master, Salon } from '@/data/types';
import { useSalon } from '@/hooks/useSalon';
import { firstName, fmtPrice, plural } from '@/lib/format';
import { atMinutes, fmtClock, fmtDuration, minutesOfDay, monthLong, relativeDay, weekdayLong } from '@/lib/time';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, ease, fonts, gutter, iconStroke, radius } from '@/theme/tokens';

type Step = 'services' | 'master' | 'time' | 'confirm';
const STEPS: Step[] = ['services', 'master', 'time', 'confirm'];
const TITLES: Record<Step, string> = {
  services: 'Choose services',
  master: 'Choose your master',
  time: 'Pick a day & time',
  confirm: 'Review & confirm',
};

// Builders at module scope. Forward slides in from the right, back from the left.
const IN_FWD = FadeInRight.duration(240).easing(ease.out);
const OUT_FWD = FadeOutLeft.duration(180).easing(ease.out);
const IN_BACK = FadeInLeft.duration(240).easing(ease.out);
const OUT_BACK = FadeOutRight.duration(180).easing(ease.out);
const IN_FADE = FadeIn.duration(200);
const OUT_FADE = FadeOut.duration(160);

export default function BookScreen() {
  const params = useLocalSearchParams<{ id: string; services?: string; master?: string }>();
  const salon = useSalon(params.id);
  if (!salon) return null;
  return (
    <Booking
      salon={salon}
      initialServices={params.services?.split(',').filter(Boolean) ?? []}
      initialMaster={params.master}
    />
  );
}

function Booking({
  salon,
  initialServices,
  initialMaster,
}: {
  salon: Salon;
  initialServices: string[];
  initialMaster?: string;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const bookings = useStore((s) => s.bookings);
  const addBooking = useStore((s) => s.addBooking);
  const [now] = useState(() => new Date());

  const lockedMaster = salon.masters.find((m) => m.id === initialMaster);
  const [services, setServices] = useState<string[]>(
    initialServices.filter((id) => salon.services.some((s) => s.id === id)),
  );
  const [masterId, setMasterId] = useState<string | 'any' | null>(lockedMaster?.id ?? null);
  const [step, setStep] = useState<Step>(services.length ? (lockedMaster ? 'time' : 'master') : 'services');
  const [dir, setDir] = useState<1 | -1>(1);
  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [doneId, setDoneId] = useState<string | null>(null);

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
      // A changed menu can invalidate the chosen master and time.
      if (masterId && masterId !== 'any' && !eligibleMasters(salon, services).some((m) => m.id === masterId)) {
        setMasterId(null);
      }
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
        right={
          step !== 'services' ? (
            <PressableScale onPress={back} hitSlop={12} accessibilityLabel="Previous step" style={styles.backLink}>
              <ArrowLeft size={16} color={c.inkSoft} strokeWidth={iconStroke} />
              <Text variant="caption" tone="soft">
                Back
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
                  backgroundColor: i < stepNo ? c.ink : c.line,
                  transitionProperty: 'backgroundColor',
                  transitionDuration: duration.medium,
                  transitionTimingFunction: cssEase.out,
                },
              ]}
            />
          ))}
        </View>
        <Text variant="label" tone="muted" style={{ marginTop: 18 }}>
          Step {stepNo} of 4 · {salon.name}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Animated.View key={step} entering={entering} exiting={exiting} style={StyleSheet.absoluteFill}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 140 + insets.bottom }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text variant="display" style={{ marginTop: 4, marginBottom: 20 }} accessibilityRole="header">
              {TITLES[step]}
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
              <View style={{ gap: 26 }}>
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
                    <Text variant="headline" style={{ marginBottom: 14 }}>
                      {weekdayLong(day.date)}, {day.date.getDate()} {monthLong(day.date)}
                    </Text>
                    {day.slots.length ? (
                      <TimeGrid slots={day.slots} selected={slot} onSelect={setSlot} />
                    ) : (
                      <Text tone="soft">
                        {day.off ? 'Day off — choose another day.' : 'Fully booked — choose another day.'}
                      </Text>
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
          { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.bg, borderColor: c.line },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="soft" numberOfLines={1}>
            {picked.length ? `${plural(picked.length, 'service')} · ${fmtDuration(minutes)}` : 'Nothing selected yet'}
            {step === 'time' && slot !== null ? ` · ${fmtClock(slot)}` : ''}
          </Text>
          <Text variant="price" style={{ fontSize: 22, lineHeight: 26 }}>
            {fmtPrice(total)}
          </Text>
        </View>
        <Button
          label={step === 'confirm' ? 'Confirm booking' : 'Continue'}
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
  const available = locked ? salon.services.filter((s) => locked.serviceIds.includes(s.id)) : salon.services;
  const cats = salon.categories.filter((cat) => available.some((s) => s.category === cat));
  return (
    <View>
      {locked ? (
        <View style={styles.lockedRow}>
          <Avatar name={locked.name} tone={locked.tone} size={32} />
          <Text variant="callout" tone="soft">
            Showing what {firstName(locked.name)} does
          </Text>
        </View>
      ) : null}
      {cats.map((cat) => {
        const items = available.filter((s) => s.category === cat);
        return (
          <View key={cat} style={{ marginBottom: 12 }}>
            {cats.length > 1 ? (
              <Text variant="label" tone="muted">
                {categoryById[cat].label}
              </Text>
            ) : null}
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
  const bookings = useStore((s) => s.bookings);
  const nextFor = (m: Master) => nextAvailable({ salon, master: m, durationMin: minutes, bookings, now });
  const soonest = eligible
    .map(nextFor)
    .filter((d): d is Date => !!d)
    .sort((a, b) => a.getTime() - b.getTime())[0];

  if (!eligible.length) {
    return (
      <Text tone="soft">No single master does all of these together. Try booking them as separate appointments.</Text>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Option
        selected={value === 'any'}
        onPress={() => onChange('any')}
        label="First available master"
        left={
          <View style={[styles.anyIcon, { backgroundColor: c.accentSoft }]}>
            <Users size={22} color={c.accent} strokeWidth={iconStroke} />
          </View>
        }
        title="Any master"
        subtitle="We’ll match you with the best-rated master free at your time."
        right={soonest ? <NextFree date={soonest} /> : null}
      />
      <Text variant="label" tone="muted" style={{ marginTop: 14, marginBottom: 4 }}>
        {plural(eligible.length, 'master')} for this booking
      </Text>
      {eligible.map((m) => {
        const next = nextFor(m);
        return (
          <Option
            key={m.id}
            selected={value === m.id}
            onPress={() => onChange(m.id)}
            label={`${m.name}, ${m.role}`}
            left={<Avatar name={m.name} tone={m.tone} size={48} selected={value === m.id} />}
            title={m.name}
            subtitle={`${m.role} · ${plural(m.years, 'year')}`}
            extra={<RatingInline rating={m.rating} count={m.reviewCount} size="sm" />}
            right={
              next ? (
                <NextFree date={next} />
              ) : (
                <Text variant="caption" tone="muted">
                  Fully booked
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
  return (
    <View style={{ alignItems: 'flex-end', gap: 2 }}>
      <Text variant="label" tone="muted" style={{ fontSize: 9.5 }}>
        Next free
      </Text>
      <Text variant="callout" style={{ fontFamily: fonts.bodyMedium }}>
        {relativeDay(date)}
      </Text>
      <Text variant="mono" tone="accent">
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
            borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
            transitionProperty: 'borderColor',
            transitionDuration: duration.small,
          },
        ]}
      >
        {left}
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="serif" style={{ fontSize: 18 }}>
            {title}
          </Text>
          <Text variant="caption" tone="soft">
            {subtitle}
          </Text>
          {extra ? <View style={{ marginTop: 6 }}>{extra}</View> : null}
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
  const start = minutesOfDay(date);
  return (
    <View style={{ gap: 18 }}>
      <View style={[styles.ticket, { backgroundColor: c.surface, borderColor: c.line }]}>
        <Text variant="label" tone="muted">
          {relativeDay(date)}
        </Text>
        <Text variant="title" style={{ marginTop: 6 }}>
          {weekdayLong(date)}, {date.getDate()} {monthLong(date)}
        </Text>
        <View style={styles.ticketRow}>
          <Clock size={16} color={c.inkSoft} strokeWidth={iconStroke} />
          <Text variant="bodyMedium">
            {fmtClock(start)} – {fmtClock(start + minutes)}
          </Text>
          <Text variant="caption" tone="soft">
            {fmtDuration(minutes)}
          </Text>
        </View>
        <View style={styles.ticketRow}>
          <MapPin size={16} color={c.inkSoft} strokeWidth={iconStroke} />
          <Text variant="callout" style={{ flex: 1 }}>
            {salon.name} · {salon.address}
          </Text>
        </View>

        <View style={[styles.perforation, { borderColor: c.lineStrong }]} />

        {master ? (
          <View style={styles.masterRow}>
            <Avatar name={master.name} tone={master.tone} size={40} />
            <View style={{ flex: 1 }}>
              <Text variant="serif">{master.name}</Text>
              <Text variant="caption" tone="soft">
                {anyMaster ? 'First available · ' : ''}
                {master.role}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ marginTop: 14, gap: 10 }}>
          {services.map((s) => (
            <View key={s.id} style={styles.lineItem}>
              <Text variant="callout" style={{ flex: 1 }}>
                {s.name}
              </Text>
              <Text variant="price" style={{ fontSize: 15 }}>
                {fmtPrice(s.price)}
              </Text>
            </View>
          ))}
          <View style={[styles.lineItem, styles.totalRow, { borderColor: c.line }]}>
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              Total, paid at the venue
            </Text>
            <Text variant="price" style={{ fontSize: 22, lineHeight: 26 }}>
              {fmtPrice(total)}
            </Text>
          </View>
        </View>
      </View>

      <View>
        <Text variant="label" tone="muted" style={{ marginBottom: 8 }} nativeID="note-label">
          Note for your master
        </Text>
        <Field
          value={note}
          onChangeText={onNote}
          placeholder="Optional — e.g. a reference photo, sensitive skin…"
          multiline
          multilineHeight={88}
          maxLength={240}
          accessibilityLabel="Note for your master"
        />
      </View>

      <Text variant="caption" tone="soft">
        Free cancellation up to 2 hours before. You’ll pay at {salon.name} — no card needed to book.
      </Text>
    </View>
  );
}

function Done({ bookingId, salon }: { bookingId: string; salon: Salon }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const booking = useStore((s) => s.bookings.find((b) => b.id === bookingId));
  if (!booking) return null;
  const start = new Date(booking.start);
  const master = salon.masters.find((m) => m.id === booking.masterId);
  return (
    <Animated.View
      entering={IN_FADE}
      style={[styles.done, { backgroundColor: c.bg, paddingBottom: insets.bottom + 20 }]}
    >
      <View style={{ alignItems: 'center', gap: 18, flex: 1, justifyContent: 'center' }}>
        <SuccessMark />
        <Text variant="hero" align="center">
          You’re{' '}
          <Text variant="hero" italic tone="accent">
            booked.
          </Text>
        </Text>
        <Text variant="body" tone="soft" align="center" style={{ maxWidth: 300 }}>
          {relativeDay(start)} at {fmtClock(minutesOfDay(start))} with {master ? firstName(master.name) : 'your master'}{' '}
          at {salon.name}. We’ve saved it to your bookings.
        </Text>
      </View>
      <View style={{ gap: 10, alignSelf: 'stretch' }}>
        <Button
          label="View my bookings"
          onPress={() => {
            router.dismissAll();
            router.navigate('/bookings');
          }}
        />
        <Button label="Done" variant="ghost" onPress={goBack} haptic="none" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 44 },
  progressWrap: { paddingHorizontal: gutter, paddingTop: 4, paddingBottom: 6 },
  progress: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 2, borderRadius: 1 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.lg },
  anyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', margin: 4 },
  ticket: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: 20 },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  perforation: { borderTopWidth: 1, borderStyle: 'dashed', marginVertical: 18, marginHorizontal: -20 },
  masterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineItem: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 4 },
  done: { flex: 1, padding: gutter, alignItems: 'center' },
});
