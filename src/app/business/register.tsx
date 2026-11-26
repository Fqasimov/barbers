import { router, useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { catalogueApi } from '@/api/catalogue';
import { isLive } from '@/api/client';
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
import { beautyCategories } from '@/data/categories';
import { categoryIcon } from '@/data/icons';
import type { CategoryId } from '@/data/types';
import { useI18n } from '@/i18n';
import { SITE_URL } from '@/lib/links';
import { fonts } from '@/theme/tokens';
import { useWide } from '@/theme/wide';
import { usePlanPrices } from '@/lib/billing';
import { plans, plansFor } from '@/auth/plans';
import type { PlanId } from '@/auth/types';
import { PressableScale } from '@/components/ui/PressableScale';
import { cleanSlugInput, isValidSlug, slugify } from '@/lib/slug';
import type { StringKey } from '@/i18n/strings';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Salon owners: the plan first (it decides the rest), then who you are, then the salon.
 * Fərdi is one person: no salon name, their own name is the page. The plan's 30-day trial starts with the sign-up.
 */
export default function BusinessRegister() {
  const { c } = useTheme();
  const i18n = useI18n();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const prices = usePlanPrices();
  const wide = useWide();
  const owner = useForm(
    { firstName: '', lastName: '', phone: '', email: '', password: '' },
    { firstName: checkName, lastName: checkName, phone: checkPhone, email: checkEmail, password: checkPassword },
  );
  // ?plan=couture_plus (from the website's pricing page) starts on that plan, and on its kind of business.
  const params = useLocalSearchParams<{ plan?: string }>();
  const picked = plans.find((p) => p.id === params.plan && plansFor(p.market).includes(p));
  const [plan, setPlan] = useState<PlanId>(picked?.id ?? 'start');
  const salon = useForm(
    { salonName: '', district: '', address: '', audience: 'all' },
    // Fərdi has no salon name: the person's own name is used.
    { salonName: (v) => (plan === 'ferdi' ? null : checkRequired(v)), district: checkRequired, address: checkRequired },
  );
  const [kind, setKind] = useState<'beauty' | 'couture'>(picked?.market ?? 'beauty');
  const [cats, setCats] = useState<CategoryId[]>(picked?.market === 'couture' ? ['couture'] : []);
  const pickKind = (k: 'beauty' | 'couture') => {
    setKind(k);
    setCats(k === 'couture' ? ['couture'] : []);
    setCatsError(false);
    const list = plansFor(k);
    setPlan((list.find((p) => p.recommended) ?? list[0]).id);
  };
  // Fərdi: one person, so their own name is the salon's name and page address.
  const solo = plan === 'ferdi';
  const [catsError, setCatsError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<StringKey | null>(null);
  // The page address: made from the salon name until the owner edits it.
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [remote, setRemote] = useState<{ slug: string; state: 'free' | StringKey } | null>(null);
  const [tried, setTried] = useState(false);
  const o = owner.values;
  const s = salon.values;
  const oe = (k: keyof typeof owner.errors) => (owner.errors[k] ? i18n.t(owner.errors[k]!) : null);
  const se = (k: keyof typeof salon.errors) => (salon.errors[k] ? i18n.t(salon.errors[k]!) : null);

  const setSalonName = (v: string) => {
    salon.set('salonName')(v);
    if (!slugEdited) setSlug(slugify(v));
  };

  // Checked on this device first; free-or-taken comes from the server.
  const local: 'idle' | 'free' | StringKey | null = !slug
    ? 'idle'
    : !isValidSlug(slug)
      ? 'errSlugInvalid'
      : !isLive
        ? 'free'
        : null;
  useEffect(() => {
    if (local !== null) return;
    let gone = false;
    const t = setTimeout(async () => {
      try {
        const r = await catalogueApi.pageAddress(slug);
        if (gone) return;
        const state = r.available
          ? 'free'
          : r.problem === 'taken'
            ? 'errSlugTaken'
            : r.problem === 'reserved'
              ? 'errSlugReserved'
              : 'errSlugInvalid';
        setRemote({ slug, state });
      } catch {
        // Offline: the server checks it again on submit.
      }
    }, 400);
    return () => {
      gone = true;
      clearTimeout(t);
    };
  }, [slug, local]);
  const slugState = local ?? (remote?.slug === slug ? remote.state : 'checking');
  // A half-typed address isn't an error until it is long enough or the form is sent.
  const showInvalid = slugState !== 'errSlugInvalid' || tried || slug.length >= 3;
  const slugError =
    slugState.startsWith('err') && showInvalid
      ? i18n.t(slugState as StringKey)
      : !slug && tried
        ? i18n.t('errSlugInvalid')
        : null;

  const toggleCat = (id: CategoryId) => {
    const next = cats.includes(id) ? cats.filter((x) => x !== id) : [...cats, id];
    setCats(next);
    if (next.length) setCatsError(false);
  };

  const toSalon = () => {
    if (!owner.check()) return;
    if (solo && !slugEdited) setSlug(slugify(`${o.firstName} ${o.lastName}`));
    setStep(3);
  };

  const submit = async () => {
    setFormError(null);
    const ok = salon.check();
    setCatsError(!cats.length);
    setTried(true);
    const slugOk = isValidSlug(slug) && (slugState === 'free' || slugState === 'checking');
    if (!ok || !cats.length || !slugOk) return;
    setBusy(true);
    try {
      const challenge = await authApi.registerBusiness({
        firstName: o.firstName.trim(),
        lastName: o.lastName.trim(),
        phone: toE164(o.phone),
        email: o.email.trim(),
        password: o.password,
        salonName: solo ? `${o.firstName.trim()} ${o.lastName.trim()}` : s.salonName.trim(),
        plan,
        categories: cats,
        district: s.district.trim(),
        address: s.address.trim(),
        audience: s.audience as Audience,
        slug,
      });
      useChallenge.getState().set(challenge);
      router.push('/auth/verify');
    } catch (e) {
      const key = authErrorKey(e);
      if (key === 'errSlugTaken' || key === 'errSlugReserved' || key === 'errSlugInvalid') {
        setRemote({ slug, state: key });
      } else if (key === 'errEmailTaken') {
        owner.setErrors({ ...owner.errors, email: key });
        setStep(2);
      } else setFormError(key);
    } finally {
      setBusy(false);
    }
  };

  // Back goes one step back; from the first step, back to where the visitor came from
  // (the website's pricing page when a plan was picked there).
  const back = () => {
    if (step > 1) {
      setStep(step === 3 ? 2 : 1);
      return;
    }
    if (params.plan && Platform.OS === 'web') {
      globalThis.location?.assign(`${SITE_URL}/pricing/`);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/panel');
  };

  return (
    <AuthLayout
      title={
        step === 1
          ? i18n.t('bizPlanTitle')
          : step === 2
            ? i18n.t('bizTitle')
            : i18n.t(solo ? 'bizSoloTitle' : 'bizSalonTitle')
      }
      subtitle={step === 1 ? i18n.t('bizSub') : undefined}
      stacked={step === 1}
      onBack={back}
      step={i18n.t('stepOfTotal', { n: step, total: 3 })}
      footer={
        step === 1 ? (
          <Button label={i18n.t('continue')} onPress={() => setStep(2)} />
        ) : (
          <View style={styles.footerRow}>
            <Button label={i18n.t('back')} variant="secondary" onPress={back} hitStyle={{ flex: 1 }} />
            {step === 2 ? (
              <Button label={i18n.t('continue')} onPress={toSalon} hitStyle={{ flex: 2 }} />
            ) : (
              <Button label={i18n.t('sendCode')} onPress={submit} loading={busy} hitStyle={{ flex: 2 }} />
            )}
          </View>
        )
      }
    >
      {step === 1 ? (
        <>
          {/* Salon or couture brand first: it decides which plans there are. */}
          <Choice<'beauty' | 'couture'>
            label={i18n.t('fBusinessKind')}
            options={[
              { value: 'beauty', label: i18n.t('kindBeauty') },
              { value: 'couture', label: i18n.t('kindCouture') },
            ]}
            value={kind}
            onChange={pickKind}
          />
          <View style={[styles.grid, wide && styles.gridWide]} accessibilityRole="radiogroup">
            {plansFor(kind).map((p) => {
              const on = plan === p.id;
              return (
                <PressableScale
                  key={p.id}
                  onPress={() => setPlan(p.id)}
                  haptic="selection"
                  scaleTo={0.985}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${p.name}, ${i18n.price(prices[p.id].month)} ${i18n.t('perMonth')}`}
                  hitStyle={wide ? styles.cardWide : undefined}
                  style={[
                    styles.card,
                    { backgroundColor: c.surface, borderColor: on ? c.ink : c.line },
                    on && { borderWidth: 2 },
                  ]}
                >
                  <View style={styles.cardHead}>
                    <Text variant="title" style={{ flex: 1 }}>
                      {p.name}
                    </Text>
                    {p.recommended ? (
                      <View style={[styles.badge, { backgroundColor: c.ink }]}>
                        <Text variant="micro" style={{ color: c.bg }}>
                          {i18n.t('recommended')}
                        </Text>
                      </View>
                    ) : null}
                    <View
                      style={[styles.radio, { borderColor: on ? c.ink : c.lineStrong }, on && { borderWidth: 6 }]}
                    />
                  </View>
                  <Text variant="subhead" tone="soft">
                    {i18n.tx(p.blurb)}
                  </Text>
                  <Text style={styles.price}>
                    {i18n.price(prices[p.id].month)}{' '}
                    <Text variant="subhead" tone="muted">
                      {i18n.t('perMonth')}
                    </Text>
                  </Text>
                  <View style={styles.features}>
                    {p.features.map((f) => (
                      <View key={f.en} style={styles.feature}>
                        <Check size={15} color={c.ink} strokeWidth={2.2} style={{ marginTop: 2 }} />
                        <Text variant="subhead" style={{ flex: 1 }}>
                          {i18n.tx(f)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </PressableScale>
              );
            })}
          </View>
          <Text variant="caption" tone="muted">
            {i18n.t('bizPlanNote')}
          </Text>
        </>
      ) : step === 2 ? (
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
          {solo ? (
            <Text variant="caption" tone="soft">
              {i18n.t('bizSoloNote', { name: `${o.firstName.trim()} ${o.lastName.trim()}` })}
            </Text>
          ) : (
            <FormField
              label={i18n.t('fSalonName')}
              placeholder={i18n.t('phSalonName')}
              value={s.salonName}
              onChangeText={setSalonName}
              error={se('salonName')}
              autoCapitalize="words"
            />
          )}
          <View style={{ gap: 6 }}>
            <FormField
              label={i18n.t('fPageAddress')}
              placeholder={i18n.t('phPageAddress')}
              value={slug}
              onChangeText={(v) => {
                setSlugEdited(true);
                setSlug(cleanSlugInput(v));
              }}
              error={slugError}
              hint={i18n.t('pageAddressHint', {
                sub: `${slug || '…'}.yazilnow.az`,
                link: `link.yazilnow.az/${slug || '…'}`,
              })}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              maxLength={30}
            />
            {slugState === 'free' || slugState === 'checking' ? (
              <Text variant="caption" tone={slugState === 'free' ? 'success' : 'muted'}>
                {i18n.t(slugState === 'free' ? 'pageAddressFree' : 'pageAddressChecking')}
              </Text>
            ) : null}
          </View>
          {kind === 'beauty' ? (
            <View style={{ gap: 8 }}>
              <Text variant="captionStrong" tone="soft">
                {i18n.t('fCategories')}
              </Text>
              <View style={styles.chips}>
                {beautyCategories.map((cat) => (
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
          ) : (
            <Text variant="caption" tone="soft">
              {i18n.t('kindCoutureNote')}
            </Text>
          )}
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
  grid: { gap: 12 },
  gridWide: { flexDirection: 'row', alignItems: 'stretch' },
  cardWide: { flex: 1 },
  card: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 20, gap: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  price: { fontFamily: fonts.semibold, fontSize: 34, letterSpacing: -1, marginTop: 6 },
  features: { gap: 8, marginTop: 10 },
  feature: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  formError: { padding: 12, borderRadius: 10 },
});
