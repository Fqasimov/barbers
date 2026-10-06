import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AuthError, authApi } from '@/auth';
import { useChallenge } from '@/auth/challenge';
import { authErrorKey, useFinishSignIn } from '@/auth/flow';
import { checkEmail, checkRequired } from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

export default function SignIn() {
  const { c } = useTheme();
  const i18n = useI18n();
  const { reason } = useLocalSearchParams<{ reason?: StringKey }>();
  const finish = useFinishSignIn();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: StringKey | null; password?: StringKey | null; form?: StringKey }>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next = { email: checkEmail(email), password: checkRequired(password) };
    setErrors(next);
    if (next.email || next.password) return;
    setBusy(true);
    try {
      finish(await authApi.login(email, password));
    } catch (e) {
      if (e instanceof AuthError && e.code === 'not_verified' && e.challenge) {
        useChallenge.getState().set(e.challenge);
        router.push('/auth/verify');
      } else {
        setErrors({ form: authErrorKey(e) });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={i18n.t('signInTitle')}
      subtitle={reason ? i18n.t(reason) : i18n.t('signInSub')}
      footer={<Button label={i18n.t('signIn')} onPress={submit} loading={busy} />}
    >
      <FormField
        label={i18n.t('fEmail')}
        placeholder={i18n.t('phEmail')}
        value={email}
        onChangeText={setEmail}
        error={errors.email ? i18n.t(errors.email) : null}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <FormField
        ref={passwordRef}
        label={i18n.t('fPassword')}
        placeholder={i18n.t('phPassword')}
        value={password}
        onChangeText={setPassword}
        error={errors.password ? i18n.t(errors.password) : null}
        secure
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
      {errors.form ? (
        <View style={[styles.formError, { backgroundColor: c.dangerSoft }]} accessibilityLiveRegion="polite">
          <Text variant="subhead" tone="danger">
            {i18n.t(errors.form)}
          </Text>
        </View>
      ) : null}
      <PressableScale
        onPress={() => router.push({ pathname: '/auth/forgot', params: { email } })}
        style={styles.link}
        accessibilityRole="link"
      >
        <Text variant="captionStrong">{i18n.t('forgotPassword')}</Text>
      </PressableScale>

      <View style={styles.orRow}>
        <View style={[styles.rule, { backgroundColor: c.line }]} />
        <Text variant="caption" tone="muted">
          {i18n.t('or')}
        </Text>
        <View style={[styles.rule, { backgroundColor: c.line }]} />
      </View>
      <SocialButtons />
      <PressableScale onPress={() => router.replace('/auth/register')} style={styles.switch} accessibilityRole="link">
        <Text variant="subhead" tone="soft">
          {i18n.t('noAccount')}{' '}
          <Text variant="subhead" style={{ fontFamily: fonts.semibold }}>
            {i18n.t('createAccount')}
          </Text>
        </Text>
      </PressableScale>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  formError: { padding: 12, borderRadius: 10 },
  link: { alignSelf: 'flex-start', paddingVertical: 4 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  switch: { alignSelf: 'center', paddingVertical: 8 },
});
