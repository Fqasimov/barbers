import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { priceLabel } from '@/data/categories';
import type { RankedSalon } from '@/data/ranking';
import { fromPrice } from '@/data/salons';
import { useI18n } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

import { SalonPhoto } from './SalonPhoto';
import { PressableScale } from './ui/PressableScale';
import { RatingInline } from './ui/Stars';
import { Text } from './ui/Text';

type Props = { item: RankedSalon; width: number; badge?: string };

/** Photo-first card for horizontal rails. */
export const SalonCard = memo(function SalonCard({ item, width, badge }: Props) {
  const { c } = useTheme();
  const i18n = useI18n();
  const { salon, live, distance } = item;
  const saved = useStore((s) => s.favorites.includes(salon.id));
  const height = Math.round(width * 0.72);
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/salon/[id]', params: { id: salon.id } })}
      accessibilityLabel={`${salon.name}, ${i18n.tx(salon.kind)}, ${salon.district}, ${i18n.rating(live.rating)}, ${i18n.distance(distance)}`}
      style={{ width }}
    >
      <SalonPhoto salon={salon} width={width} height={height} radius={radius.md}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: c.surface }]}>
            <Text variant="micro">{badge}</Text>
          </View>
        ) : null}
        {saved ? (
          <View style={[styles.saved, { backgroundColor: c.surface }]}>
            <Heart size={14} color={c.accent} fill={c.accent} strokeWidth={1.8} />
          </View>
        ) : null}
      </SalonPhoto>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="headline" numberOfLines={1} style={{ flex: 1 }}>
            {salon.name}
          </Text>
          <RatingInline rating={live.rating} size="sm" />
        </View>
        <Text variant="subhead" tone="soft" numberOfLines={1}>
          {i18n.tx(salon.kind)} · {salon.district} · {i18n.distance(distance)}
        </Text>
        <Text variant="subhead" tone="soft" numberOfLines={1}>
          {i18n.fromPrice(fromPrice(salon))} · {priceLabel(salon.priceLevel)}
        </Text>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  body: { paddingTop: 10, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  saved: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
