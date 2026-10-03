import { router } from 'expo-router';
import { ArrowUpRight, LocateFixed, SearchX } from 'lucide-react-native';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapCanvas } from '@/components/map/MapCanvas';
import { SalonCover } from '@/components/SalonCover';
import { Dot } from '@/components/SalonCard';
import { useTabBarInset } from '@/components/TabBar';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { RatingInline } from '@/components/ui/Stars';
import { Text } from '@/components/ui/Text';
import { categories, priceLevels } from '@/data/categories';
import { openState, rankForMap, type MapSort, type RankedSalon } from '@/data/ranking';
import { fromPrice, salons } from '@/data/salons';
import type { CategoryId, PriceLevel } from '@/data/types';
import { useOrigin } from '@/hooks/useOrigin';
import { fmtPrice, plural } from '@/lib/format';
import { fmtDistance } from '@/lib/geo';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, iconStroke, radius } from '@/theme/tokens';

const GAP = 10;
const CARD_H = 112;
const sortLabel: Record<MapSort, string> = {
  best: 'best match first',
  nearest: 'nearest first',
  rating: 'highest rated first',
};

export default function MapScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const { width } = useWindowDimensions();
  const { origin, source, request, status } = useOrigin();
  const localReviews = useStore((s) => s.reviews);

  const [sort, setSort] = useState<MapSort>('best');
  const [prices, setPrices] = useState<PriceLevel[]>([]);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelH, setPanelH] = useState(170);
  const listRef = useRef<FlatList<RankedSalon>>(null);

  const items = useMemo(
    () => rankForMap({ salons, localReviews, origin, priceLevels: prices, category, sort }),
    [localReviews, origin, prices, category, sort],
  );

  // New filters → focus the new winner (state adjusted during render, not in an effect).
  const [rankedFor, setRankedFor] = useState<RankedSalon[] | null>(null);
  if (rankedFor !== items) {
    setRankedFor(items);
    setActiveId(items[0]?.salon.id ?? null);
  }
  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [items]);

  const cardW = Math.min(width - gutter * 2 - 28, 420);
  const snap = cardW + GAP;

  const togglePrice = (level: PriceLevel) =>
    setPrices((cur) => (cur.includes(level) ? cur.filter((l) => l !== level) : [...cur, level].sort()));

  const select = (id: string) => {
    setActiveId(id);
    const index = items.findIndex((i) => i.salon.id === id);
    if (index >= 0) listRef.current?.scrollToOffset({ offset: index * snap, animated: true });
  };

  const bottomOverlay = tabInset + CARD_H + 16;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <MapCanvas
        items={items}
        activeId={activeId}
        origin={origin}
        showsUser={source === 'device'}
        onSelect={select}
        insets={{ top: insets.top + panelH, bottom: bottomOverlay }}
      />

      <View
        style={[styles.panel, { top: insets.top + 8, backgroundColor: c.glass, borderColor: c.line }]}
        onLayout={(e) => setPanelH(e.nativeEvent.layout.height + 8)}
      >
        <SegmentedControl<MapSort>
          value={sort}
          onChange={setSort}
          options={[
            { value: 'best', label: 'Best match' },
            { value: 'nearest', label: 'Nearest' },
            { value: 'rating', label: 'Top rated' },
          ]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {priceLevels.map((p) => (
            <Chip
              key={p.level}
              size="sm"
              serif
              label={p.label}
              accessibilityLabel={`${p.hint} prices`}
              selected={prices.includes(p.level)}
              onPress={() => togglePrice(p.level)}
            />
          ))}
          <View style={[styles.divider, { backgroundColor: c.lineStrong }]} />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              size="sm"
              label={cat.label}
              selected={category === cat.id}
              onPress={() => setCategory(category === cat.id ? null : cat.id)}
            />
          ))}
        </ScrollView>
        <Text variant="mono" tone="soft" style={{ fontSize: 11, paddingHorizontal: 4 }}>
          {plural(items.length, 'place')} · {sortLabel[sort]}
          {prices.length ? ` · ${prices.map((p) => '₼'.repeat(p)).join(' ')}` : ''}
        </Text>
      </View>

      <View pointerEvents="box-none" style={[styles.locate, { bottom: bottomOverlay + 8 }]}>
        <IconButton
          icon={LocateFixed}
          label={source === 'device' ? 'Centred on you' : 'Use my location'}
          variant="glass"
          active={source === 'device'}
          activeColor={c.accent}
          onPress={request}
        />
      </View>
      {source === 'city' && status === 'denied' ? (
        <View pointerEvents="none" style={[styles.note, { bottom: bottomOverlay + 14, backgroundColor: c.glass }]}>
          <Text variant="caption" tone="soft">
            Location off — distances from Fountain Square
          </Text>
        </View>
      ) : null}

      <View style={[styles.rail, { bottom: tabInset }]}>
        {items.length ? (
          <FlatList
            ref={listRef}
            horizontal
            data={items}
            keyExtractor={(i) => i.salon.id}
            renderItem={({ item, index }) => (
              <MapCard
                item={item}
                width={cardW}
                best={index === 0 && sort === 'best'}
                active={item.salon.id === activeId}
              />
            )}
            showsHorizontalScrollIndicator={false}
            snapToInterval={snap}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP }}
            getItemLayout={(_, index) => ({ length: snap, offset: snap * index, index })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / snap);
              const item = items[Math.max(0, Math.min(items.length - 1, index))];
              if (item) setActiveId(item.salon.id);
            }}
          />
        ) : (
          <Animated.View
            entering={FadeIn.duration(180)}
            style={[styles.empty, { backgroundColor: c.surface, borderColor: c.line, marginHorizontal: gutter }]}
          >
            <SearchX size={22} color={c.inkSoft} strokeWidth={iconStroke} />
            <View style={{ flex: 1 }}>
              <Text variant="serif">Nothing in that range</Text>
              <Text variant="caption" tone="soft">
                Widen the price range or clear the category.
              </Text>
            </View>
            <Button
              label="Reset"
              size="sm"
              variant="secondary"
              onPress={() => {
                setPrices([]);
                setCategory(null);
              }}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const MapCard = memo(function MapCard({
  item,
  width,
  best,
  active,
}: {
  item: RankedSalon;
  width: number;
  best: boolean;
  active: boolean;
}) {
  const { c } = useTheme();
  const { salon, live, distance } = item;
  const open = openState(salon);
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/salon/[id]', params: { id: salon.id } })}
      scaleTo={0.98}
      accessibilityLabel={`${best ? 'Best pick near you. ' : ''}${salon.name}, ${fmtDistance(distance)}, from ${fromPrice(salon)} manat`}
      style={[
        styles.card,
        { width, backgroundColor: c.surface, borderColor: active ? c.lineStrong : c.line, shadowColor: '#000' },
      ]}
    >
      <SalonCover salon={salon} width={88} height={88} radius={radius.md} variant="thumb" />
      <View style={{ flex: 1, gap: 2 }}>
        {best ? (
          <Text variant="label" tone="accent" style={{ fontSize: 10 }}>
            Best pick near you
          </Text>
        ) : (
          <Text variant="label" tone="muted" style={{ fontSize: 10 }} numberOfLines={1}>
            {salon.kind} · {salon.district}
          </Text>
        )}
        <Text variant="serif" style={{ fontSize: 19 }} numberOfLines={1}>
          {salon.name}
        </Text>
        <View style={styles.meta}>
          <RatingInline rating={live.rating} size="sm" />
          <Dot />
          <Text variant="mono" tone="soft">
            {fmtDistance(distance)}
          </Text>
          <Dot />
          <Text variant="price" style={{ fontSize: 13, color: c.inkSoft }}>
            from {fmtPrice(fromPrice(salon))}
          </Text>
        </View>
        <Text variant="caption" style={{ color: open.open ? c.success : c.inkMuted, marginTop: 2 }}>
          {open.label}
        </Text>
      </View>
      <ArrowUpRight size={18} color={c.inkSoft} strokeWidth={iconStroke} style={{ alignSelf: 'flex-start' }} />
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    gap: 10,
    paddingBottom: 12,
  },
  chips: { gap: 6, alignItems: 'center', paddingHorizontal: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 20, marginHorizontal: 4 },
  locate: { position: 'absolute', right: gutter },
  note: { position: 'absolute', left: gutter, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  rail: { position: 'absolute', left: 0, right: 0, height: CARD_H },
  card: {
    height: CARD_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 4 },
  empty: {
    height: CARD_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
