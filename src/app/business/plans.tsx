import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authApi, type PlanId } from '@/auth';
import { authErrorKey, useExitAuthFlow } from '@/auth/flow';
import { type BillingPeriod, BRANCH_PRICE, plans, TRIAL_DAYS } from '@/auth/plans';
import { useSession } from '@/auth/useSession';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { canBuyInApp, usePlanPrices } from '@/lib/billing';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadow } from '@/theme/tokens';

/**
 * Pick a plan and start the free trial: no card, nothing charged until it ends.
 * Also used later to switch plans. On iOS (canBuyInApp false) it shows plans
 * and features only: no prices, no billing switch.
 */
export default function Plans() {
  const { c } = useTheme();
  const i18n = useI18n();
  const exit = useExitAuthFlow();
  const session = useSession((s) => s.session);
  const setBusiness = useSession((s) => s.setBusiness);
  const sub = session?.business?.subscription;
  const current = sub?.plan;
  const [plan, setPlan] = useState<PlanId>(current ?? 'pro');
  const [period, setPeriod] = useState<BillingPeriod>(sub?.billingPeriod ?? 'month');
  const per = i18n.t(period === 'year' ? 'perYear' : 'perMonth');
  const [busy, setBusy] = useState(false);
  const prices = usePlanPrices();

  const start = async () => {
    if (!session) {
      router.replace('/auth/sign-in');
      return;
    }
    setBusy(true);
    try {
      setBusiness(await authApi.startTrial(session.token, plan, period));
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
            <>
              <Text variant="caption" tone="soft" align="center">
                {i18n.t('trialNote')}
              </Text>
              <Text variant="caption" tone="muted" align="center">
                {i18n.t('trialTerms')}
              </Text>
            </>
          ) : null}
        </>
      }
    >
      {canBuyInApp ? (
        <SegmentedControl<BillingPeriod>
          options={[
            { value: 'month', label: i18n.t('billMonthly') },
            { value: 'year', label: i18n.t('billYearly') },
          ]}
          value={period}
          onChange={setPeriod}
          style={{ marginBottom: 12 }}
        />
      ) : null}
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
              accessibilityLabel={canBuyInApp ? `${p.name}, ${i18n.price(prices[p.id][period])}${per}` : p.name}
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
                {canBuyInApp ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="title">{i18n.price(prices[p.id][period])}</Text>
                    <Text variant="caption" tone="muted">
                      {per}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={[styles.rule, { backgroundColor: c.line }]} />
              <View style={{ gap: 8 }}>
                {p.features.map((f) => (
                  <View key={f.en} style={styles.feature}>
                    <Check size={16} color={f.soon ? c.inkMuted : c.success} strokeWidth={2.4} />
                    <Text variant="subhead" tone={f.soon ? 'soft' : undefined} style={{ flex: 1 }}>
                      {i18n.tx(f)}
                      {f.soon ? <Text variant="caption" tone="muted">{`  · ${i18n.t('soon')}`}</Text> : null}
                    </Text>
                  </View>
                ))}
              </View>
              {p.id === 'sade' || (p.id === 'pro' && canBuyInApp) ? (
                <Text variant="caption" tone="soft">
                  {p.id === 'sade'
                    ? i18n.t('planSadeNote')
                    : i18n.t('planBranchNote', { price: i18n.price(BRANCH_PRICE) })}
                </Text>
              ) : null}
              <Text variant="captionStrong" tone="success">
                {i18n.t('trialBadge', { days: i18n.n(TRIAL_DAYS, 'day') })}
                {canBuyInApp && period === 'year' ? (
                  <Text variant="caption" tone="muted">{`  · ${i18n.t('yearDeal')}`}</Text>
                ) : null}
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
