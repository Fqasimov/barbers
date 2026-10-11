import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { businessApi } from '@/api/business';
import { checkName, checkRequired } from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { DayPicker, isClock, locFrom, TimeField, useOwner } from '@/components/business/kit';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import type { Language } from '@/data/types';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { toMinutes } from '@/lib/time';

const LANGS: { id: Language; label: string }[] = [
  { id: 'az', label: 'Azərbaycanca' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'tr', label: 'Türkçe' },
];

type Errors = Partial<Record<'name' | 'role' | 'years' | 'services' | 'days' | 'start' | 'end', StringKey>>;

/** Add or edit a master. No limit on the team size, and no charge per master. */
export default function MasterForm() {
  const i18n = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { business, busy, run } = useOwner();
  const existing = business?.masters?.find((m) => m.id === id);
  const services = business?.services ?? [];
  const hours = business?.hours ?? { open: '10:00', close: '20:00' };

  const [name, setName] = useState(existing?.name ?? '');
  const [role, setRole] = useState(existing ? i18n.tx(existing.role) : '');
  const [years, setYears] = useState(existing ? String(existing.years) : '');
  const [serviceIds, setServiceIds] = useState<string[]>(existing?.serviceIds ?? services.map((s) => s.id));
  const [workDays, setWorkDays] = useState<number[]>(existing?.workDays ?? [1, 2, 3, 4, 5, 6]);
  const [start, setStart] = useState(existing?.shift.start ?? hours.open);
  const [end, setEnd] = useState(existing?.shift.end ?? hours.close);
  const [languages, setLanguages] = useState<Language[]>(existing?.languages ?? ['az', 'ru']);
  const [errors, setErrors] = useState<Errors>({});

  const save = async () => {
    const y = Number(years || '0');
    const e: Errors = {
      name: checkName(name) ?? undefined,
      role: checkRequired(role) ?? undefined,
      years: Number.isInteger(y) && y >= 0 && y <= 70 ? undefined : 'errYears',
      services: serviceIds.length ? undefined : 'errPickServices',
      days: workDays.length ? undefined : 'errPickDays',
      start: isClock(start) ? undefined : 'errClock',
      end: !isClock(end) ? 'errClock' : isClock(start) && toMinutes(end) <= toMinutes(start) ? 'errCloseAfterOpen' : undefined,
    };
    setErrors(e);
    if (Object.values(e).some(Boolean)) return;
    const input = {
      name: name.trim(),
      role: locFrom(role, existing?.role),
      years: y,
      serviceIds,
      workDays,
      shift: { start, end },
      languages: languages.length ? languages : (['az'] as Language[]),
    };
    const ok = await run(
      (token) => (existing ? businessApi.updateMaster(token, existing.id, input) : businessApi.addMaster(token, input)),
      i18n.t('savedToast'),
    );
    if (ok !== undefined) router.back();
  };

  const remove = () => {
    if (!existing) return;
    const go = async () => {
      const ok = await run((token) => businessApi.deleteMaster(token, existing.id).then(() => true));
      if (ok) router.back();
    };
    if (Platform.OS === 'web') return void go();
    Alert.alert(i18n.t('mstDeleteTitle'), existing.name, [
      { text: i18n.t('keep'), style: 'cancel' },
      { text: i18n.t('delete'), style: 'destructive', onPress: () => void go() },
    ]);
  };

  const err = (k: keyof Errors) => (errors[k] ? i18n.t(errors[k]!) : null);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <AuthLayout
      title={existing ? i18n.t('mstEdit') : i18n.t('mstNew')}
      subtitle={existing ? undefined : i18n.t('mstEmptyBody')}
      footer={
        <>
          <Button label={i18n.t('save')} onPress={save} loading={busy} />
          {existing ? <Button label={i18n.t('delete')} variant="dangerGhost" size="md" onPress={remove} /> : null}
        </>
      }
    >
      <FormField
        label={i18n.t('fMasterName')}
        placeholder={i18n.t('phMasterName')}
        value={name}
        onChangeText={setName}
        error={err('name')}
        autoCapitalize="words"
        maxLength={40}
      />
      <View style={styles.pair}>
        <View style={{ flex: 2 }}>
          <FormField
            label={i18n.t('fMasterRole')}
            placeholder={i18n.t('phMasterRole')}
            value={role}
            onChangeText={setRole}
            error={err('role')}
            autoCapitalize="sentences"
            maxLength={40}
          />
        </View>
        <View style={{ flex: 1 }}>
          <FormField
            label={i18n.t('fYears')}
            placeholder={i18n.t('phYears')}
            value={years}
            onChangeText={(v) => setYears(v.replace(/\D/g, ''))}
            keyboardType="number-pad"
            maxLength={2}
            error={err('years')}
          />
        </View>
      </View>

      <Section label={i18n.t('fMasterServices')} error={err('services')}>
        {services.length ? (
          services.map((s) => (
            <Chip
              key={s.id}
              size="sm"
              label={i18n.tx(s.name)}
              selected={serviceIds.includes(s.id)}
              onPress={() => setServiceIds(toggle(serviceIds, s.id))}
            />
          ))
        ) : (
          <Text variant="subhead" tone="soft">
            {i18n.t('addServicesFirst')}
          </Text>
        )}
      </Section>

      <Section label={i18n.t('fWorkDays')} error={err('days')}>
        <DayPicker value={workDays} onChange={setWorkDays} />
      </Section>

      <View style={styles.pair}>
        <View style={{ flex: 1 }}>
          <TimeField label={i18n.t('fShiftStart')} value={start} onChange={setStart} error={err('start')} />
        </View>
        <View style={{ flex: 1 }}>
          <TimeField label={i18n.t('fShiftEnd')} value={end} onChange={setEnd} error={err('end')} />
        </View>
      </View>

      <Section label={i18n.t('fLanguages')}>
        {LANGS.map((l) => (
          <Chip
            key={l.id}
            size="sm"
            label={l.label}
            selected={languages.includes(l.id)}
            onPress={() => setLanguages(toggle(languages, l.id))}
          />
        ))}
      </Section>
    </AuthLayout>
  );
}

function Section({ label, error, children }: { label: string; error?: string | null; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text variant="captionStrong" tone="soft">
        {label}
      </Text>
      <View style={styles.chips}>{children}</View>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pair: { flexDirection: 'row', gap: 12 },
});
