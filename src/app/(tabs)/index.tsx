import { router } from 'expo-router';
import { ChevronRight, Clock3, MapPin, Search, UserCheck, UserPlus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompareTray } from '@/components/CompareTray';
import { SalonCard } from '@/components/SalonCard';
import { SalonRow } from '@/components/SalonRow';
import { SlotCard } from '@/components/SlotCard';
import { StatusScrim } from '@/components/StatusScrim';
import { useTabBarInset } from '@/components/TabBar';
import { Avatar } from '@/components/ui/Avatar';
import { PressableScale } from '@/components/ui/PressableScale';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { Wordmark } from '@/components/ui/Wordmark';
import { categories } from '@/data/categories';
import { openToday } from '@/data/find';
import { categoryIcon } from '@/data/icons';
import { rankForMap, topRated } from '@/data/ranking';
import { salonById, salons } from '@/data/salons';
import type { Booking, CategoryId, Master, Salon } from '@/data/types';
import { useOrigin } from '@/hooks/useOrigin';
import { useI18n } from '@/i18n';
import { firstName } from '@/lib/format';
import { fmtClock, minutesOfDay } from '@/lib/time';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, iconStroke, radius, shadow } from '@/theme/tokens';

const CARD_W = 264;
const SLOT_W = 172;
const TODAY_KEYS: Record<CategoryId | 'all', string[]> = {
  all: ['fade', 'gel', 'cut', 'blow', 'lami', 'beard'],
  barber: ['fade', 'cut', 'beard', 'shave', 'combo'],
  hair: ['blow', 'wcut', 'colour'],
  nails: ['gel', 'mani', 'pedi'],
  brows: ['lami', 'brow', 'lash'],
  spa: ['massage', 'hammam', 'facial'],
  makeup: ['evening'],
};

export default function Discover() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const { origin, source } = useOrigin();
  const localReviews = useStore((s) => s.reviews);
  const bookings = useStore((s) => s.bookings);
  const name = useStore((s) => s.name);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [now] = useState(() => new Date());

  const nearby = useMemo(
    () => rankForMap({ salons, localReviews, origin, priceLevels: [], category, sort: 'best' }).slice(0, 8),
    [localReviews, origin, category],
  );
  const chart = useMemo(() => topRated(salons, localReviews, category).slice(0, 5), [localReviews, category]);
  const today = useMemo(
    () =>
      openToday({
        salons: category ? salons.filter((s) => s.categories.includes(category)) : salons,
        serviceKeys: TODAY_KEYS[category ?? 'all'],
        origin,
        bookings,
        localReviews,
        now,
        limit: 6,
      }),
    [category, origin, bookings, localReviews, now],
  );
  const masters = useMemo(() => mastersInDemand(category), [category]);

  const next = bookings
    .filter((b) => b.status === 'upcoming' && new Date(b.start) > now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: bottom + 64 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Wordmark size={26} />
          <PressableScale
            onPress={() => router.navigate('/map')}
            accessibilityLabel={source === 'device' ? i18n.t('nearYou') : i18n.t('centralBaku')}
            style={[styles.place, { backgroundColor: c.surface, borderColor: c.line }]}
          >
            <MapPin size={14} color={c.ink} strokeWidth={2} />
            <Text variant="captionStrong">{source === 'device' ? i18n.t('nearYou') : i18n.t('centralBaku')}</Text>
          </PressableScale>
        </View>

        <View style={styles.hero}>
          <Text variant="subhead" tone="soft">
            {i18n.greeting(now)}
            {name ? `, ${name}` : ''}
          </Text>
          <Text variant="largeTitle" accessibilityRole="header">
            {i18n.t('discoverTitle')}
          </Text>
        </View>

        <View style={[styles.searchCard, { backgroundColor: c.surface }, shadow(c, 1)]}>
          <PressableScale
            onPress={() => router.push('/search')}
            scaleTo={0.99}
            accessibilityLabel={i18n.t('searchPlaceholder')}
            style={styles.searchRow}
          >
            <Search size={20} color={c.ink} strokeWidth={2} />
            <Text variant="body" tone="muted" style={{ flex: 1 }}>
              {i18n.t('searchPlaceholder')}
            </Text>
          </PressableScale>
          <View style={[styles.hair, { backgroundColor: c.line }]} />
          <PressableScale
            onPress={() => router.push('/find')}
            scaleTo={0.99}
            accessibilityLabel={i18n.t('findSlot')}
            style={styles.searchRow}
          >
            <Clock3 size={20} color={c.ink} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{i18n.t('findSlot')}</Text>
              <Text variant="caption" tone="muted">
                {i18n.t('findSlotHint')}
              </Text>
            </View>
            <ChevronRight size={18} color={c.inkMuted} strokeWidth={2} />
          </PressableScale>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
          {categories.map((cat) => {
            const Icon = categoryIcon[cat.id];
            const selected = category === cat.id;
            return (
              <PressableScale
                key={cat.id}
                onPress={() => setCategory(selected ? null : cat.id)}
                haptic="selection"
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={i18n.tx(cat.label)}
                style={styles.cat}
              >
                <View
                  style={[
                    styles.catIcon,
                    { backgroundColor: selected ? c.primary : c.surface, borderColor: selected ? c.primary : c.line },
                  ]}
                >
                  <Icon size={24} color={selected ? c.onPrimary : c.ink} strokeWidth={1.8} />
                </View>
                <Text variant="captionStrong" align="center" numberOfLines={2} style={{ width: 76 }}>
                  {i18n.tx(cat.label)}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>

        {next ? <NextUp booking={next} /> : null}

        {today.length ? (
          <>
            <SectionHeader
              title={i18n.t('availableToday')}
              subtitle={i18n.t('availableTodaySub')}
              action={{ label: i18n.t('seeAll'), onPress: () => router.push('/find') }}
              style={styles.section}
            />
            <FlatList
              horizontal
              data={today}
              keyExtractor={(s) => `${s.salon.id}-${s.time}`}
              renderItem={({ item }) => <SlotCard slot={item} width={SLOT_W} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
              style={{ overflow: 'visible' }}
            />
          </>
        ) : null}

        <SectionHeader
          title={i18n.t('nearbyTitle')}
          action={{ label: i18n.t('tabMap'), onPress: () => router.navigate('/map') }}
          style={styles.section}
        />
        <FlatList
          horizontal
          data={nearby}
          keyExtractor={(i) => i.salon.id}
          renderItem={({ item, index }) => (
            <SalonCard item={item} width={CARD_W} badge={index === 0 ? i18n.t('bestMatch') : undefined} />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          snapToInterval={CARD_W + 14}
          decelerationRate="fast"
          ListEmptyComponent={<Text tone="soft">{i18n.t('nothingInCategory')}</Text>}
        />

        <SectionHeader
          title={i18n.t('topRated')}
          action={{
            label: i18n.t('seeAll'),
            onPress: () => router.push({ pathname: '/top-rated', params: category ? { category } : {} }),
          }}
          style={styles.section}
        />
        <View style={{ marginTop: 4 }}>
          {chart.map((item, i) => (
            <SalonRow key={item.salon.id} item={item} rank={i + 1} last={i === chart.length - 1} />
          ))}
        </View>

        <SectionHeader title={i18n.t('mastersTitle')} style={styles.section} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
          {masters.map(({ master, salon }) => (
            <MasterCard key={master.id} master={master} salon={salon} />
          ))}
        </ScrollView>

        <Text variant="caption" tone="muted" align="center" style={styles.footer}>
          {i18n.t('rankingNote')}
        </Text>
      </ScrollView>
      <StatusScrim />
      <CompareTray bottom={bottom - 12} />
    </View>
  );
}

function mastersInDemand(category: CategoryId | null) {
  return salons
    .filter((s) => !category || s.categories.includes(category))
    .flatMap((salon) =>
      salon.masters
        .filter((m) => !category || salon.services.some((s) => s.category === category && m.serviceIds.includes(s.id)))
        .map((master) => ({ master, salon })),
    )
    .sort((a, b) => b.master.rating * Math.log(b.master.reviewCount) - a.master.rating * Math.log(a.master.reviewCount))
    .slice(0, 8);
}

function MasterCard({ master, salon }: { master: Master; salon: Salon }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const following = useStore((s) => s.followed.includes(master.id));
  const toggleFollow = useStore((s) => s.toggleFollow);
  const FollowIcon = following ? UserCheck : UserPlus;
  return (
    <View style={[styles.master, { backgroundColor: c.surface }, shadow(c, 1)]}>
      <PressableScale
        onPress={() => router.push({ pathname: '/book/[id]', params: { id: salon.id, master: master.id } })}
        accessibilityLabel={`${master.name}, ${i18n.tx(master.role)}, ${salon.name}`}
        style={styles.masterTop}
      >
        <Avatar name={master.name} tone={master.tone} size={56} />
        <View style={{ gap: 1, alignItems: 'center' }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {firstName(master.name)}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1} style={{ maxWidth: 124 }}>
            {salon.name}
          </Text>
        </View>
        <RatingInline rating={master.rating} size="sm" />
      </PressableScale>
      <PressableScale
        onPress={() => toggleFollow(master.id)}
        haptic="selection"
        accessibilityRole="button"
        accessibilityState={{ selected: following }}
        accessibilityLabel={following ? i18n.t('following') : i18n.t('follow')}
        style={[styles.follow, { backgroundColor: following ? c.sunken : c.primary }]}
      >
        <FollowIcon size={14} color={following ? c.ink : c.onPrimary} strokeWidth={2.2} />
        <Text variant="captionStrong" style={{ color: following ? c.ink : c.onPrimary }}>
          {following ? i18n.t('following') : i18n.t('follow')}
        </Text>
      </PressableScale>
    </View>
  );
}

function NextUp({ booking }: { booking: Booking }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const salon = salonById(booking.salonId);
  if (!salon) return null;
  const start = new Date(booking.start);
  const master = salon.masters.find((m) => m.id === booking.masterId);
  const service = salon.services.find((s) => s.id === booking.serviceIds[0]);
  return (
    <PressableScale
      onPress={() => router.navigate('/bookings')}
      scaleTo={0.985}
      accessibilityLabel={`${i18n.t('nextUp')}: ${i18n.relativeDay(start)} ${fmtClock(minutesOfDay(start))}, ${salon.name}`}
      style={[styles.next, { backgroundColor: c.primary }]}
    >
      <View style={[styles.nextDate, { backgroundColor: c.onPrimary }]}>
        <Text variant="micro" style={{ color: c.primary }}>
          {i18n.weekdayShort(start)}
        </Text>
        <Text style={{ fontFamily: fonts.bold, fontSize: 22, lineHeight: 26, color: c.primary }}>
          {start.getDate()}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" style={{ color: c.onPrimary, opacity: 0.7 }}>
          {i18n.t('nextUp')} · {i18n.relativeDay(start)}
        </Text>
        <Text variant="headline" style={{ color: c.onPrimary }} numberOfLines={1}>
          {fmtClock(minutesOfDay(start))} · {salon.name}
        </Text>
        <Text variant="caption" style={{ color: c.onPrimary, opacity: 0.75 }} numberOfLines={1}>
          {service ? i18n.tx(service.name) : ''}
          {booking.serviceIds.length > 1 ? ` +${booking.serviceIds.length - 1}` : ''} ·{' '}
          {master ? firstName(master.name) : ''}
        </Text>
      </View>
      <ChevronRight size={20} color={c.onPrimary} strokeWidth={iconStroke} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: gutter },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hero: { paddingHorizontal: gutter, marginTop: 22, gap: 2 },
  searchCard: { marginHorizontal: gutter, marginTop: 18, borderRadius: radius.lg, paddingHorizontal: 16 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 10 },
  hair: { height: StyleSheet.hairlineWidth, marginLeft: 32 },
  cats: { paddingHorizontal: gutter - 4, gap: 4, paddingTop: 22 },
  cat: { alignItems: 'center', gap: 6 },
  catIcon: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 32, marginBottom: 14 },
  rail: { paddingHorizontal: gutter, gap: 14 },
  master: {
    width: 156,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    alignItems: 'center',
    gap: 10,
  },
  masterTop: { alignItems: 'center', gap: 8, alignSelf: 'stretch' },
  follow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  next: {
    marginHorizontal: gutter,
    marginTop: 22,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nextDate: { width: 50, height: 56, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: 32, paddingHorizontal: 36 },
});
