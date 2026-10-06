import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { authApi } from '@/auth';
import { useChallenge } from '@/auth/challenge';
import { authErrorKey } from '@/auth/flow';
import { checkEmail } from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';

export default function Forgot() {
  const i18n = useI18n();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = checkEmail(email);
    setError(e);
    if (e) return;
    setBusy(true);
    try {
      useChallenge.getState().set(await authApi.forgotPassword(email));
      router.push('/auth/verify');
    } catch (err) {
      setError(authErrorKey(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={i18n.t('forgotTitle')}
      subtitle={i18n.t('forgotSub')}
      footer={<Button label={i18n.t('sendCode')} onPress={submit} loading={busy} />}
    >
      <FormField
        label={i18n.t('fEmail')}
        placeholder={i18n.t('phEmail')}
        value={email}
        onChangeText={setEmail}
        error={error && error.startsWith('errEmail') ? i18n.t(error) : null}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        autoFocus
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      {error && !error.startsWith('errEmail') ? (
        <Text variant="subhead" tone="danger">
          {i18n.t(error)}
        </Text>
      ) : null}
    </AuthLayout>
  );
}
