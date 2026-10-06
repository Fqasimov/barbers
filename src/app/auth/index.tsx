import { router } from 'expo-router';
import { Mail, Store } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authApi } from '@/auth';
import { useExitAuthFlow } from '@/auth/flow';
import { SocialButtons } from '@/components/auth/SocialButtons';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { useI18n } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius } from '@/theme/tokens';

/** First screen of the account flow: social, email, or keep browsing. */
export default function Welcome() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const exit = useExitAuthFlow();
  const browse = () => {
    useStore.getState().setAuthPrompted();
    exit();
  };
  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <Wordmark size={34} />
      <View style={styles.hero}>
        <Text variant="largeTitle" accessibilityRole="header" style={styles.title}>
          {i18n.t('authWelcomeTitle')}
        </Text>
        <Text variant="body" tone="soft">
          {i18n.t('authWelcomeBody')}
        </Text>
      </View>

      <View style={styles.actions}>
        <SocialButtons />
        <View style={styles.orRow}>
          <View style={[styles.rule, { backgroundColor: c.line }]} />
          <Text variant="caption" tone="muted">
            {i18n.t('or')}
          </Text>
          <View style={[styles.rule, { backgroundColor: c.line }]} />
        </View>
        <Button label={i18n.t('createAccount')} onPress={() => router.push('/auth/register')} />
        <Button
          label={i18n.t('continueEmail')}
          icon={Mail}
          variant="secondary"
          onPress={() => router.push('/auth/sign-in')}
        />
      </View>

      <PressableScale
        onPress={() => router.push('/business/register')}
        scaleTo={0.985}
        accessibilityLabel={i18n.t('forBusiness')}
        style={[styles.business, { backgroundColor: c.surface, borderColor: c.line }]}
      >
        <View style={[styles.bizIcon, { backgroundColor: c.sunken }]}>
          <Store size={20} color={c.ink} strokeWidth={1.9} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{i18n.t('forBusiness')}</Text>
          <Text variant="caption" tone="soft">
            {i18n.t('bizSub')}
          </Text>
        </View>
      </PressableScale>

      <Button label={i18n.t('browseFirst')} variant="ghost" onPress={browse} style={{ marginTop: 6 }} />
      {authApi.kind === 'demo' ? (
        <Text variant="caption" tone="muted" align="center">
          {i18n.t('demoBackendNote')}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, gap: 18, flexGrow: 1 },
  hero: { gap: 10, marginTop: 28, marginBottom: 10 },
  title: { fontSize: 34, lineHeight: 40 },
  actions: { gap: 10 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  business: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  bizIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
