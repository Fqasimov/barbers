import { router } from 'expo-router';
import { ChevronRight, Heart, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SalonPhoto } from '@/components/SalonPhoto';
import { useTabBarInset } from '@/components/TabBar';
import { Avatar } from '@/components/ui/Avatar';
import { webReset } from '@/components/ui/Field';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { nextAvailable } from '@/data/availability';
import { liveRating } from '@/data/ranking';
import { masterById, salonById } from '@/data/salons';
import { useI18n, type Locale } from '@/i18n';
import { fmtClock, minutesOfDay } from '@/lib/time';
import { useStore, type Appearance } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, radius, shadow } from '@/theme/tokens';

type LangChoice = 'system' | Locale;

export default function ProfileScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const name = useStore((s) => s.name);
  const setName = useStore((s) => s.setName);
  const appearance = useStore((s) => s.appearance);
  const setAppearance = useStore((s) => s.setAppearance);
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);
  const favorites = useStore((s) => s.favorites);
  const followed = useStore((s) => s.followed);
  const reviews = useStore((s) => s.reviews);
  const bookings = useStore((s) => s.bookings);
  const [now] = useState(() => new Date());

  const saved = useMemo(() => favorites.map((id) => salonById(id)).filter((s) => !!s), [favorites]);
  const masters = useMemo(() => followed.map((id) => masterById(id)).filter((m) => !!m), [followed]);
  const upcoming = bookings.filter((b) => b.status === 'upcoming' && new Date(b.start) > now).length;

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: bottom, paddingHorizontal: gutter }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.identity}>
        <Avatar name={name || i18n.t('you')} tone="ink" size={64} />
        <View style={{ flex: 1 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={i18n.t('namePlaceholder')}
            placeholderTextColor={c.inkMuted}
            accessibilityLabel={i18n.t('namePlaceholder')}
            accessibilityHint={i18n.t('nameHint')}
            maxLength={32}
            style={[styles.nameInput, { color: c.ink }, webReset]}
          />
          <Text variant="caption" tone="muted">
            {i18n.t('nameHint')}
          </Text>
        </View>
      </View>

      <View style={[styles.stats, { backgroundColor: c.surface }, shadow(c, 1)]}>
        <Stat value={upcoming} label={i18n.t('statBooked')} />
        <View style={[styles.statDivider, { backgroundColor: c.line }]} />
        <Stat value={reviews.length} label={i18n.t('statReviews')} />
        <View style={[styles.statDivider, { backgroundColor: c.line }]} />
        <Stat value={favorites.length} label={i18n.t('statSaved')} />
      </View>

      <Text variant="title" style={styles.sectionTitle} accessibilityRole="header">
        {i18n.t('followedMasters')}
      </Text>
      {masters.length === 0 ? (
        <Hint icon={UserPlus} text={i18n.t('followedHint')} />
      ) : (
        <View style={{ gap: 10 }}>
          {masters.map(({ master, salon }) => {
            const first = salon.services.find((s) => master.serviceIds.includes(s.id));
            const next = nextAvailable({ salon, master, durationMin: first?.durationMin ?? 45, bookings, now });
            return (
              <PressableScale
                key={master.id}
                onPress={() => router.push({ pathname: '/book/[id]', params: { id: salon.id, master: master.id } })}
                scaleTo={0.985}
                accessibilityLabel={`${master.name}, ${salon.name}`}
                style={[styles.card, { backgroundColor: c.surface }, shadow(c, 1)]}
              >
                <Avatar name={master.name} tone={master.tone} size={44} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{master.name}</Text>
                  <Text variant="caption" tone="soft" numberOfLines={1}>
                    {i18n.tx(master.role)} · {salon.name}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="caption" tone="muted">
                    {i18n.t('nextFree')}
                  </Text>
                  <Text variant="captionStrong" style={{ color: next ? c.success : c.inkMuted }}>
                    {next ? `${i18n.relativeDay(next)}, ${fmtClock(minutesOfDay(next))}` : i18n.t('fullyBooked')}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
      )}

      <Text variant="title" style={styles.sectionTitle} accessibilityRole="header">
        {i18n.t('savedPlaces')}
      </Text>
      {saved.length === 0 ? (
        <Hint icon={Heart} text={i18n.t('savedHint')} />
      ) : (
        <View style={[styles.list, { backgroundColor: c.surface }, shadow(c, 1)]}>
          {saved.map((s, i) => {
            const live = liveRating(s, reviews);
            return (
              <PressableScale
                key={s.id}
                onPress={() => router.push({ pathname: '/salon/[id]', params: { id: s.id } })}
                scaleTo={0.985}
                accessibilityLabel={s.name}
                style={[
                  styles.row,
                  i < saved.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                ]}
              >
                <SalonPhoto salon={s} width={48} height={48} radius={radius.sm} />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text variant="caption" tone="soft" numberOfLines={1}>
                    {i18n.tx(s.kind)} · {s.district}
                  </Text>
                </View>
                <RatingInline rating={live.rating} size="sm" />
                <ChevronRight size={18} color={c.inkMuted} strokeWidth={2} />
              </PressableScale>
            );
          })}
        </View>
      )}

      <Text variant="title" style={styles.sectionTitle} accessibilityRole="header">
        {i18n.t('language')}
      </Text>
      <SegmentedControl<LangChoice>
        value={locale ?? 'system'}
        onChange={(v) => setLocale(v === 'system' ? null : v)}
        options={[
          { value: 'system', label: i18n.t('system') },
          { value: 'az', label: 'AZ' },
          { value: 'ru', label: 'RU' },
          { value: 'en', label: 'EN' },
        ]}
      />

      <Text variant="title" style={styles.sectionTitle} accessibilityRole="header">
        {i18n.t('appearance')}
      </Text>
      <SegmentedControl<Appearance>
        value={appearance}
        onChange={setAppearance}
        options={[
          { value: 'system', label: i18n.t('system') },
          { value: 'light', label: i18n.t('light') },
          { value: 'dark', label: i18n.t('dark') },
        ]}
      />

      <View style={styles.colophon}>
        <Wordmark size={30} color={c.inkMuted} />
        <Text variant="caption" tone="muted" align="center">
          {i18n.t('colophon')}
        </Text>
      </View>
    </ScrollView>
  );
}

function Hint({ icon: Icon, text }: { icon: typeof Heart; text: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.hint, { borderColor: c.lineStrong }]}>
      <Icon size={18} color={c.inkSoft} strokeWidth={2} />
      <Text variant="subhead" tone="soft" style={{ flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }} accessible accessibilityLabel={`${value} ${label}`}>
      <Text variant="stat">{value}</Text>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  nameInput: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, padding: 0, minHeight: 32, letterSpacing: -0.4 },
  stats: { flexDirection: 'row', marginTop: 22, paddingVertical: 16, borderRadius: radius.lg },
  statDivider: { width: StyleSheet.hairlineWidth },
  sectionTitle: { marginTop: 32, marginBottom: 12 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.lg },
  list: { borderRadius: radius.lg, paddingHorizontal: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  colophon: { alignItems: 'center', gap: 8, marginTop: 44, paddingHorizontal: 32 },
});
