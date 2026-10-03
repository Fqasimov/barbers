import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { priceLabel } from '@/data/categories';
import type { RankedSalon } from '@/data/ranking';
import { fmtRating } from '@/lib/format';
import { fmtDistance } from '@/lib/geo';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

import { SalonCover } from './SalonCover';
import { PressableScale } from './ui/PressableScale';
import { RatingInline } from './ui/Stars';
import { Text } from './ui/Text';

type Props = { item: RankedSalon; width: number; badge?: string };

/** Portrait card for horizontal rails. */
export const SalonCard = memo(function SalonCard({ item, width, badge }: Props) {
  const { c } = useTheme();
  const { salon, live, distance } = item;
  const saved = useStore((s) => s.favorites.includes(salon.id));
  const height = Math.round(width * 1.18);
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/salon/[id]', params: { id: salon.id } })}
      accessibilityLabel={`${salon.name}, ${salon.kind} in ${salon.district}, rated ${fmtRating(live.rating)}, ${fmtDistance(distance)} away`}
      style={{ width }}
    >
      <SalonCover salon={salon} width={width} height={height} radius={radius.lg}>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: c.raised }]}>
            <Text variant="label" style={{ color: c.ink, fontSize: 10 }}>
              {badge}
            </Text>
          </View>
        ) : null}
        {saved ? (
          <View style={[styles.saved, { backgroundColor: c.glass }]}>
            <Heart size={14} color={c.accent} fill={c.accent} strokeWidth={1.6} />
          </View>
        ) : null}
      </SalonCover>
      <View style={styles.body}>
        <Text variant="headline" numberOfLines={1}>
          {salon.name}
        </Text>
        <Text variant="caption" tone="soft" numberOfLines={1}>
          {salon.kind} · {salon.district}
        </Text>
        <View style={styles.meta}>
          <RatingInline rating={live.rating} size="sm" />
          <Dot />
          <Text variant="mono" tone="soft">
            {fmtDistance(distance)}
          </Text>
          <Dot />
          <Text variant="price" style={{ fontSize: 14, color: c.inkSoft }}>
            {priceLabel(salon.priceLevel)}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
});

export function Dot() {
  const { c } = useTheme();
  return <View style={[styles.dot, { backgroundColor: c.lineStrong }]} />;
}

const styles = StyleSheet.create({
  body: { paddingTop: 12, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  saved: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
