import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { businessApi } from '@/api/business';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { DayChips, Field, isClock, TimeField, useOwner } from '@/components/business/kit';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Chip } from '@/components/ui/Chip';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { addDays, atMinutes, fromDayKey, startOfDay, toMinutes } from '@/lib/time';

type Mode = 'hours' | 'days';
type Errors = Partial<Record<'from' | 'to' | 'count', StringKey>>;

/** Closes off time so nobody can book it: a break, a day off, a holiday. */
export default function TimeOff() {
  const i18n = useI18n();
  const params = useLocalSearchParams<{ day?: string; master?: string }>();
  const { business, busy, run } = useOwner();
  const masters = business?.masters ?? [];

  const [who, setWho] = useState<string | null>(params.master ?? null);
  const [mode, setMode] = useState<Mode>('hours');
  const [day, setDay] = useState(() => (params.day && fromDayKey(params.day)) || startOfDay(new Date()));
  const [from, setFrom] = useState('13:00');
  const [to, setTo] = useState('14:00');
  const [count, setCount] = useState('1');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  if (!masters.length) {
    return (
      <AuthLayout title={i18n.t('toTitle')} subtitle={i18n.t('nbNeedSetup')}>
        <Button
          label={i18n.t('setupMasters')}
          variant="secondary"
          onPress={() => router.replace('/business/masters')}
        />
      </AuthLayout>
    );
  }

  const save = async () => {
    let start: Date | null = null;
    let end: Date | null = null;
    const e: Errors = {};
    if (mode === 'hours') {
      const a = isClock(from) ? toMinutes(from) : NaN;
      const b = isClock(to) ? toMinutes(to) : NaN;
      if (!Number.isFinite(a) || a % 5) e.from = 'errClock5';
      if (!Number.isFinite(b) || b % 5) e.to = 'errClock5';
      else if (b <= a) e.to = 'errEndBeforeStart';
      if (!e.from && !e.to) {
        start = atMinutes(day, a);
        end = atMinutes(day, b);
        if (end.getTime() < Date.now()) e.to = 'errPastTime';
      }
    } else {
      const n = Number(count);
      if (!Number.isInteger(n) || n < 1 || n > 31) e.count = 'errDayCount';
      else {
        start = startOfDay(day);
        end = startOfDay(addDays(day, n));
      }
    }
    setErrors(e);
    if (Object.values(e).some(Boolean) || !start || !end) return;
    const ok = await run(
      (token) =>
        businessApi.blockTime(token, {
          masterId: who,
          // A block that starts in the past begins now instead.
          start: new Date(Math.max(start.getTime(), Math.floor(Date.now() / 300_000) * 300_000)).toISOString(),
          end: end.toISOString(),
          note: note.trim() || null,
        }),
      i18n.t('toSaved'),
    );
    if (ok !== undefined) router.back();
  };

  const err = (k: keyof Errors) => (errors[k] ? i18n.t(errors[k]!) : null);
  return (
    <AuthLayout
      title={i18n.t('toTitle')}
      subtitle={i18n.t('toSub')}
      footer={<Button label={i18n.t('save')} onPress={save} loading={busy} />}
    >
      <Field label={i18n.t('toWho')}>
        <View style={styles.wrap}>
          <Chip size="sm" label={i18n.t('bkAllMasters')} selected={who === null} onPress={() => setWho(null)} />
          {masters.map((m) => (
            <Chip key={m.id} size="sm" label={m.name} selected={who === m.id} onPress={() => setWho(m.id)} />
          ))}
        </View>
      </Field>
      <SegmentedControl<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'hours', label: i18n.t('toHours') },
          { value: 'days', label: i18n.t('toDays') },
        ]}
      />
      <Field label={mode === 'hours' ? i18n.t('fDay') : i18n.t('toFirstDay')}>
        <DayChips value={day} onChange={setDay} count={90} />
      </Field>
      {mode === 'hours' ? (
        <View style={styles.pair}>
          <View style={{ flex: 1 }}>
            <TimeField label={i18n.t('toFrom')} value={from} onChange={setFrom} error={err('from')} />
          </View>
          <View style={{ flex: 1 }}>
            <TimeField label={i18n.t('toTo')} value={to} onChange={setTo} error={err('to')} />
          </View>
        </View>
      ) : (
        <FormField
          label={i18n.t('toDayCount')}
          placeholder={i18n.t('phDayCount')}
          value={count}
          onChangeText={(v) => setCount(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={2}
          error={err('count')}
        />
      )}
      <FormField
        label={i18n.t('toReason')}
        placeholder={i18n.t('phReason')}
        value={note}
        onChangeText={setNote}
        maxLength={200}
        autoCapitalize="sentences"
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pair: { flexDirection: 'row', gap: 12 },
});
