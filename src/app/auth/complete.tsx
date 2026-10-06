import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi, type Gender } from '@/auth';
import { authErrorKey, useExitAuthFlow } from '@/auth/flow';
import { useForm } from '@/auth/useForm';
import { useSession } from '@/auth/useSession';
import {
  checkBirthDate,
  checkName,
  checkPhone,
  formatDate,
  formatPhone,
  isoToDisplay,
  parseDate,
  toE164,
} from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Choice } from '@/components/auth/Choice';
import { FormField } from '@/components/auth/FormField';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useStore } from '@/store/useStore';

/**
 * Fills the details a social sign-in (or an account created elsewhere) didn't
 * provide. Also reachable from Profile to edit them.
 */
export default function CompleteProfile() {
  const i18n = useI18n();
  const exit = useExitAuthFlow();
  const session = useSession((s) => s.session);
  const setUser = useSession((s) => s.setUser);
  const user = session?.user;
  const isCustomer = user?.role !== 'business';
  const form = useForm(
    {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
      birthDate: isoToDisplay(user?.birthDate ?? ''),
      gender: user?.gender ?? '',
    },
    {
      firstName: checkName,
      lastName: checkName,
      phone: checkPhone,
      ...(isCustomer
        ? { birthDate: (v: string) => checkBirthDate(v), gender: (v: string) => (v ? null : 'errGender') }
        : {}),
    },
  );
  const { values: v, errors } = form;
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<StringKey | null>(null);
  const err = (k: keyof typeof errors) => (errors[k] ? i18n.t(errors[k]!) : null);

  if (!session || !user) return null;

  const submit = async () => {
    setFormError(null);
    if (!form.check()) return;
    setBusy(true);
    try {
      const updated = await authApi.updateProfile(session.token, {
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        phone: toE164(v.phone),
        ...(isCustomer ? { birthDate: parseDate(v.birthDate)!, gender: v.gender as Gender } : {}),
      });
      setUser(updated);
      useStore.getState().setName(`${updated.firstName} ${updated.lastName[0] ?? ''}.`);
      toast(i18n.t('welcomeUser', { name: updated.firstName }));
      exit(updated.role === 'business' ? '/business' : undefined);
    } catch (e) {
      setFormError(authErrorKey(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={i18n.t('completeTitle')}
      subtitle={i18n.t('completeSub')}
      footer={<Button label={i18n.t('saveProfile')} onPress={submit} loading={busy} />}
    >
      <View style={styles.pair}>
        <View style={styles.half}>
          <FormField
            label={i18n.t('fFirstName')}
            placeholder={i18n.t('phFirstName')}
            value={v.firstName}
            onChangeText={form.set('firstName')}
            error={err('firstName')}
            autoComplete="given-name"
            autoCapitalize="words"
          />
        </View>
        <View style={styles.half}>
          <FormField
            label={i18n.t('fLastName')}
            placeholder={i18n.t('phLastName')}
            value={v.lastName}
            onChangeText={form.set('lastName')}
            error={err('lastName')}
            autoComplete="family-name"
            autoCapitalize="words"
          />
        </View>
      </View>
      <FormField
        label={i18n.t('fPhone')}
        placeholder={i18n.t('phPhone')}
        prefix="+994"
        value={formatPhone(v.phone)}
        onChangeText={form.set('phone')}
        error={err('phone')}
        keyboardType="phone-pad"
        autoComplete="tel"
        maxLength={12}
      />
      {isCustomer ? (
        <>
          <FormField
            label={i18n.t('fBirthDate')}
            placeholder={i18n.t('phBirthDate')}
            hint={i18n.t('birthDateHint')}
            value={v.birthDate}
            onChangeText={(t) => form.set('birthDate')(formatDate(t))}
            error={err('birthDate')}
            keyboardType="number-pad"
            maxLength={10}
          />
          <Choice<Gender>
            label={i18n.t('fGender')}
            options={[
              { value: 'male', label: i18n.t('male') },
              { value: 'female', label: i18n.t('female') },
            ]}
            value={(v.gender || null) as Gender | null}
            onChange={form.set('gender')}
            hint={i18n.t('genderHint')}
            error={err('gender')}
          />
        </>
      ) : null}
      <View>
        <Text variant="captionStrong" tone="soft">
          {i18n.t('fEmail')}
        </Text>
        <Text variant="body" style={{ marginTop: 4 }}>
          {user.email}
        </Text>
      </View>
      {formError ? (
        <Text variant="subhead" tone="danger">
          {i18n.t(formError)}
        </Text>
      ) : null}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  pair: { gap: 18 },
  half: {},
});
