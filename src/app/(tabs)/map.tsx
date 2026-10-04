import { router } from 'expo-router';
import { ChevronRight, LocateFixed, SearchX } from 'lucide-react-native';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapCanvas } from '@/components/map/MapCanvas';
import { SalonPhoto } from '@/components/SalonPhoto';
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
import { useI18n } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, shadow } from '@/theme/tokens';

const GAP = 10;
const CARD_H = 108;

export default function MapScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset();
  const { width } = useWindowDimensions();
  const { origin, source, request, status } = useOrigin();
  const localReviews = useStore((s) => s.reviews);

  const [sort, setSort] = useState<MapSort>('best');
  const [prices, setPrices] = useState<PriceLevel[]>([]);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelH, setPanelH] = useState(150);
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

  const bottomOverlay = tabInset + CARD_H - 4;

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
        style={[styles.panel, { top: insets.top + 8, backgroundColor: c.surface }, shadow(c, 2)]}
        onLayout={(e) => setPanelH(e.nativeEvent.layout.height + 8)}
      >
        <SegmentedControl<MapSort>
          value={sort}
          onChange={setSort}
          options={[
            { value: 'best', label: i18n.t('sortBest') },
            { value: 'nearest', label: i18n.t('sortNear') },
            { value: 'rating', label: i18n.t('sortTop') },
          ]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {priceLevels.map((p) => (
            <Chip
              key={p.level}
              size="sm"
              label={'₼'.repeat(p.level)}
              accessibilityLabel={i18n.tx(p.hint)}
              selected={prices.includes(p.level)}
              onPress={() => togglePrice(p.level)}
            />
          ))}
          <View style={[styles.divider, { backgroundColor: c.lineStrong }]} />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              size="sm"
              label={i18n.tx(cat.label)}
              selected={category === cat.id}
              onPress={() => setCategory(category === cat.id ? null : cat.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View pointerEvents="box-none" style={[styles.locate, { bottom: bottomOverlay + 12 }]}>
        <IconButton
          icon={LocateFixed}
          label={source === 'device' ? i18n.t('centredOnYou') : i18n.t('useMyLocation')}
          variant="float"
          active={source === 'device'}
          activeColor={c.accent}
          onPress={request}
        />
      </View>
      {source === 'city' && status === 'denied' ? (
        <View
          pointerEvents="none"
          style={[styles.note, { bottom: bottomOverlay + 18, backgroundColor: c.surface }, shadow(c, 1)]}
        >
          <Text variant="caption" tone="soft">
            {i18n.t('locationOff')}
          </Text>
        </View>
      ) : null}

      <View style={[styles.rail, { bottom: tabInset - 12 }]}>
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
            style={[styles.empty, { backgroundColor: c.surface, marginHorizontal: gutter }, shadow(c, 2)]}
          >
            <SearchX size={22} color={c.inkSoft} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{i18n.t('nothingInRange')}</Text>
              <Text variant="caption" tone="soft">
                {i18n.t('widenRange')}
              </Text>
            </View>
            <Button
              label={i18n.t('reset')}
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
  const i18n = useI18n();
  const { salon, live, distance } = item;
  const open = openState(salon);
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/salon/[id]', params: { id: salon.id } })}
      scaleTo={0.98}
      accessibilityLabel={`${best ? `${i18n.t('bestPick')}. ` : ''}${salon.name}, ${i18n.distance(distance)}, ${i18n.fromPrice(fromPrice(salon))}`}
      style={[
        styles.card,
        { width, backgroundColor: c.surface, borderColor: active ? c.ink : 'transparent' },
        shadow(c, 2),
      ]}
    >
      <SalonPhoto salon={salon} width={84} height={84} radius={radius.md} />
      <View style={{ flex: 1, gap: 2 }}>
        {best ? (
          <Text variant="micro" tone="accent">
            {i18n.t('bestPick')}
          </Text>
        ) : (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {i18n.tx(salon.kind)} · {salon.district}
          </Text>
        )}
        <Text variant="headline" numberOfLines={1}>
          {salon.name}
        </Text>
        <View style={styles.meta}>
          <RatingInline rating={live.rating} size="sm" />
          <Text variant="caption" tone="soft">
            · {i18n.distance(distance)} · {i18n.fromPrice(fromPrice(salon))}
          </Text>
        </View>
        <Text variant="caption" style={{ color: open.open ? c.success : c.inkMuted }}>
          {i18n.t(open.kind, { time: open.time ?? '' })}
        </Text>
      </View>
      <ChevronRight size={18} color={c.inkMuted} strokeWidth={2} />
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  panel: { position: 'absolute', left: 12, right: 12, borderRadius: radius.xl, padding: 8, gap: 10, paddingBottom: 10 },
  chips: { gap: 6, alignItems: 'center', paddingHorizontal: 2 },
  divider: { width: StyleSheet.hairlineWidth, height: 20, marginHorizontal: 4 },
  locate: { position: 'absolute', right: gutter },
  note: {
    position: 'absolute',
    left: gutter,
    right: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  rail: { position: 'absolute', left: 0, right: 0, height: CARD_H + 16 },
  card: {
    height: CARD_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  empty: { height: CARD_H, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.lg },
});
