import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi, type Gender } from '@/auth';
import { useChallenge } from '@/auth/challenge';
import { authErrorKey } from '@/auth/flow';
import { useForm } from '@/auth/useForm';
import {
  checkBirthDate,
  checkEmail,
  checkName,
  checkPassword,
  checkPhone,
  formatDate,
  formatPhone,
  parseDate,
  toE164,
} from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Choice } from '@/components/auth/Choice';
import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export default function Register() {
  const { c } = useTheme();
  const i18n = useI18n();
  const form = useForm(
    { firstName: '', lastName: '', phone: '', birthDate: '', gender: '', email: '', password: '' },
    {
      firstName: checkName,
      lastName: checkName,
      phone: checkPhone,
      birthDate: (v) => checkBirthDate(v),
      gender: (v) => (v ? null : 'errGender'),
      email: checkEmail,
      password: checkPassword,
    },
  );
  const { values: v, errors } = form;
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<StringKey | null>(null);
  const err = (k: keyof typeof errors) => (errors[k] ? i18n.t(errors[k]!) : null);

  const submit = async () => {
    setFormError(null);
    if (!form.check()) return;
    setBusy(true);
    try {
      const challenge = await authApi.register({
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        phone: toE164(v.phone),
        birthDate: parseDate(v.birthDate)!,
        gender: v.gender as Gender,
        email: v.email.trim(),
        password: v.password,
      });
      useChallenge.getState().set(challenge);
      router.push('/auth/verify');
    } catch (e) {
      const key = authErrorKey(e);
      if (key === 'errEmailTaken') form.setErrors({ ...errors, email: key });
      else setFormError(key);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={i18n.t('registerTitle')}
      subtitle={i18n.t('registerSub')}
      footer={
        <>
          <Button label={i18n.t('sendCode')} onPress={submit} loading={busy} />
          <Text variant="caption" tone="muted" align="center">
            {i18n.t('agreeTerms')}
          </Text>
        </>
      }
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
            textContentType="givenName"
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
            textContentType="familyName"
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
        textContentType="telephoneNumber"
        maxLength={12}
      />
      <FormField
        label={i18n.t('fBirthDate')}
        placeholder={i18n.t('phBirthDate')}
        hint={i18n.t('birthDateHint')}
        value={v.birthDate}
        onChangeText={(t) => form.set('birthDate')(formatDate(t))}
        error={err('birthDate')}
        keyboardType="number-pad"
        autoComplete="birthdate-full"
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
      <FormField
        label={i18n.t('fEmail')}
        placeholder={i18n.t('phEmail')}
        hint={i18n.t('emailHint')}
        value={v.email}
        onChangeText={form.set('email')}
        error={err('email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <FormField
        label={i18n.t('fPassword')}
        placeholder={i18n.t('phPassword')}
        hint={i18n.t('passwordHint')}
        value={v.password}
        onChangeText={form.set('password')}
        error={err('password')}
        secure
        autoComplete="new-password"
        textContentType="newPassword"
      />
      {formError ? (
        <View style={[styles.formError, { backgroundColor: c.dangerSoft }]}>
          <Text variant="subhead" tone="danger">
            {i18n.t(formError)}
          </Text>
        </View>
      ) : null}
      <PressableScale onPress={() => router.replace('/auth/sign-in')} style={styles.switch} accessibilityRole="link">
        <Text variant="subhead" tone="soft">
          {i18n.t('haveAccount')}{' '}
          <Text variant="subhead" style={{ fontFamily: fonts.semibold }}>
            {i18n.t('signIn')}
          </Text>
        </Text>
      </PressableScale>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  pair: { gap: 18 },
  half: {},
  formError: { padding: 12, borderRadius: 10 },
  switch: { alignSelf: 'center', paddingVertical: 8 },
});
