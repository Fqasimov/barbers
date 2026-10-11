import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { authApi } from '@/auth';
import { authErrorKey } from '@/auth/flow';
import { useSession } from '@/auth/useSession';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormField } from '@/components/auth/FormField';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { disableNotifications } from '@/lib/notifications';
import type { StringKey } from '@/i18n/strings';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Permanently deletes the account, as the App Store and Google Play require.
 * Password accounts confirm with their password.
 */
export default function DeleteAccount() {
  const { c } = useTheme();
  const i18n = useI18n();
  const session = useSession((s) => s.session);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<StringKey | null>(null);
  const [busy, setBusy] = useState(false);

  if (!session) return null;
  const needsPassword = session.user.provider === 'password';
  const isBusiness = !!session.business;
  const points: StringKey[] = isBusiness
    ? ['deletePoint1', 'deletePoint2', 'deletePointBusiness']
    : ['deletePoint1', 'deletePoint2', 'deletePoint3'];

  const run = async () => {
    setBusy(true);
    try {
      await disableNotifications(session.token);
      await authApi.deleteAccount(session.token, needsPassword ? password : undefined);
      useStore.getState().clearAccountData();
      useSession.setState({ session: null });
      toast(i18n.t('accountDeleted'), 'info');
      router.dismissAll();
    } catch (e) {
      const key = authErrorKey(e);
      setError(key === 'errInvalidCredentials' ? 'errWrongPassword' : key);
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (needsPassword && !password) {
      setError('errRequired');
      return;
    }
    setError(null);
    if (Platform.OS === 'web') return void run();
    Alert.alert(i18n.t('deleteConfirmTitle'), i18n.t('deleteConfirmBody'), [
      { text: i18n.t('keep'), style: 'cancel' },
      { text: i18n.t('deleteAccount'), style: 'destructive', onPress: () => void run() },
    ]);
  };

  return (
    <AuthLayout
      title={i18n.t('deleteTitle')}
      subtitle={i18n.t('deleteSub')}
      footer={<Button label={i18n.t('deleteAccount')} variant="danger" onPress={submit} loading={busy} />}
    >
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
        {points.map((k) => (
          <View key={k} style={styles.point}>
            <Check size={16} color={c.inkSoft} strokeWidth={2.2} style={{ marginTop: 2 }} />
            <Text variant="subhead" style={{ flex: 1 }}>
              {i18n.t(k)}
            </Text>
          </View>
        ))}
      </View>
      {needsPassword ? (
        <FormField
          label={i18n.t('fPassword')}
          placeholder={i18n.t('phPassword')}
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError(null);
          }}
          secure
          autoComplete="current-password"
          textContentType="password"
          error={error ? i18n.t(error) : null}
          onSubmitEditing={submit}
        />
      ) : error ? (
        <Text variant="subhead" style={{ color: c.danger }}>
          {i18n.t(error)}
        </Text>
      ) : null}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 12 },
  point: { flexDirection: 'row', gap: 10 },
});
