import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { businessApi } from '@/api/business';
import { checkRequired } from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { DayChips, Field, isClock, TimeField, useOwner } from '@/components/business/kit';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { atMinutes, fmtClock, fromDayKey, startOfDay, toMinutes } from '@/lib/time';

type Errors = Partial<Record<'name' | 'services' | 'master' | 'time', StringKey>>;

/** A phone call or walk-in, written into the salon's calendar so the app can't sell the same time. */
export default function NewBooking() {
  const i18n = useI18n();
  const params = useLocalSearchParams<{ day?: string; master?: string }>();
  const { business, busy, run } = useOwner();
  const services = business?.services ?? [];
  const masters = business?.masters ?? [];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [masterId, setMasterId] = useState<string | null>(
    params.master ?? (masters.length === 1 ? masters[0].id : null),
  );
  const [day, setDay] = useState(() => (params.day && fromDayKey(params.day)) || startOfDay(new Date()));
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const chosen = services.filter((s) => serviceIds.includes(s.id));
  const duration = chosen.reduce((n, s) => n + s.durationMin, 0);
  const total = chosen.reduce((n, s) => n + s.price, 0);
  const master = masters.find((m) => m.id === masterId);
  const able = masters.filter((m) => serviceIds.every((id) => m.serviceIds.includes(id)));

  if (!services.length || !masters.length) {
    return (
      <AuthLayout title={i18n.t('nbTitle')} subtitle={i18n.t('nbNeedSetup')}>
        <Button
          label={i18n.t('setupServices')}
          variant="secondary"
          onPress={() => router.replace('/business/services')}
        />
        <Button
          label={i18n.t('setupMasters')}
          variant="secondary"
          onPress={() => router.replace('/business/masters')}
        />
      </AuthLayout>
    );
  }

  const save = async () => {
    const minutes = isClock(time) ? toMinutes(time) : NaN;
    const start = Number.isFinite(minutes) ? atMinutes(day, minutes) : null;
    const e: Errors = {
      name: checkRequired(name) ?? undefined,
      services: serviceIds.length ? undefined : 'errPickService',
      master: !master
        ? 'errPickMaster'
        : serviceIds.some((id) => !master.serviceIds.includes(id))
          ? 'errMasterSkills'
          : undefined,
      time:
        !start || minutes % 5 !== 0
          ? 'errClock5'
          : start.getTime() < Date.now() - 30 * 60_000
            ? 'errPastTime'
            : undefined,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean) || !start || !master) return;
    const ok = await run(
      (token) =>
        businessApi.addBooking(token, {
          masterId: master.id,
          serviceIds,
          start: start.toISOString(),
          clientName: name.trim(),
          clientPhone: phone.trim() || null,
          note: note.trim() || null,
        }),
      i18n.t('nbSaved'),
    );
    if (ok !== undefined) router.back();
  };

  const err = (k: keyof Errors) => (errors[k] ? i18n.t(errors[k]!) : null);
  const ends = isClock(time) && duration ? fmtClock(toMinutes(time) + duration) : null;
  return (
    <AuthLayout
      title={i18n.t('nbTitle')}
      subtitle={i18n.t('nbSub')}
      footer={<Button label={i18n.t('save')} onPress={save} loading={busy} />}
    >
      <FormField
        label={i18n.t('fClientName')}
        placeholder={i18n.t('phClientName')}
        value={name}
        onChangeText={setName}
        error={err('name')}
        autoCapitalize="words"
        maxLength={80}
      />
      <FormField
        label={i18n.t('fClientPhone')}
        placeholder="+994 50 123 45 67"
        value={phone}
        onChangeText={(v) => setPhone(v.replace(/[^\d+\s()-]/g, ''))}
        keyboardType="phone-pad"
        maxLength={20}
      />
      <Field label={i18n.t('fServices')} error={err('services')}>
        <View style={styles.wrap}>
          {services.map((s) => {
            const on = serviceIds.includes(s.id);
            return (
              <Chip
                key={s.id}
                size="sm"
                label={`${i18n.tx(s.name)} · ${i18n.duration(s.durationMin)}`}
                selected={on}
                onPress={() => setServiceIds(on ? serviceIds.filter((x) => x !== s.id) : [...serviceIds, s.id])}
              />
            );
          })}
        </View>
      </Field>
      <Field label={i18n.t('fMaster')} error={err('master')}>
        <View style={styles.wrap}>
          {masters.map((m) => (
            <Chip
              key={m.id}
              size="sm"
              label={m.name}
              selected={m.id === masterId}
              style={!able.includes(m) ? { opacity: 0.4 } : undefined}
              onPress={() => setMasterId(m.id)}
            />
          ))}
        </View>
      </Field>
      <Field label={i18n.t('fDay')}>
        <DayChips value={day} onChange={setDay} count={60} />
      </Field>
      <TimeField label={i18n.t('fStart')} value={time} onChange={setTime} error={err('time')} />
      {ends ? (
        <Text variant="subhead" tone="soft">
          {i18n.t('nbEnds', { time: ends, price: i18n.price(total) })}
        </Text>
      ) : null}
      <FormField
        label={i18n.t('fSalonNote')}
        placeholder={i18n.t('phSalonNote')}
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={300}
        autoCapitalize="sentences"
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
