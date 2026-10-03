import { router } from 'expo-router';
import { ArrowUpRight, MapPin, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RankRow } from '@/components/RankRow';
import { SalonCard } from '@/components/SalonCard';
import { useTabBarInset } from '@/components/TabBar';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { categories } from '@/data/categories';
import { rankForMap, topRated } from '@/data/ranking';
import { salonById, salons } from '@/data/salons';
import type { CategoryId, Master, Salon } from '@/data/types';
import { useOrigin } from '@/hooks/useOrigin';
import { firstName } from '@/lib/format';
import { fmtClock, greeting, minutesOfDay, monthShort, relativeDay, weekdayShort } from '@/lib/time';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, iconStroke, radius } from '@/theme/tokens';

const CARD_W = 232;

export default function Discover() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = useTabBarInset();
  const { origin, source } = useOrigin();
  const localReviews = useStore((s) => s.reviews);
  const bookings = useStore((s) => s.bookings);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const now = new Date();

  const nearby = useMemo(
    () => rankForMap({ salons, localReviews, origin, priceLevels: [], category, sort: 'best' }).slice(0, 8),
    [localReviews, origin, category],
  );
  const chart = useMemo(() => topRated(salons, localReviews, category).slice(0, 5), [localReviews, category]);
  const masters = useMemo(() => mastersInDemand(category), [category]);

  const next = bookings
    .filter((b) => b.status === 'upcoming' && new Date(b.start) > now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: bottom }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topRow}>
        <View style={styles.place}>
          <MapPin size={14} color={c.accent} strokeWidth={iconStroke} />
          <Text variant="label" tone="soft">
            {source === 'device' ? 'Near you' : 'Central Baku'}
          </Text>
        </View>
        <Text variant="label" tone="muted">
          {weekdayShort(now)} {now.getDate()} {monthShort(now)}
        </Text>
      </View>

      <View style={styles.hero}>
        <Text variant="hero" tone="soft" accessibilityRole="header">
          {greeting(now)},
        </Text>
        <Text variant="hero">
          find your{' '}
          <Text variant="hero" italic tone="accent">
            usta.
          </Text>
        </Text>
      </View>

      <PressableScale
        onPress={() => router.push('/search')}
        scaleTo={0.985}
        accessibilityLabel="Search salons, services or masters"
        style={[styles.search, { backgroundColor: c.surface, borderColor: c.line }]}
      >
        <Search size={18} color={c.inkSoft} strokeWidth={iconStroke} />
        <Text variant="body" tone="muted">
          Salons, services or masters
        </Text>
      </PressableScale>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.label}
            selected={category === cat.id}
            onPress={() => setCategory(category === cat.id ? null : cat.id)}
          />
        ))}
      </ScrollView>

      {next ? (
        <NextUp
          bookingStart={next.start}
          salonId={next.salonId}
          masterId={next.masterId}
          serviceIds={next.serviceIds}
        />
      ) : null}

      <SectionHeader
        overline={source === 'device' ? 'Close to you' : 'Around the centre'}
        title="Highly rated, nearby"
        action={{ label: 'Map', onPress: () => router.push('/map') }}
        style={styles.section}
      />
      <FlatList
        horizontal
        data={nearby}
        keyExtractor={(i) => i.salon.id}
        renderItem={({ item, index }) => (
          <SalonCard item={item} width={CARD_W} badge={index === 0 ? 'Best match' : undefined} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        ItemSeparatorComponent={() => <View style={{ width: 14 }} />}
        snapToInterval={CARD_W + 14}
        decelerationRate="fast"
        ListEmptyComponent={<Text tone="soft">Nothing in this category yet.</Text>}
      />

      <SectionHeader
        overline="The list"
        title="Top rated in Baku"
        action={{
          label: 'All',
          onPress: () => router.push({ pathname: '/top-rated', params: category ? { category } : {} }),
        }}
        style={styles.section}
      />
      <View style={{ marginTop: 6 }}>
        {chart.map((item, i) => (
          <RankRow key={item.salon.id} item={item} rank={i + 1} last={i === chart.length - 1} />
        ))}
      </View>

      <SectionHeader overline="In demand" title="Masters people rebook" style={styles.section} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {masters.map(({ master, salon }) => (
          <MasterCard key={master.id} master={master} salon={salon} />
        ))}
      </ScrollView>

      <Text variant="caption" tone="muted" align="center" style={styles.footer}>
        Ratings combine every verified visit. Rankings weigh volume, so one five-star review can’t top the list.
      </Text>
    </ScrollView>
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
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/book/[id]', params: { id: salon.id, master: master.id } })}
      accessibilityLabel={`Book ${master.name}, ${master.role} at ${salon.name}`}
      style={[styles.master, { backgroundColor: c.surface, borderColor: c.line }]}
    >
      <Avatar name={master.name} tone={master.tone} size={52} />
      <View style={{ gap: 2, alignItems: 'center' }}>
        <Text variant="serif" numberOfLines={1}>
          {firstName(master.name)}
        </Text>
        <Text variant="caption" tone="soft" numberOfLines={1} style={{ maxWidth: 120 }}>
          {salon.name}
        </Text>
      </View>
      <RatingInline rating={master.rating} size="sm" />
    </PressableScale>
  );
}

function NextUp({
  bookingStart,
  salonId,
  masterId,
  serviceIds,
}: {
  bookingStart: string;
  salonId: string;
  masterId: string;
  serviceIds: string[];
}) {
  const { c } = useTheme();
  const salon = salonById(salonId);
  if (!salon) return null;
  const start = new Date(bookingStart);
  const master = salon.masters.find((m) => m.id === masterId);
  const service = salon.services.find((s) => s.id === serviceIds[0]);
  return (
    <PressableScale
      onPress={() => router.push('/bookings')}
      scaleTo={0.985}
      accessibilityLabel={`Next appointment ${relativeDay(start)} at ${fmtClock(minutesOfDay(start))}, ${salon.name}`}
      style={[styles.next, { backgroundColor: c.primary }]}
    >
      <View style={[styles.nextDate, { borderColor: c.onPrimary + '33' }]}>
        <Text variant="label" style={{ color: c.onPrimary, opacity: 0.7 }}>
          {weekdayShort(start)}
        </Text>
        <Text style={{ fontFamily: fonts.displayLight, fontSize: 30, lineHeight: 34, color: c.onPrimary }}>
          {start.getDate()}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" style={{ color: c.onPrimary, opacity: 0.7 }}>
          Next up · {relativeDay(start)}
        </Text>
        <Text variant="headline" style={{ color: c.onPrimary }} numberOfLines={1}>
          {fmtClock(minutesOfDay(start))} at {salon.name}
        </Text>
        <Text variant="caption" style={{ color: c.onPrimary, opacity: 0.75 }} numberOfLines={1}>
          {service?.name}
          {serviceIds.length > 1 ? ` +${serviceIds.length - 1}` : ''} with{' '}
          {master ? firstName(master.name) : 'your master'}
        </Text>
      </View>
      <ArrowUpRight size={20} color={c.onPrimary} strokeWidth={iconStroke} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: gutter },
  place: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hero: { paddingHorizontal: gutter, marginTop: 28 },
  search: {
    marginHorizontal: gutter,
    marginTop: 24,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
  },
  chips: { paddingHorizontal: gutter, gap: 8, paddingTop: 16 },
  section: { marginTop: 40, marginBottom: 16 },
  rail: { paddingHorizontal: gutter, gap: 12 },
  master: {
    width: 148,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 10,
  },
  next: {
    marginHorizontal: gutter,
    marginTop: 24,
    borderRadius: radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nextDate: {
    width: 58,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: 36, paddingHorizontal: 40 },
});
