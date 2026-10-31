import { Redirect, router } from 'expo-router';
import { LogIn, Store } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useSession } from '@/auth/useSession';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

/**
 * The salon panel's front door on the website (yazilnow.az/panel): register
 * a salon or sign in, then everything runs in the same screens as the app.
 */
export default function Panel() {
  const { c } = useTheme();
  const i18n = useI18n();
  const session = useSession((s) => s.session);
  if (session?.business) return <Redirect href="/business" />;
  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      <View style={{ gap: 8 }}>
        <Text variant="largeTitle">{i18n.t('panelTitle')}</Text>
        <Text variant="body" tone="soft">
          {i18n.t('panelSub')}
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        <Button label={i18n.t('panelRegister')} icon={Store} onPress={() => router.push('/business/register')} />
        <Button
          label={i18n.t('panelSignIn')}
          icon={LogIn}
          variant="secondary"
          onPress={() => router.push('/auth/sign-in')}
        />
      </View>
      <Text variant="caption" tone="muted">
        {i18n.t('bizSub')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: gutter, paddingTop: 72, gap: 28 },
});
