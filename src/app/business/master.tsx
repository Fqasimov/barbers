import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { businessApi } from '@/api/business';
import { checkName, checkRequired } from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { locFrom, useOwner } from '@/components/business/kit';
import { PhotoField } from '@/components/business/PhotoField';
import { checkWeek, WeekEditor, type WeekErrors, type WeekSpans } from '@/components/business/WeekEditor';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import type { Language } from '@/data/types';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { masterWeek, salonDay } from '@/lib/week';
import { UserRound } from 'lucide-react-native';

const LANGS: { id: Language; label: string }[] = [
  { id: 'az', label: 'Azərbaycanca' },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'tr', label: 'Türkçe' },
];

type Errors = Partial<Record<'name' | 'role' | 'years' | 'services' | 'days', StringKey>>;

/** Add or edit a master. No limit on the team size, and no charge per master. */
export default function MasterForm() {
  const i18n = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { business, busy, run } = useOwner();
  const existing = business?.masters?.find((m) => m.id === id);
  const services = business?.services ?? [];
  const hours = business?.hours ?? { open: '10:00', close: '20:00' };
  const salon = business ?? {};

  const [name, setName] = useState(existing?.name ?? '');
  const [role, setRole] = useState(existing ? i18n.tx(existing.role) : '');
  const [years, setYears] = useState(existing ? String(existing.years) : '');
  const [serviceIds, setServiceIds] = useState<string[]>(existing?.serviceIds ?? services.map((s) => s.id));
  // A new master works whenever the salon is open; an existing one keeps their week.
  const [week, setWeek] = useState<WeekSpans>(() =>
    existing
      ? masterWeek(existing).map((d) => (d ? { from: d.start, to: d.end } : null))
      : [0, 1, 2, 3, 4, 5, 6].map((d) => {
          const h = salonDay(salon, d);
          return h ? { from: h.open, to: h.close } : null;
        }),
  );
  const [weekErrors, setWeekErrors] = useState<WeekErrors>({});
  // A new master's photo waits until they're saved (it needs their id).
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>(existing?.languages ?? ['az', 'ru']);
  const [errors, setErrors] = useState<Errors>({});

  const save = async () => {
    const y = Number(years || '0');
    const e: Errors = {
      name: checkName(name) ?? undefined,
      role: checkRequired(role) ?? undefined,
      years: Number.isInteger(y) && y >= 0 && y <= 70 ? undefined : 'errYears',
      services: serviceIds.length ? undefined : 'errPickServices',
      days: week.some(Boolean) ? undefined : 'errPickDays',
    };
    const we = checkWeek(week);
    setErrors(e);
    setWeekErrors(we);
    if (Object.values(e).some(Boolean) || Object.keys(we).length) return;
    const on = week.flatMap((d, i) => (d ? [i] : []));
    const first = week[on[0]]!;
    const input = {
      name: name.trim(),
      role: locFrom(role, existing?.role),
      years: y,
      serviceIds,
      workDays: on,
      shift: { start: first.from, end: first.to },
      schedule: week.map((d) => (d ? { start: d.from, end: d.to } : null)),
      languages: languages.length ? languages : (['az'] as Language[]),
    };
    const ok = await run(async (token) => {
      const saved = existing
        ? await businessApi.updateMaster(token, existing.id, input)
        : await businessApi.addMaster(token, input);
      if (!existing && pendingPhoto) await businessApi.uploadMasterPhoto(token, saved.id, pendingPhoto);
      return saved;
    }, i18n.t('savedToast'));
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
      <PhotoField
        label={i18n.t('fMasterPhoto')}
        hint={i18n.t('masterPhotoHint')}
        url={existing ? existing.photoUrl : pendingPhoto}
        placeholderIcon={UserRound}
        round
        onPick={async (uri) => {
          if (!existing) return setPendingPhoto(uri);
          await run((token) => businessApi.uploadMasterPhoto(token, existing.id, uri), i18n.t('savedToast'));
        }}
        onRemove={async () => {
          if (!existing) return setPendingPhoto(null);
          await run((token) => businessApi.deleteMasterPhoto(token, existing.id));
        }}
      />
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

      <View style={{ gap: 4 }}>
        <Text variant="captionStrong" tone="soft">
          {i18n.t('fWeeklySchedule')}
        </Text>
        <Text variant="caption" tone="muted">
          {i18n.t('weeklyScheduleHint')}
        </Text>
        {err('days') ? (
          <Text variant="caption" tone="danger">
            {err('days')}
          </Text>
        ) : null}
        <WeekEditor
          value={week}
          onChange={setWeek}
          errors={weekErrors}
          fromLabel={i18n.t('fShiftStart')}
          toLabel={i18n.t('fShiftEnd')}
          onLabel={i18n.t('dayWorks')}
          offLabel={i18n.t('weekDayOff')}
          fallback={{ from: hours.open, to: hours.close }}
        />
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
