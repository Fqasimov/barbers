import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
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
import { SalonPhoto } from '@/components/SalonPhoto';
import { goBack } from '@/components/ScreenHeader';
import { ServiceRow } from '@/components/ServiceRow';
import { toast } from '@/components/Toaster';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { nextAvailable } from '@/data/availability';
import { categoryById, priceLabel } from '@/data/categories';
import { openState } from '@/data/ranking';
import { fromPrice } from '@/data/salons';
import type { Master, Salon } from '@/data/types';
import { useOrigin } from '@/hooks/useOrigin';
import { useDistribution, useLiveRating, useSalon, useSalonReviews } from '@/hooks/useSalon';
import { useI18n } from '@/i18n';
import { callSalon, messageSalon, openDirections, shareSalon } from '@/lib/actions';
import { distanceKm, walkMinutes } from '@/lib/geo';
import { fmtClock, minutesOfDay } from '@/lib/time';
import { isCompleted, useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, radius, shadow } from '@/theme/tokens';

type Tab = 'services' | 'masters' | 'reviews' | 'about';
const HERO_H = 320;
const TAB_FADE = FadeIn.duration(140);

export default function SalonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const salon = useSalon(id);
  if (!salon) return <NotFound />;
  return <SalonDetail salon={salon} />;
}

function SalonDetail({ salon }: { salon: Salon }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { origin } = useOrigin();
  const live = useLiveRating(salon);
  const saved = useStore((s) => s.favorites.includes(salon.id));
  const comparing = useStore((s) => s.compare.includes(salon.id));
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const [tab, setTab] = useState<Tab>('services');
  const [selected, setSelected] = useState<string[]>([]);

  const distance = distanceKm(origin, salon.coords);
  const open = openState(salon);
  const english = salon.masters.some((m) => m.languages.includes('en'));

  const reduced = useReducedMotion();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.set(e.contentOffset.y);
  });

  // Parallax: the photo drifts at half speed and stretches on overscroll. Off for reduced motion.
  const heroStyle = useAnimatedStyle(() => {
    if (reduced) return { transform: [{ translateY: 0 }, { scale: 1 }] };
    const y = scrollY.get();
    return { transform: [{ translateY: y < 0 ? y / 2 : y * 0.45 }, { scale: y < 0 ? 1 + -y / HERO_H : 1 }] };
  });
  const headerBg = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [HERO_H - 150, HERO_H - 80], [0, 1], Extrapolation.CLAMP),
  }));
  const headerTitle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [HERO_H - 100, HERO_H - 50], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.get(), [HERO_H - 100, HERO_H - 50], [6, 0], Extrapolation.CLAMP) }],
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

  const onCompare = () => {
    const ok = toggleCompare(salon.id);
    if (!ok) toast(i18n.t('compareLimit'), 'info');
    else if (!comparing) toast(i18n.t('compareAdded'));
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        <View style={{ height: HERO_H, overflow: 'hidden' }}>
          <Animated.View style={heroStyle}>
            <SalonPhoto salon={salon} width={width} height={HERO_H} />
          </Animated.View>
        </View>

        <View style={[styles.sheet, { backgroundColor: c.bg }]}>
          <Text variant="largeTitle" accessibilityRole="header">
            {salon.name}
          </Text>
          <Text variant="subhead" tone="soft" style={{ marginTop: 4 }}>
            {i18n.tx(salon.kind)} · {salon.district} · {salon.address}
          </Text>

          <View style={styles.metaRow}>
            <RatingInline rating={live.rating} count={live.count} />
            <Text variant="subhead" tone="muted">
              ·
            </Text>
            <Text variant="subhead" tone="soft">
              {i18n.distance(distance)}
            </Text>
            <Text variant="subhead" tone="muted">
              ·
            </Text>
            <Text variant="subhead" tone="soft">
              {priceLabel(salon.priceLevel)}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.statusDot, { backgroundColor: open.open ? c.success : c.inkMuted }]} />
            <Text variant="callout" style={{ color: open.open ? c.success : c.inkSoft }}>
              {i18n.t(open.kind, { time: open.time ?? '' })}
            </Text>
            <Text variant="subhead" tone="muted">
              · {i18n.fromPrice(fromPrice(salon))}
            </Text>
          </View>

          {salon.womenOnly || english ? (
            <View style={styles.badges}>
              {salon.womenOnly ? <Badge label={i18n.t('womenOnly')} /> : null}
              {english ? <Badge label={i18n.t('englishSpoken')} /> : null}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Action icon={Phone} label={i18n.t('call')} onPress={() => callSalon(salon)} />
            <Action icon={MessageCircle} label={i18n.t('whatsapp')} onPress={() => messageSalon(salon)} />
            <Action icon={Navigation} label={i18n.t('directions')} onPress={() => openDirections(salon)} />
            <Action icon={Share2} label={i18n.t('share')} onPress={() => shareSalon(salon, i18n.tx(salon.tagline))} />
          </View>

          <SegmentedControl<Tab>
            variant="underline"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'services', label: i18n.t('tabServices') },
              { value: 'masters', label: i18n.t('tabMasters') },
              { value: 'reviews', label: i18n.t('tabReviews') },
              { value: 'about', label: i18n.t('tabAbout') },
            ]}
            style={{ marginTop: 24 }}
          />

          <Animated.View key={tab} entering={TAB_FADE}>
            {tab === 'services' ? <Services salon={salon} selected={selected} onToggle={toggle} /> : null}
            {tab === 'masters' ? <Masters salon={salon} onPick={(m) => book({ master: m.id })} /> : null}
            {tab === 'reviews' ? <Reviews salon={salon} /> : null}
            {tab === 'about' ? <About salon={salon} distance={distance} /> : null}
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
        <IconButton icon={ChevronLeft} label={i18n.t('back')} variant="float" onPress={goBack} />
        <Animated.View pointerEvents="none" style={[styles.headerTitle, headerTitle]}>
          <Text variant="headline" numberOfLines={1}>
            {salon.name}
          </Text>
        </Animated.View>
        <IconButton
          icon={ArrowLeftRight}
          label={comparing ? i18n.t('removeFromCompare') : i18n.t('addToCompare')}
          variant="float"
          active={comparing}
          activeColor={c.accent}
          onPress={onCompare}
        />
        <IconButton
          icon={Heart}
          label={saved ? i18n.t('unsave') : i18n.t('save')}
          variant="float"
          active={saved}
          activeColor={c.accent}
          haptic="light"
          onPress={() => toggleFavorite(salon.id)}
        />
      </View>

      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.surface, borderColor: c.line },
        ]}
      >
        {picked.length ? (
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="soft">
              {i18n.n(picked.length, 'service')} · {i18n.duration(minutes)}
            </Text>
            <Text variant="title">{i18n.price(total)}</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Text variant="caption" tone="soft">
              {open.open ? i18n.t('takingToday') : i18n.t('bookLater')}
            </Text>
            <Text variant="bodyStrong">{i18n.t('pickTime')}</Text>
          </View>
        )}
        <Button label={picked.length ? i18n.t('chooseTime') : i18n.t('book')} onPress={() => book()} />
      </View>
    </View>
  );
}

function Badge({ label }: { label: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: c.sunken }]}>
      <Text variant="captionStrong" tone="soft">
        {label}
      </Text>
    </View>
  );
}

function Action({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic="selection"
      accessibilityLabel={label}
      hitStyle={{ flex: 1 }}
      style={styles.action}
    >
      <View style={[styles.actionIcon, { backgroundColor: c.surface, borderColor: c.line }]}>
        <Icon size={20} color={c.ink} strokeWidth={1.9} />
      </View>
      <Text variant="captionStrong" numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

function Services({ salon, selected, onToggle }: { salon: Salon; selected: string[]; onToggle: (id: string) => void }) {
  const i18n = useI18n();
  const groups = salon.categories.map((cat) => ({ cat, items: salon.services.filter((s) => s.category === cat) }));
  return (
    <View style={{ paddingTop: 4 }}>
      {groups.map(({ cat, items }) => (
        <View key={cat} style={{ marginTop: 16 }}>
          {groups.length > 1 ? <Text variant="headline">{i18n.tx(categoryById[cat].label)}</Text> : null}
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
  const i18n = useI18n();
  const bookings = useStore((s) => s.bookings);
  const followed = useStore((s) => s.followed);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const [now] = useState(() => new Date());
  return (
    <View style={{ paddingTop: 16, gap: 12 }}>
      {salon.masters.map((m) => {
        const firstService = salon.services.find((s) => m.serviceIds.includes(s.id));
        const next = nextAvailable({ salon, master: m, durationMin: firstService?.durationMin ?? 45, bookings, now });
        const following = followed.includes(m.id);
        return (
          <View key={m.id} style={[styles.masterCard, { backgroundColor: c.surface }, shadow(c, 1)]}>
            <View style={styles.masterTop}>
              <Avatar name={m.name} tone={m.tone} size={52} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="headline">{m.name}</Text>
                <Text variant="subhead" tone="soft">
                  {i18n.tx(m.role)} · {i18n.t('experience', { years: i18n.n(m.years, 'year') })}
                </Text>
                <RatingInline rating={m.rating} count={m.reviewCount} size="sm" />
              </View>
              <IconButton
                icon={following ? UserCheck : UserPlus}
                label={following ? i18n.t('following') : i18n.t('follow')}
                active={following}
                activeColor={c.ink}
                size={40}
                onPress={() => toggleFollow(m.id)}
              />
            </View>
            <View style={[styles.masterBottom, { borderColor: c.line }]}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="muted">
                  {i18n.t('nextFree')}
                </Text>
                <Text variant="bodyStrong" style={{ color: next ? c.success : c.inkMuted }}>
                  {next ? `${i18n.relativeDay(next)}, ${fmtClock(minutesOfDay(next))}` : i18n.t('fullyBooked')}
                </Text>
              </View>
              <Button label={i18n.t('book')} size="sm" onPress={() => onPick(m)} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function Reviews({ salon }: { salon: Salon }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const live = useLiveRating(salon);
  const dist = useDistribution(salon);
  const reviews = useSalonReviews(salon.id);
  const bookings = useStore((s) => s.bookings);
  const reviewable = bookings
    .filter((b) => b.salonId === salon.id && !b.reviewed && isCompleted(b))
    .sort((a, b) => b.start.localeCompare(a.start))[0];
  return (
    <View style={{ paddingTop: 22 }}>
      <RatingSummary rating={live.rating} count={live.count} distribution={dist} />
      {reviewable ? (
        <Button
          label={i18n.t('rateVisit')}
          style={{ marginTop: 18 }}
          onPress={() => router.push({ pathname: '/review/[id]', params: { id: salon.id, booking: reviewable.id } })}
        />
      ) : (
        <View style={[styles.note, { backgroundColor: c.sunken }]}>
          <Text variant="caption" tone="soft">
            {i18n.t('reviewsAfterVisit')}
          </Text>
        </View>
      )}
      <View style={{ marginTop: 6 }}>
        {reviews.slice(0, 3).map((r, i, arr) => (
          <ReviewCard key={r.id} review={r} salon={salon} last={i === arr.length - 1} />
        ))}
      </View>
      <Button
        label={i18n.t('readAll')}
        variant="secondary"
        size="md"
        iconRight={ChevronRight}
        onPress={() => router.push({ pathname: '/reviews/[id]', params: { id: salon.id } })}
      />
    </View>
  );
}

function About({ salon, distance }: { salon: Salon; distance: number }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const today = new Date().getDay();
  const days = [1, 2, 3, 4, 5, 6, 0];
  return (
    <View style={{ paddingTop: 20, gap: 26 }}>
      <Text variant="body" style={{ fontSize: 16, lineHeight: 24 }}>
        {i18n.tx(salon.about)}
      </Text>

      <View>
        <Text variant="headline" style={{ marginBottom: 6 }}>
          {i18n.t('openingHours')}
        </Text>
        {days.map((d) => {
          const closed = salon.closedDays.includes(d);
          const isToday = d === today;
          const date = new Date();
          date.setDate(date.getDate() + ((d - today + 7) % 7));
          return (
            <View key={d} style={[styles.hoursRow, { borderColor: c.line }]}>
              <Text variant="subhead" style={isToday && { fontFamily: fonts.semibold }}>
                {i18n.weekdayLong(date)}
                {isToday ? ` · ${i18n.t('todaySuffix')}` : ''}
              </Text>
              <Text variant="subhead" tone={closed ? 'muted' : 'ink'} style={{ fontVariant: ['tabular-nums'] }}>
                {closed ? i18n.t('closed') : `${salon.hours.open} – ${salon.hours.close}`}
              </Text>
            </View>
          );
        })}
      </View>

      <View>
        <Text variant="headline" style={{ marginBottom: 10 }}>
          {i18n.t('goodToKnow')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {salon.amenities.map((a) => (
            <View key={a.en} style={[styles.amenity, { backgroundColor: c.surface, borderColor: c.line }]}>
              <Text variant="caption">{i18n.tx(a)}</Text>
            </View>
          ))}
        </View>
      </View>

      <PressableScale
        onPress={() => openDirections(salon)}
        scaleTo={0.985}
        accessibilityLabel={`${i18n.t('directions')}: ${salon.address}`}
        style={[styles.addressCard, { backgroundColor: c.surface }, shadow(c, 1)]}
      >
        <View style={[styles.addressIcon, { backgroundColor: c.sunken }]}>
          <MapPin size={18} color={c.ink} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{salon.address}</Text>
          <Text variant="caption" tone="soft">
            {salon.district} · {i18n.t('walk', { n: walkMinutes(distance) })} · {salon.phone}
          </Text>
        </View>
        <ChevronRight size={18} color={c.inkMuted} strokeWidth={2} />
      </PressableScale>
    </View>
  );
}

function NotFound() {
  const i18n = useI18n();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }}>
      <Text variant="title" align="center">
        {i18n.t('notFound')}
      </Text>
      <Button label={i18n.t('backToDiscover')} variant="secondary" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginTop: -20,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: gutter,
    paddingTop: 22,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 12, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  actions: { flexDirection: 'row', gap: 8, marginTop: 20 },
  action: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: gutter,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: { flex: 1, alignItems: 'center' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: gutter,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  masterCard: { borderRadius: radius.lg, padding: 14 },
  masterTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  masterBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  note: { marginTop: 18, padding: 12, borderRadius: radius.md },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  amenity: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg },
  addressIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
