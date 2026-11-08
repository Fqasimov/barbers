import { Redirect, router } from 'expo-router';
import { LogIn, Store } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/useSession';
import { Button } from '@/components/ui/Button';
import { Kicker } from '@/components/ui/Kicker';
import { LangSwitch } from '@/components/ui/LangSwitch';
import { Reveal } from '@/components/ui/Reveal';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, isSite } from '@/theme/tokens';
import { useWide } from '@/theme/wide';

/**
 * The salon panel's front door on the website (yazilnow.az/panel): register
 * a salon or sign in, then everything runs in the same screens as the app.
 */
export default function Panel() {
  const { c } = useTheme();
  const wide = useWide();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const session = useSession((s) => s.session);
  if (session?.business) return <Redirect href="/business" />;
  const points = [i18n.t('panelPoint1'), i18n.t('panelPoint2'), i18n.t('panelPoint3')];
  return (
    <View style={[styles.wrap, { backgroundColor: c.bg }]}>
      <Reveal index={0} style={[styles.bar, { borderColor: c.line, paddingTop: insets.top + 14 }]}>
        <Wordmark size={22} />
        <LangSwitch />
      </Reveal>
      <ScrollView
        contentContainerStyle={[styles.content, wide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
      >
        <Reveal index={1} style={wide ? styles.leftPane : undefined}>
          <Kicker style={{ marginBottom: 20 }}>{i18n.t('panelKicker')}</Kicker>
          <Text
            variant="largeTitle"
            accessibilityRole="header"
            style={isSite ? [styles.display, wide && styles.displayWide] : undefined}
          >
            {i18n.t('panelTitle')}
          </Text>
          <Text variant="body" tone="soft" style={styles.sub}>
            {i18n.t('panelSub')}
          </Text>
        </Reveal>

        <View style={wide ? styles.rightPane : { gap: 28 }}>
          <Reveal index={2} style={[styles.points, { borderColor: c.line }]}>
            {points.map((p, i) => (
              <View
                key={p}
                style={[styles.point, i < points.length - 1 && { borderBottomWidth: 1, borderColor: c.line }]}
              >
                <Text style={[styles.numeral, { color: c.accent }]}>{`0${i + 1}`}</Text>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {p}
                </Text>
              </View>
            ))}
          </Reveal>

          <Reveal index={3} style={{ gap: 12 }}>
            <Button label={i18n.t('panelRegister')} icon={Store} onPress={() => router.push('/business/register')} />
            <Button
              label={i18n.t('panelSignIn')}
              icon={LogIn}
              variant="secondary"
              onPress={() => router.push('/auth/sign-in')}
            />
          </Reveal>

          <Reveal index={4}>
            <Text variant="caption" tone="muted">
              {i18n.t('bizSub')}
            </Text>
          </Reveal>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  content: { padding: gutter, paddingTop: 44, paddingBottom: 56, gap: 36 },
  display: { fontSize: 52, lineHeight: 50 },
  displayWide: { fontSize: 84, lineHeight: 80 },
  contentWide: { flexDirection: 'row', alignItems: 'center', gap: 120, paddingTop: 96, paddingBottom: 96, flexGrow: 1 },
  leftPane: { flex: 1.1 },
  rightPane: { flex: 1, maxWidth: 640, gap: 28 },
  sub: { marginTop: 18, maxWidth: 520 },
  points: { borderTopWidth: 1 },
  point: { flexDirection: 'row', alignItems: 'baseline', gap: 18, paddingVertical: 18 },
  numeral: { fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 24, width: 34 },
});
