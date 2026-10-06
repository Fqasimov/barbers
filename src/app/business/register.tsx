import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi, type Audience } from '@/auth';
import { useChallenge } from '@/auth/challenge';
import { authErrorKey } from '@/auth/flow';
import { useForm } from '@/auth/useForm';
import {
  checkEmail,
  checkName,
  checkPassword,
  checkPhone,
  checkRequired,
  formatPhone,
  toE164,
} from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Choice } from '@/components/auth/Choice';
import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { categories } from '@/data/categories';
import { categoryIcon } from '@/data/icons';
import type { CategoryId } from '@/data/types';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useTheme } from '@/theme/ThemeProvider';

/** Salon owners: who you are, then the salon. A 30-day trial follows email confirmation. */
export default function BusinessRegister() {
  const { c } = useTheme();
  const i18n = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
  const owner = useForm(
    { firstName: '', lastName: '', phone: '', email: '', password: '' },
    { firstName: checkName, lastName: checkName, phone: checkPhone, email: checkEmail, password: checkPassword },
  );
  const salon = useForm(
    { salonName: '', district: '', address: '', audience: 'all' },
    { salonName: checkRequired, district: checkRequired, address: checkRequired },
  );
  const [cats, setCats] = useState<CategoryId[]>([]);
  const [catsError, setCatsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<StringKey | null>(null);
  const o = owner.values;
  const s = salon.values;
  const oe = (k: keyof typeof owner.errors) => (owner.errors[k] ? i18n.t(owner.errors[k]!) : null);
  const se = (k: keyof typeof salon.errors) => (salon.errors[k] ? i18n.t(salon.errors[k]!) : null);

  const toggleCat = (id: CategoryId) => {
    const next = cats.includes(id) ? cats.filter((x) => x !== id) : [...cats, id];
    setCats(next);
    if (next.length) setCatsError(false);
  };

  const next = () => {
    if (owner.check()) setStep(2);
  };

  const submit = async () => {
    setFormError(null);
    const ok = salon.check();
    setCatsError(!cats.length);
    if (!ok || !cats.length) return;
    setBusy(true);
    try {
      const challenge = await authApi.registerBusiness({
        firstName: o.firstName.trim(),
        lastName: o.lastName.trim(),
        phone: toE164(o.phone),
        email: o.email.trim(),
        password: o.password,
        salonName: s.salonName.trim(),
        categories: cats,
        district: s.district.trim(),
        address: s.address.trim(),
        audience: s.audience as Audience,
      });
      useChallenge.getState().set(challenge);
      router.push('/auth/verify');
    } catch (e) {
      const key = authErrorKey(e);
      if (key === 'errEmailTaken') {
        owner.setErrors({ ...owner.errors, email: key });
        setStep(1);
      } else setFormError(key);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={step === 1 ? i18n.t('bizTitle') : i18n.t('bizSalonTitle')}
      subtitle={step === 1 ? i18n.t('bizSub') : undefined}
      step={i18n.t('stepOfTotal', { n: step, total: 2 })}
      footer={
        step === 1 ? (
          <Button label={i18n.t('continue')} onPress={next} />
        ) : (
          <View style={styles.footerRow}>
            <Button label={i18n.t('back')} variant="secondary" onPress={() => setStep(1)} hitStyle={{ flex: 1 }} />
            <Button label={i18n.t('sendCode')} onPress={submit} loading={busy} hitStyle={{ flex: 2 }} />
          </View>
        )
      }
    >
      {step === 1 ? (
        <>
          <Text variant="headline">{i18n.t('bizOwnerTitle')}</Text>
          <View style={styles.pair}>
            <View style={styles.half}>
              <FormField
                label={i18n.t('fFirstName')}
                placeholder={i18n.t('phFirstName')}
                value={o.firstName}
                onChangeText={owner.set('firstName')}
                error={oe('firstName')}
                autoComplete="given-name"
                autoCapitalize="words"
              />
            </View>
            <View style={styles.half}>
              <FormField
                label={i18n.t('fLastName')}
                placeholder={i18n.t('phLastName')}
                value={o.lastName}
                onChangeText={owner.set('lastName')}
                error={oe('lastName')}
                autoComplete="family-name"
                autoCapitalize="words"
              />
            </View>
          </View>
          <FormField
            label={i18n.t('fPhone')}
            placeholder={i18n.t('phPhone')}
            prefix="+994"
            value={formatPhone(o.phone)}
            onChangeText={owner.set('phone')}
            error={oe('phone')}
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={12}
          />
          <FormField
            label={i18n.t('fEmail')}
            placeholder={i18n.t('phEmail')}
            hint={i18n.t('emailHint')}
            value={o.email}
            onChangeText={owner.set('email')}
            error={oe('email')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <FormField
            label={i18n.t('fPassword')}
            placeholder={i18n.t('phPassword')}
            hint={i18n.t('passwordHint')}
            value={o.password}
            onChangeText={owner.set('password')}
            error={oe('password')}
            secure
            autoComplete="new-password"
            textContentType="newPassword"
          />
        </>
      ) : (
        <>
          <FormField
            label={i18n.t('fSalonName')}
            placeholder={i18n.t('phSalonName')}
            value={s.salonName}
            onChangeText={salon.set('salonName')}
            error={se('salonName')}
            autoCapitalize="words"
          />
          <View style={{ gap: 8 }}>
            <Text variant="captionStrong" tone="soft">
              {i18n.t('fCategories')}
            </Text>
            <View style={styles.chips}>
              {categories.map((cat) => (
                <Chip
                  key={cat.id}
                  icon={categoryIcon[cat.id]}
                  label={i18n.tx(cat.label)}
                  selected={cats.includes(cat.id)}
                  onPress={() => toggleCat(cat.id)}
                />
              ))}
            </View>
            {catsError ? (
              <Text variant="caption" tone="danger">
                {i18n.t('errCategories')}
              </Text>
            ) : null}
          </View>
          <Choice<Audience>
            label={i18n.t('fAudience')}
            options={[
              { value: 'all', label: i18n.t('audAll') },
              { value: 'women', label: i18n.t('audWomen') },
              { value: 'men', label: i18n.t('audMen') },
            ]}
            value={s.audience as Audience}
            onChange={salon.set('audience')}
          />
          <FormField
            label={i18n.t('fDistrict')}
            placeholder={i18n.t('phDistrict')}
            value={s.district}
            onChangeText={salon.set('district')}
            error={se('district')}
            autoCapitalize="words"
          />
          <FormField
            label={i18n.t('fAddress')}
            placeholder={i18n.t('phAddress')}
            value={s.address}
            onChangeText={salon.set('address')}
            error={se('address')}
            autoComplete="street-address"
          />
          {formError ? (
            <View style={[styles.formError, { backgroundColor: c.dangerSoft }]}>
              <Text variant="subhead" tone="danger">
                {i18n.t(formError)}
              </Text>
            </View>
          ) : null}
          <Text variant="caption" tone="muted">
            {i18n.t('agreeTerms')}
          </Text>
        </>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  pair: { gap: 18 },
  half: {},
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footerRow: { flexDirection: 'row', gap: 10 },
  formError: { padding: 12, borderRadius: 10 },
});
