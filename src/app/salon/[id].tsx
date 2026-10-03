import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, ChevronLeft, Heart, MapPin, Navigation, Phone, Share2 } from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeIn,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RatingSummary, ReviewCard } from '@/components/ReviewCard';
import { SalonCover } from '@/components/SalonCover';
import { goBack } from '@/components/ScreenHeader';
import { ServiceRow } from '@/components/ServiceRow';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RatingInline, Stars } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { nextAvailable } from '@/data/availability';
import { categoryById, priceLabel } from '@/data/categories';
import { openState } from '@/data/ranking';
import { fromPrice } from '@/data/salons';
import type { Master, Salon } from '@/data/types';
import { useOrigin } from '@/hooks/useOrigin';
import { useDistribution, useLiveRating, useSalon, useSalonReviews } from '@/hooks/useSalon';
import { callSalon, openDirections, shareSalon } from '@/lib/actions';
import { fmtPrice, fmtRating, plural } from '@/lib/format';
import { distanceKm, fmtDistance, walkMinutes } from '@/lib/geo';
import { fmtClock, fmtDuration, minutesOfDay, relativeDay, weekdayLong } from '@/lib/time';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, iconStroke, radius } from '@/theme/tokens';

type Tab = 'services' | 'masters' | 'reviews' | 'about';
const HERO_H = 400;
const TAB_FADE = FadeIn.duration(140);

export default function SalonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const salon = useSalon(id);
  if (!salon) return <NotFound />;
  return <SalonDetail salon={salon} />;
}

function SalonDetail({ salon }: { salon: Salon }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { origin } = useOrigin();
  const live = useLiveRating(salon);
  const saved = useStore((s) => s.favorites.includes(salon.id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const [tab, setTab] = useState<Tab>('services');
  const [selected, setSelected] = useState<string[]>([]);

  const distance = distanceKm(origin, salon.coords);
  const open = openState(salon);

  const reduced = useReducedMotion();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  // Parallax: the cover drifts at half speed, and stretches on overscroll. Off for reduced motion.
  const heroStyle = useAnimatedStyle(() => {
    if (reduced) return { transform: [{ translateY: 0 }, { scale: 1 }] };
    const y = scrollY.get();
    return {
      transform: [{ translateY: y < 0 ? y / 2 : y * 0.45 }, { scale: y < 0 ? 1 + -y / HERO_H : 1 }],
    };
  });
  const headerBg = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [HERO_H - 160, HERO_H - 90], [0, 1], Extrapolation.CLAMP),
  }));
  const headerTitle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [HERO_H - 110, HERO_H - 60], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.get(), [HERO_H - 110, HERO_H - 60], [6, 0], Extrapolation.CLAMP) }],
  }));

  const toggle = useCallback((sid: string) => {
    setSelected((cur) => (cur.includes(sid) ? cur.filter((x) => x !== sid) : [...cur, sid]));
  }, []);

  const picked = salon.services.filter((s) => selected.includes(s.id));
  const total = picked.reduce((a, s) => a + s.price, 0);
  const minutes = picked.reduce((a, s) => a + s.durationMin, 0);

  const book = (params: { master?: string } = {}) =>
    router.push({
      pathname: '/book/[id]',
      params: { id: salon.id, ...(selected.length ? { services: selected.join(',') } : {}), ...params },
    });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <Animated.View style={[{ height: HERO_H, overflow: 'hidden' }]}>
          <Animated.View style={heroStyle}>
            <SalonCover salon={salon} width={width} height={HERO_H} variant="hero" />
          </Animated.View>
        </Animated.View>

        <View style={[styles.sheet, { backgroundColor: c.bg }]}>
          <Text variant="label" tone="muted">
            {salon.kind} · {salon.district}
          </Text>
          <Text variant="display" style={{ marginTop: 8 }} accessibilityRole="header">
            {salon.name}
          </Text>
          <Text variant="serif" italic tone="soft" style={{ marginTop: 6 }}>
            {salon.tagline}
          </Text>

          <View style={[styles.stats, { borderColor: c.line }]}>
            <Stat
              big={fmtRating(live.rating)}
              small={plural(live.count, 'review')}
              accessory={<Stars rating={live.rating} size={9} gap={1} />}
              onPress={() => setTab('reviews')}
            />
            <View style={[styles.statDivider, { backgroundColor: c.line }]} />
            <Stat
              big={fmtDistance(distance)}
              small={`${walkMinutes(distance)} min walk`}
              onPress={() => openDirections(salon)}
            />
            <View style={[styles.statDivider, { backgroundColor: c.line }]} />
            <Stat big={priceLabel(salon.priceLevel)} small={`from ${fmtPrice(fromPrice(salon))}`} serifSmall />
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: open.open ? c.success : c.inkMuted }]} />
            <Text variant="callout" style={{ color: open.open ? c.success : c.inkSoft }}>
              {open.label}
            </Text>
            <Text variant="callout" tone="muted">
              ·
            </Text>
            <Text variant="callout" tone="soft" numberOfLines={1} style={{ flexShrink: 1 }}>
              {salon.address}
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              label="Call"
              icon={Phone}
              variant="secondary"
              size="sm"
              onPress={() => callSalon(salon)}
              haptic="selection"
            />
            <Button
              label="Directions"
              icon={Navigation}
              variant="secondary"
              size="sm"
              onPress={() => openDirections(salon)}
              haptic="selection"
            />
            <Button
              label="Share"
              icon={Share2}
              variant="secondary"
              size="sm"
              onPress={() => shareSalon(salon)}
              haptic="selection"
            />
          </View>

          <SegmentedControl<Tab>
            variant="underline"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'services', label: 'Services' },
              { value: 'masters', label: 'Masters' },
              { value: 'reviews', label: 'Reviews' },
              { value: 'about', label: 'About' },
            ]}
            style={{ marginTop: 28 }}
          />

          <Animated.View key={tab} entering={TAB_FADE}>
            {tab === 'services' ? <Services salon={salon} selected={selected} onToggle={toggle} /> : null}
            {tab === 'masters' ? <Masters salon={salon} onPick={(m) => book({ master: m.id })} /> : null}
            {tab === 'reviews' ? <Reviews salon={salon} /> : null}
            {tab === 'about' ? <About salon={salon} /> : null}
          </Animated.View>
        </View>
      </Animated.ScrollView>

      {/* Collapsing header: fixed height, only opacity/translate animate. */}
      <View pointerEvents="box-none" style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: c.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
            headerBg,
          ]}
        />
        <IconButton icon={ChevronLeft} label="Back" variant="glass" onPress={goBack} />
        <Animated.View pointerEvents="none" style={[styles.headerTitle, headerTitle]}>
          <Text variant="serif" numberOfLines={1}>
            {salon.name}
          </Text>
        </Animated.View>
        <IconButton
          icon={Heart}
          label={saved ? 'Remove from saved' : 'Save'}
          variant="glass"
          active={saved}
          activeColor={c.accent}
          haptic="light"
          onPress={() => toggleFavorite(salon.id)}
        />
      </View>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.bg, borderColor: c.line },
        ]}
      >
        {picked.length ? (
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="soft">
              {plural(picked.length, 'service')} · {fmtDuration(minutes)}
            </Text>
            <Text variant="price" style={{ fontSize: 22, lineHeight: 26 }}>
              {fmtPrice(total)}
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="soft">
              {open.open ? 'Taking bookings today' : 'Book for later this week'}
            </Text>
            <Text variant="serif">Pick a time that suits you</Text>
          </View>
        )}
        <Button label={picked.length ? 'Choose time' : 'Book'} iconRight={ArrowRight} onPress={() => book()} />
      </View>
    </View>
  );
}

function Stat({
  big,
  small,
  accessory,
  serifSmall,
  onPress,
}: {
  big: string;
  small: string;
  accessory?: ReactNode;
  serifSmall?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.stat}>
      <Text style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28 }}>{big}</Text>
      {accessory}
      <Text variant="caption" tone="soft" style={serifSmall && { fontFamily: fonts.display, fontSize: 14 }}>
        {small}
      </Text>
    </View>
  );
  return onPress ? (
    <PressableScale onPress={onPress} hitStyle={{ flex: 1 }} accessibilityLabel={`${big}, ${small}`}>
      {content}
    </PressableScale>
  ) : (
    <View style={{ flex: 1 }}>{content}</View>
  );
}

function Services({ salon, selected, onToggle }: { salon: Salon; selected: string[]; onToggle: (id: string) => void }) {
  const groups = salon.categories.map((cat) => ({ cat, items: salon.services.filter((s) => s.category === cat) }));
  return (
    <View style={{ paddingTop: 8 }}>
      {groups.map(({ cat, items }) => (
        <View key={cat} style={{ marginTop: 16 }}>
          {groups.length > 1 ? (
            <Text variant="label" tone="muted" style={{ marginBottom: 2 }}>
              {categoryById[cat].label}
            </Text>
          ) : null}
          {items.map((s, i) => (
            <ServiceRow
              key={s.id}
              service={s}
              selected={selected.includes(s.id)}
              onToggle={onToggle}
              last={i === items.length - 1}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function Masters({ salon, onPick }: { salon: Salon; onPick: (m: Master) => void }) {
  const { c } = useTheme();
  const bookings = useStore((s) => s.bookings);
  const now = new Date();
  return (
    <View style={{ paddingTop: 16, gap: 12 }}>
      {salon.masters.map((m) => {
        const firstService = salon.services.find((s) => m.serviceIds.includes(s.id));
        const next = nextAvailable({ salon, master: m, durationMin: firstService?.durationMin ?? 45, bookings, now });
        return (
          <PressableScale
            key={m.id}
            onPress={() => onPick(m)}
            scaleTo={0.985}
            accessibilityLabel={`${m.name}, ${m.role}. Book`}
            style={[styles.masterCard, { backgroundColor: c.surface, borderColor: c.line }]}
          >
            <Avatar name={m.name} tone={m.tone} size={56} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="serif" style={{ fontSize: 19 }}>
                {m.name}
              </Text>
              <Text variant="caption" tone="soft">
                {m.role} · {plural(m.years, 'year')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <RatingInline rating={m.rating} count={m.reviewCount} size="sm" />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text variant="label" tone="muted" style={{ fontSize: 9.5 }}>
                Next free
              </Text>
              <Text variant="callout" style={{ fontFamily: fonts.bodyMedium }}>
                {next ? relativeDay(next) : 'Fully booked'}
              </Text>
              {next ? (
                <Text variant="mono" tone="accent">
                  {fmtClock(minutesOfDay(next))}
                </Text>
              ) : null}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

function Reviews({ salon }: { salon: Salon }) {
  const live = useLiveRating(salon);
  const dist = useDistribution(salon);
  const reviews = useSalonReviews(salon.id);
  return (
    <View style={{ paddingTop: 24 }}>
      <RatingSummary rating={live.rating} count={live.count} distribution={dist} />
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
        <Button
          label="Write a review"
          variant="secondary"
          size="md"
          hitStyle={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/review/[id]', params: { id: salon.id } })}
        />
        <Button
          label="Read all"
          variant="ghost"
          size="md"
          iconRight={ArrowRight}
          onPress={() => router.push({ pathname: '/reviews/[id]', params: { id: salon.id } })}
        />
      </View>
      <View style={{ marginTop: 8 }}>
        {reviews.slice(0, 3).map((r, i, arr) => (
          <ReviewCard key={r.id} review={r} salon={salon} last={i === arr.length - 1} />
        ))}
      </View>
    </View>
  );
}

function About({ salon }: { salon: Salon }) {
  const { c } = useTheme();
  const today = new Date().getDay();
  // Monday-first week.
  const days = [1, 2, 3, 4, 5, 6, 0];
  return (
    <View style={{ paddingTop: 24, gap: 28 }}>
      <Text variant="body" style={{ fontSize: 16, lineHeight: 25 }}>
        {salon.about}
      </Text>

      <View>
        <Text variant="label" tone="muted" style={{ marginBottom: 8 }}>
          Opening hours
        </Text>
        {days.map((d) => {
          const closed = salon.closedDays.includes(d);
          const isToday = d === today;
          const date = new Date();
          date.setDate(date.getDate() + ((d - today + 7) % 7));
          return (
            <View key={d} style={[styles.hoursRow, { borderColor: c.line }]}>
              <Text variant="callout" style={isToday && { fontFamily: fonts.bodySemibold }}>
                {weekdayLong(date)}
                {isToday ? '  ·  Today' : ''}
              </Text>
              <Text variant="mono" tone={closed ? 'muted' : 'ink'}>
                {closed ? 'CLOSED' : `${salon.hours.open} – ${salon.hours.close}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View>
        <Text variant="label" tone="muted" style={{ marginBottom: 10 }}>
          Good to know
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {salon.amenities.map((a) => (
            <View key={a} style={[styles.amenity, { borderColor: c.lineStrong }]}>
              <Text variant="caption">{a}</Text>
            </View>
          ))}
        </View>
      </View>

      <PressableScale
        onPress={() => openDirections(salon)}
        scaleTo={0.985}
        accessibilityLabel={`Directions to ${salon.address}`}
        style={[styles.addressCard, { backgroundColor: c.surface, borderColor: c.line }]}
      >
        <View style={[styles.addressIcon, { backgroundColor: c.accentSoft }]}>
          <MapPin size={18} color={c.accent} strokeWidth={iconStroke} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium">{salon.address}</Text>
          <Text variant="caption" tone="soft">
            {salon.district}, Baku · {salon.phone}
          </Text>
        </View>
        <ArrowRight size={18} color={c.inkSoft} strokeWidth={iconStroke} />
      </PressableScale>
    </View>
  );
}

function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <Text variant="title" align="center">
        This place has closed its doors.
      </Text>
      <Button label="Back to Discover" variant="secondary" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginTop: -28,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    paddingHorizontal: gutter,
    paddingTop: 28,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 24,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stat: { alignItems: 'center', gap: 4 },
  statDivider: { width: StyleSheet.hairlineWidth },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 18, flexWrap: 'wrap' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: gutter,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: { flex: 1, alignItems: 'center' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 14,
    paddingHorizontal: gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  amenity: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  addressIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
