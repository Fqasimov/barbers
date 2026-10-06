import { router } from 'expo-router';
import { useState } from 'react';

import { authApi } from '@/auth';
import { useChallenge } from '@/auth/challenge';
import { authErrorKey, useFinishSignIn } from '@/auth/flow';
import { checkPassword } from '@/auth/validation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';

export default function NewPassword() {
  const i18n = useI18n();
  const finish = useFinishSignIn();
  const resetToken = useChallenge((s) => s.resetToken);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = checkPassword(password);
    setError(e);
    if (e) return;
    if (!resetToken) {
      router.replace('/auth/forgot');
      return;
    }
    setBusy(true);
    try {
      const session = await authApi.resetPassword(resetToken, password);
      useChallenge.getState().setResetToken(null);
      toast(i18n.t('passwordChanged'));
      finish(session);
    } catch (err) {
      setError(authErrorKey(err));
    } finally {
      setBusy(false);
    }
  };

  const fieldError = error && error.startsWith('errPassword') ? error : error === 'errRequired' ? error : null;
  return (
    <AuthLayout
      title={i18n.t('newPasswordTitle')}
      footer={<Button label={i18n.t('savePassword')} onPress={submit} loading={busy} />}
    >
      <FormField
        label={i18n.t('fPassword')}
        placeholder={i18n.t('phNewPassword')}
        hint={i18n.t('passwordHint')}
        value={password}
        onChangeText={setPassword}
        error={fieldError ? i18n.t(fieldError) : null}
        secure
        autoComplete="new-password"
        textContentType="newPassword"
        autoFocus
        onSubmitEditing={submit}
      />
      {error && !fieldError ? (
        <Text variant="subhead" tone="danger">
          {i18n.t(error)}
        </Text>
      ) : null}
    </AuthLayout>
  );
}
