import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi, type PlanId } from '@/auth';
import { authErrorKey, useExitAuthFlow } from '@/auth/flow';
import { plans, TRIAL_DAYS } from '@/auth/plans';
import { useSession } from '@/auth/useSession';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadow } from '@/theme/tokens';

/** Pick a plan and start the free trial. Also used later to switch plans. */
export default function Plans() {
  const { c } = useTheme();
  const i18n = useI18n();
  const exit = useExitAuthFlow();
  const session = useSession((s) => s.session);
  const setBusiness = useSession((s) => s.setBusiness);
  const current = session?.business?.subscription?.plan;
  const [plan, setPlan] = useState<PlanId>(current ?? 'pro');
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (!session) {
      router.replace('/auth/sign-in');
      return;
    }
    setBusy(true);
    try {
      setBusiness(await authApi.startTrial(session.token, plan));
      toast(i18n.t(current ? 'saveProfile' : 'trialStarted'));
      if (current) router.back();
      else exit('/business');
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title={i18n.t('plansTitle')}
      subtitle={i18n.t('plansSub')}
      mode={current ? 'back' : 'close'}
      footer={
        <>
          <Button label={current ? i18n.t('changePlan') : i18n.t('startTrial')} onPress={start} loading={busy} />
          {!current ? (
            <Text variant="caption" tone="muted" align="center">
              {i18n.t('trialNote')}
            </Text>
          ) : null}
        </>
      }
    >
      <View style={{ gap: 12 }} accessibilityRole="radiogroup">
        {plans.map((p) => {
          const on = p.id === plan;
          return (
            <PressableScale
              key={p.id}
              onPress={() => setPlan(p.id)}
              haptic="selection"
              scaleTo={0.985}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={`${p.name}, ${i18n.price(p.price)}${i18n.t('perMonth')}`}
              style={[
                styles.card,
                { backgroundColor: c.surface, borderColor: on ? c.ink : c.line, borderWidth: on ? 2 : 1 },
                on && shadow(c, 1),
              ]}
            >
              <View style={styles.head}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.nameRow}>
                    <Text variant="title">{p.name}</Text>
                    {p.recommended ? (
                      <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
                        <Text variant="micro" tone="accent">
                          {i18n.t('recommended')}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text variant="subhead" tone="soft">
                    {i18n.tx(p.blurb)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="title">{i18n.price(p.price)}</Text>
                  <Text variant="caption" tone="muted">
                    {i18n.t('perMonth')}
                  </Text>
                </View>
              </View>
              <View style={[styles.rule, { backgroundColor: c.line }]} />
              <View style={{ gap: 8 }}>
                {p.features.map((f) => (
                  <View key={f.en} style={styles.feature}>
                    <Check size={16} color={c.success} strokeWidth={2.4} />
                    <Text variant="subhead" style={{ flex: 1 }}>
                      {i18n.tx(f)}
                    </Text>
                  </View>
                ))}
              </View>
              <Text variant="captionStrong" tone="success">
                {i18n.t('trialBadge', { days: i18n.n(TRIAL_DAYS, 'day') })}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 16, gap: 14 },
  head: { flexDirection: 'row', gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  rule: { height: StyleSheet.hairlineWidth },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
