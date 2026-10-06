import { router } from 'expo-router';
import { Camera, Clock, Hourglass, LogOut, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { planById } from '@/auth/plans';
import { useSession } from '@/auth/useSession';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { categoryById } from '@/data/categories';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
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
              <Text variant="title" style={{ color: c.onPrimary }}>
                {i18n.t('trialDaysLeft', { days: i18n.n(daysLeft, 'day') })}
              </Text>
              <View style={[styles.track, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <View style={[styles.fill, { width: `${Math.round(used * 100)}%`, backgroundColor: c.onPrimary }]} />
              </View>
              <Text variant="caption" style={{ color: c.onPrimary, opacity: 0.75 }}>
                {i18n.t('trialEnds', { date: i18n.fullDate(ends!) })} ·{' '}
                {i18n.t('thenPrice', { price: i18n.price(plan.price), per: i18n.t('perMonth') })}
              </Text>
              <Button
                label={i18n.t('changePlan')}
                variant="secondary"
                size="sm"
                onPress={() => router.push('/business/plans')}
                style={{ alignSelf: 'flex-start', marginTop: 6 }}
              />
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

        <Text variant="title" style={{ marginTop: 8 }}>
          {i18n.t('dashNext')}
        </Text>
        <View style={[styles.list, { backgroundColor: c.surface }, shadow(c, 1)]}>
          {[
            { icon: Users, label: i18n.t('dashStep1') },
            { icon: Clock, label: i18n.t('dashStep2') },
            { icon: Camera, label: i18n.t('dashStep3') },
          ].map(({ icon: Icon, label }, i) => (
            <View
              key={label}
              style={[styles.row, i < 2 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
            >
              <View style={[styles.icon, { backgroundColor: c.sunken }]}>
                <Icon size={18} color={c.ink} strokeWidth={1.9} />
              </View>
              <Text variant="bodyStrong" style={{ flex: 1 }}>
                {label}
              </Text>
              <Text variant="caption" tone="muted">
                {i18n.t('comingSoon')}
              </Text>
            </View>
          ))}
        </View>

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
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginVertical: 4 },
  fill: { height: 6, borderRadius: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg },
  list: { borderRadius: radius.lg, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
