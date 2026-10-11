import { router, useFocusEffect } from 'expo-router';
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  Circle,
  Clock,
  Hourglass,
  LogOut,
  Scissors,
  Store,
  Users,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { planById } from '@/auth/plans';
import { authErrorKey } from '@/auth/flow';
import { useSession } from '@/auth/useSession';
import { Card, MenuRow, useOwner } from '@/components/business/kit';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { categoryById } from '@/data/categories';
import { useI18n } from '@/i18n';
import { canBuyInApp, payForPlan, usePlanPrices } from '@/lib/billing';
import { enableNotifications } from '@/lib/notifications';
import { useTheme } from '@/theme/ThemeProvider';
import { useStore } from '@/store/useStore';
import { gutter, radius, shadow } from '@/theme/tokens';

const DAY = 86_400_000;

/** The salon owner's home: trial status, review status and what to set up next. */
export default function BusinessDashboard() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);
  const [now] = useState(() => Date.now());
  const { refresh, token } = useOwner();
  const prices = usePlanPrices();
  const [paying, setPaying] = useState(false);
  // Owners need new-booking alerts; ask once when they first open the dashboard.
  useEffect(() => {
    if (token) void enableNotifications(token);
  }, [token]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );
  const business = session?.business;

  if (!session || !business) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <ScreenHeader />
        <View style={{ padding: gutter, gap: 16 }}>
          <Text variant="title">{i18n.t('bizTitle')}</Text>
          <Button label={i18n.t('signIn')} onPress={() => router.replace('/auth/sign-in')} />
        </View>
      </View>
    );
  }

  const services = business.services ?? [];
  const masters = business.masters ?? [];
  const photos = business.photos ?? [];
  const setup = [
    { done: services.length > 0, label: i18n.t('setupServices'), to: '/business/services' as const },
    { done: masters.length > 0, label: i18n.t('setupMasters'), to: '/business/masters' as const },
    { done: photos.length > 0, label: i18n.t('setupPhotos'), to: '/business/photos' as const },
  ];
  const ready = setup.every((s) => s.done);
  const pay = async () => {
    if (!token || !business.subscription) return;
    setPaying(true);
    try {
      await payForPlan(token, business.subscription.plan);
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
    } finally {
      setPaying(false);
      void refresh();
    }
  };
  const sub = business.subscription;
  const plan = sub ? planById(sub.plan) : null;
  const ends = sub ? new Date(sub.trialEndsAt) : null;
  const daysLeft = ends ? Math.max(0, Math.ceil((ends.getTime() - now) / DAY)) : 0;
  const used = sub
    ? Math.min(1, (now - new Date(sub.startedAt).getTime()) / (ends!.getTime() - new Date(sub.startedAt).getTime()))
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('dashTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <View>
          <Text variant="largeTitle">{business.salonName}</Text>
          <Text variant="subhead" tone="soft" style={{ marginTop: 4 }}>
            {business.categories.map((id) => i18n.tx(categoryById[id].label)).join(' · ')} · {business.district}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: c.primary }]}>
          {sub && plan ? (
            <>
              <Text variant="captionStrong" style={{ color: c.onPrimary, opacity: 0.7 }}>
                {plan.name}
              </Text>
              {sub.status === 'trialing' ? (
                <>
                  <Text variant="title" style={{ color: c.onPrimary }}>
                    {i18n.t('trialDaysLeft', { days: i18n.n(daysLeft, 'day') })}
                  </Text>
                  <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                    <View style={[styles.fill, { width: `${Math.round(used * 100)}%`, backgroundColor: c.onPrimary }]} />
                  </View>
                  <Text variant="caption" style={{ color: c.onPrimary, opacity: 0.75 }}>
                    {i18n.t('trialEnds', { date: i18n.fullDate(ends!) })}
                    {canBuyInApp
                      ? ` · ${i18n.t('thenPrice', { price: i18n.price(prices[plan.id]), per: i18n.t('perMonth') })}`
                      : ''}
                  </Text>
                </>
              ) : sub.status === 'active' ? (
                <Text variant="title" style={{ color: c.onPrimary }}>
                  {sub.currentPeriodEnd
                    ? i18n.t('paidUntil', { date: i18n.fullDate(new Date(sub.currentPeriodEnd)) })
                    : i18n.t('planActive')}
                </Text>
              ) : (
                <>
                  <Text variant="title" style={{ color: c.onPrimary }}>
                    {sub.status === 'past_due' ? i18n.t('paymentDue') : i18n.t('planExpired')}
                  </Text>
                  <Text variant="caption" style={{ color: c.onPrimary, opacity: 0.75 }}>
                    {sub.status === 'past_due' ? i18n.t('paymentDueBody') : i18n.t('planExpiredBody')}
                  </Text>
                </>
              )}
              <View style={styles.cardActions}>
                {canBuyInApp && sub.status !== 'active' ? (
                  <Button
                    label={i18n.t('payNow', { price: i18n.price(prices[plan.id]) })}
                    variant="secondary"
                    size="sm"
                    loading={paying}
                    onPress={pay}
                  />
                ) : null}
                <Button
                  label={i18n.t('changePlan')}
                  variant={canBuyInApp && sub.status !== 'active' ? 'ghost' : 'secondary'}
                  size="sm"
                  onPress={() => router.push('/business/plans')}
                />
              </View>
            </>
          ) : (
            <>
              <Text variant="title" style={{ color: c.onPrimary }}>
                {i18n.t('noPlan')}
              </Text>
              <Button label={i18n.t('startTrial')} variant="secondary" onPress={() => router.push('/business/plans')} />
            </>
          )}
        </View>

        <View style={[styles.status, { backgroundColor: c.surface }, shadow(c, 1)]}>
          <Hourglass size={18} color={c.ink} strokeWidth={1.9} />
          <Text variant="subhead" style={{ flex: 1 }}>
            {business.status === 'live' ? i18n.t('statusLive') : i18n.t('statusReview')}
          </Text>
        </View>

        {!ready ? (
          <>
            <View style={{ marginTop: 8, gap: 2 }}>
              <Text variant="title">{i18n.t('setupTitle')}</Text>
              <Text variant="subhead" tone="soft">
                {i18n.t('setupSub')}
              </Text>
            </View>
            <View style={[styles.list, { backgroundColor: c.surface }, shadow(c, 1)]}>
              {setup.map(({ done, label, to }, i) => (
                <PressableScale
                  key={label}
                  onPress={() => router.push(to)}
                  haptic="light"
                  scaleTo={0.99}
                  accessibilityRole="button"
                  accessibilityState={{ checked: done }}
                  accessibilityLabel={label}
                  style={[styles.row, i < setup.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
                >
                  {done ? (
                    <CheckCircle2 size={22} color={c.success} strokeWidth={2} />
                  ) : (
                    <Circle size={22} color={c.lineStrong} strokeWidth={2} />
                  )}
                  <Text variant="bodyStrong" style={{ flex: 1, opacity: done ? 0.55 : 1 }}>
                    {label}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </>
        ) : null}

        <Text variant="title" style={{ marginTop: 8 }}>
          {i18n.t('dashManage')}
        </Text>
        <Card>
          <MenuRow icon={CalendarDays} title={i18n.t('bkTitle')} onPress={() => router.push('/business/bookings')} />
          <MenuRow
            icon={Scissors}
            title={i18n.t('svcTitle')}
            detail={i18n.n(services.length, 'service')}
            onPress={() => router.push('/business/services')}
          />
          <MenuRow
            icon={Users}
            title={i18n.t('mstTitle')}
            detail={i18n.n(masters.length, 'master')}
            onPress={() => router.push('/business/masters')}
          />
          <MenuRow
            icon={Clock}
            title={i18n.t('hoursTitle')}
            detail={business.hours ? `${business.hours.open}–${business.hours.close}` : undefined}
            onPress={() => router.push('/business/hours')}
          />
          <MenuRow
            icon={Camera}
            title={i18n.t('photosTitle')}
            detail={photos.length ? String(photos.length) : undefined}
            onPress={() => router.push('/business/photos')}
          />
          <MenuRow icon={Store} title={i18n.t('detailsTitle')} onPress={() => router.push('/business/details')} last />
        </Card>

        <View style={{ gap: 2, marginTop: 8 }}>
          <Text variant="captionStrong" tone="soft">
            {i18n.t('ownerLabel')}
          </Text>
          <Text variant="body">
            {session.user.firstName} {session.user.lastName} · {session.user.email}
          </Text>
        </View>
        <Button
          label={i18n.t('signOut')}
          icon={LogOut}
          variant="ghost"
          onPress={async () => {
            await signOut();
            useStore.getState().clearAccountData();
            toast(i18n.t('signedOut'), 'info');
            router.dismissAll();
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 18, gap: 8 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginVertical: 4 },
  fill: { height: 6, borderRadius: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg },
  list: { borderRadius: radius.lg, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
