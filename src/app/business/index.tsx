import { router, useFocusEffect } from 'expo-router';
import {
  BarChart3,
  BellRing,
  Building2,
  ListTodo,
  LifeBuoy,
  MessageCircle,
  MousePointerClick,
  QrCode,
  UserCog,
  CalendarDays,
  Camera,
  CheckCircle2,
  Circle,
  Clock,
  Hourglass,
  LogOut,
  MessageSquareText,
  Scissors,
  Store,
  Users,
  Plus,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GRACE_DAYS, hasFeature, planById, REMIND_DAYS } from '@/auth/plans';
import { setBranch } from '@/api/client';
import type { Feature } from '@/auth/types';
import { authErrorKey } from '@/auth/flow';
import { useSession } from '@/auth/useSession';
import { BookingLinkCard } from '@/components/business/BookingLinkCard';
import { DashboardCalendar } from '@/components/business/DashboardCalendar';
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
import { useWide } from '@/theme/wide';

const DAY = 86_400_000;

/** The salon owner's home: trial status, review status and what to set up next. */
export default function BusinessDashboard() {
  const { c } = useTheme();
  const i18n = useI18n();
  const wide = useWide();
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
  const can = (f: Feature) => hasFeature(business, f);
  const owner = (business.role ?? 'owner') === 'owner';
  const takesBookings = !business.subscription || can('booking');
  // Fərdi is one person: the owner is the only master, added automatically, so no masters section.
  const solo = business.subscription?.plan === 'ferdi';
  const setup = [
    { done: services.length > 0, label: i18n.t('setupServices'), to: '/business/services' as const },
    ...(takesBookings && !solo
      ? [{ done: masters.length > 0, label: i18n.t('setupMasters'), to: '/business/masters' as const }]
      : []),
    { done: photos.length > 0, label: i18n.t('setupPhotos'), to: '/business/photos' as const },
  ];
  const locations = business.locations ?? [];
  const lockedTo = (f: Feature) =>
    planById(
      f === 'click_report' || f === 'qr_reviews'
        ? 'sade'
        : f === 'whatsapp_addon' || f === 'personal_page'
          ? 'ferdi'
          : 'pro',
    ).name;
  /** A Grow row: opens the tool, or the plans screen with what it needs. */
  const tool = (f: Feature, to: Parameters<typeof router.push>[0]) => () =>
    can(f) ? router.push(to) : owner ? router.push('/business/plans') : toast(i18n.t('errPlanRequired'), 'info');
  const lockDetail = (f: Feature) => (can(f) ? undefined : i18n.t('planLocked', { plan: lockedTo(f) }));
  const switchTo = (id: string) => {
    setBranch(id === locations.find((l) => l.isMain)?.id ? null : id);
    void refresh();
  };
  const ready = setup.every((s) => s.done);
  const pay = async () => {
    if (!token || !business.subscription) return;
    setPaying(true);
    try {
      await payForPlan(token, business.subscription.plan, business.subscription.billingPeriod ?? 'month');
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
  // A date in another year says which year ("18 noyabr 2036").
  const withYear = (d: Date) =>
    d.getFullYear() === new Date(now).getFullYear() ? i18n.fullDate(d) : `${i18n.fullDate(d)} ${d.getFullYear()}`;
  const period = sub?.billingPeriod ?? 'month';
  const price = plan ? i18n.price(prices[plan.id][period]) : '';
  const per = i18n.t(period === 'year' ? 'perYear' : 'perMonth');
  // From REMIND_DAYS before the end (when the email and push go out) the card asks for a payment method.
  const endingSoon = sub?.status === 'trialing' && daysLeft <= REMIND_DAYS;
  const graceEnds = sub
    ? new Date(sub.graceEndsAt ?? new Date(sub.currentPeriodEnd ?? sub.trialEndsAt).getTime() + GRACE_DAYS * DAY)
    : null;
  // On iOS there is no buy button; otherwise it shows whenever a payment is needed or due soon.
  const showPay =
    owner && canBuyInApp && !!sub && (sub.status === 'past_due' || sub.status === 'expired' || endingSoon);

  const headerBlock = (
    <View>
      <Text variant="largeTitle">{business.salonName}</Text>
      <Text variant="subhead" tone="soft" style={{ marginTop: 4 }}>
        {business.categories.map((id) => i18n.tx(categoryById[id].label)).join(' · ')} · {business.district}
      </Text>
    </View>
  );
  const locationsBlock = (
    <>
      {owner && can('branches') && locations.length <= 1 ? (
        <Button
          label={i18n.t('branchAdd')}
          icon={Plus}
          variant="secondary"
          size="sm"
          onPress={() => router.push('/business/branches?add=1')}
        />
      ) : null}
      {locations.length > 1 ? (
        <View style={{ gap: 6 }}>
          <Text variant="captionStrong" tone="soft">
            {i18n.t('switchLocation')}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {locations.map((l) => {
              const on = l.id === business.id;
              return (
                <PressableScale
                  key={l.id}
                  onPress={() => switchTo(l.id)}
                  haptic="selection"
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.loc, { backgroundColor: on ? c.ink : c.surface, borderColor: on ? c.ink : c.line }]}
                >
                  <Text variant="captionStrong" style={{ color: on ? c.bg : c.ink }}>
                    {l.name}
                  </Text>
                  <Text variant="micro" style={{ color: on ? c.bg : c.inkSoft, opacity: 0.8 }}>
                    {l.isMain ? i18n.t('mainSalon') : l.district}
                    {l.role === 'manager' ? ` · ${i18n.t('roleManager')}` : ''}
                  </Text>
                </PressableScale>
              );
            })}
            {owner && can('branches') ? (
              <PressableScale
                onPress={() => router.push('/business/branches?add=1')}
                accessibilityRole="button"
                accessibilityLabel={i18n.t('branchAdd')}
                style={[styles.loc, styles.locAdd, { borderColor: c.line }]}
              >
                <Plus size={16} color={c.ink} strokeWidth={2} />
                <Text variant="captionStrong">{i18n.t('branchAdd')}</Text>
              </PressableScale>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
      {!owner ? (
        <Text variant="caption" tone="soft">
          {i18n.t('managerNote')}
        </Text>
      ) : null}
    </>
  );
  const planBlock = (
    <>
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
                  {canBuyInApp ? ` · ${i18n.t('thenPrice', { price, per })}` : ''}
                </Text>
                {endingSoon ? (
                  <View style={[styles.notice, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                    <BellRing size={16} color={c.onPrimary} strokeWidth={2} />
                    <Text variant="caption" style={{ color: c.onPrimary, flex: 1 }}>
                      {i18n.t(canBuyInApp ? 'trialEndingSoon' : 'trialEndingSoonIos')}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : sub.status === 'active' ? (
              <Text variant="title" style={{ color: c.onPrimary }}>
                {sub.currentPeriodEnd
                  ? i18n.t('paidUntil', { date: withYear(new Date(sub.currentPeriodEnd)) })
                  : i18n.t('planActive')}
              </Text>
            ) : (
              <>
                <Text variant="title" style={{ color: c.onPrimary }}>
                  {sub.status === 'past_due' ? i18n.t('paymentDue') : i18n.t('planExpired')}
                </Text>
                <Text variant="caption" style={{ color: c.onPrimary, opacity: 0.75 }}>
                  {sub.status === 'past_due'
                    ? i18n.t('paymentDueBody', { date: i18n.fullDate(graceEnds!) })
                    : i18n.t('planExpiredBody')}
                </Text>
              </>
            )}
            <View style={styles.cardActions}>
              {showPay ? (
                <Button
                  label={endingSoon ? i18n.t('addPayment') : i18n.t('payNow', { price })}
                  variant="onPrimary"
                  size="sm"
                  loading={paying}
                  onPress={pay}
                />
              ) : null}
              {owner ? (
                <Button
                  label={i18n.t('changePlan')}
                  variant={showPay ? 'ghostOnPrimary' : 'onPrimary'}
                  size="sm"
                  onPress={() => router.push('/business/plans')}
                />
              ) : null}
            </View>
          </>
        ) : (
          <>
            <Text variant="title" style={{ color: c.onPrimary }}>
              {i18n.t('noPlan')}
            </Text>
            <Button label={i18n.t('startTrial')} variant="ghostOnPrimary" onPress={() => router.push('/business/plans')} />
          </>
        )}
      </View>

      <View style={[styles.status, { backgroundColor: c.surface }, shadow(c, 1)]}>
        <Hourglass size={18} color={c.ink} strokeWidth={1.9} />
        <Text variant="subhead" style={{ flex: 1 }}>
          {business.status === 'live' ? i18n.t('statusLive') : i18n.t('statusReview')}
        </Text>
      </View>
    </>
  );
  const calendarBlock = takesBookings ? (
    <DashboardCalendar token={token} business={business} />
  ) : (
    <View style={[styles.status, { backgroundColor: c.surface }, shadow(c, 1)]}>
      <CalendarDays size={18} color={c.ink} strokeWidth={1.9} />
      <Text variant="subhead" style={{ flex: 1 }}>
        {i18n.t('calNoBooking')}
      </Text>
    </View>
  );
  const restBlock = (
    <>
      <BookingLinkCard business={business} onPickAddress={() => router.push('/business/details')} />

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
                style={[
                  styles.row,
                  i < setup.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                ]}
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
        {takesBookings ? (
          <MenuRow icon={CalendarDays} title={i18n.t('bkTitle')} onPress={() => router.push('/business/bookings')} />
        ) : null}
        <MenuRow
          icon={Scissors}
          title={i18n.t('svcTitle')}
          detail={i18n.n(services.length, 'service')}
          onPress={() => router.push('/business/services')}
        />
        {takesBookings && !solo ? (
          <MenuRow
            icon={Users}
            title={i18n.t('mstTitle')}
            detail={i18n.n(masters.length, 'master')}
            onPress={() => router.push('/business/masters')}
          />
        ) : null}
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
        <MenuRow
          icon={MessageSquareText}
          title={i18n.t('reviewsTitle')}
          onPress={() => router.push('/business/reviews')}
        />
        <MenuRow icon={Store} title={i18n.t('detailsTitle')} onPress={() => router.push('/business/details')} last />
      </Card>

      {sub ? (
        <>
          <Text variant="title" style={{ marginTop: 8 }}>
            {i18n.t('dashGrow')}
          </Text>
          <Card>
            <MenuRow icon={QrCode} title={i18n.t('qrTitle')} onPress={() => router.push('/business/qr')} />
            <MenuRow
              icon={MousePointerClick}
              title={i18n.t('clicksTitle')}
              detail={lockDetail('click_report')}
              onPress={tool('click_report', '/business/clicks')}
            />
            <MenuRow
              icon={BarChart3}
              title={i18n.t('statsTitle')}
              detail={lockDetail('stats')}
              onPress={tool('stats', '/business/stats')}
            />
            <MenuRow
              icon={ListTodo}
              title={i18n.t('waitlistTitle')}
              detail={lockDetail('waitlist')}
              onPress={tool('waitlist', '/business/waitlist')}
            />
            {owner ? (
              <>
                <MenuRow
                  icon={Building2}
                  title={i18n.t('branchesTitle')}
                  detail={lockDetail('branches') ?? (locations.length > 1 ? String(locations.length) : undefined)}
                  onPress={tool('branches', '/business/branches')}
                />
                <MenuRow
                  icon={UserCog}
                  title={i18n.t('teamTitle')}
                  detail={lockDetail('managers')}
                  onPress={tool('managers', '/business/team')}
                />
                <MenuRow
                  icon={MessageCircle}
                  title={i18n.t('waTitle')}
                  detail={
                    lockDetail('whatsapp_addon') ??
                    (business.whatsappPack?.left
                      ? i18n.t('waLeft', { n: business.whatsappPack.left })
                      : i18n.t('waNone'))
                  }
                  onPress={tool('whatsapp_addon', '/business/whatsapp')}
                />
              </>
            ) : null}
            <MenuRow
              icon={LifeBuoy}
              title={i18n.t('supportTitle')}
              onPress={() => router.push('/business/support')}
              last
            />
          </Card>
        </>
      ) : null}

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
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('dashTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {headerBlock}
        {locationsBlock}
        {wide ? (
          // Desktop: the calendar on the left, the plan and the salon's management on the right.
          <View style={styles.columns}>
            <View style={styles.left}>{calendarBlock}</View>
            <View style={styles.right}>
              {planBlock}
              {restBlock}
            </View>
          </View>
        ) : (
          <>
            {planBlock}
            {calendarBlock}
            {restBlock}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 18, gap: 8 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  notice: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: radius.md,
    marginTop: 4,
  },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginVertical: 4 },
  fill: { height: 6, borderRadius: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg },
  list: { borderRadius: radius.lg, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  loc: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, gap: 2, minWidth: 120 },
  locAdd: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderStyle: 'dashed' },
  columns: { flexDirection: 'row', gap: 24, alignItems: 'flex-start' },
  left: { flex: 3, minWidth: 0, gap: 16, position: 'sticky' as never, top: 16 },
  right: { flex: 2, minWidth: 0, gap: 16 },
});
