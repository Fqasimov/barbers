import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { priceLabel } from '@/data/categories';
import type { RankedSalon } from '@/data/ranking';
import { fmtRating } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, radius } from '@/theme/tokens';

import { SalonCover } from './SalonCover';
import { PressableScale } from './ui/PressableScale';
import { Stars } from './ui/Stars';
import { Text } from './ui/Text';

/** Editorial leaderboard row: big numeral, thumbnail, name, score. */
export const RankRow = memo(function RankRow({
  item,
  rank,
  last,
}: {
  item: RankedSalon;
  rank: number;
  last?: boolean;
}) {
  const { c } = useTheme();
  const { salon, live } = item;
  return (
    <PressableScale
      onPress={() => router.push({ pathname: '/salon/[id]', params: { id: salon.id } })}
      scaleTo={0.985}
      accessibilityLabel={`Number ${rank}, ${salon.name}, rated ${fmtRating(live.rating)} from ${live.count} reviews`}
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
    >
      <Text style={[styles.rank, { color: rank <= 3 ? c.accent : c.inkMuted }]} maxFontSizeMultiplier={1}>
        {String(rank).padStart(2, '0')}
      </Text>
      <SalonCover salon={salon} width={56} height={56} radius={radius.sm} variant="thumb" />
      <View style={styles.text}>
        <Text variant="serif" numberOfLines={1} style={{ fontSize: 18 }}>
          {salon.name}
        </Text>
        <Text variant="caption" tone="soft" numberOfLines={1}>
          {salon.kind} · {salon.district} ·{' '}
          <Text style={{ fontFamily: fonts.displayMedium, color: c.inkSoft, fontSize: 13 }}>
            {priceLabel(salon.priceLevel)}
          </Text>
        </Text>
      </View>
      <View style={styles.score}>
        <Text style={[styles.scoreNum, { color: c.ink }]}>{fmtRating(live.rating)}</Text>
        <Stars rating={live.rating} size={9} gap={1} />
        <Text variant="mono" tone="muted" style={{ fontSize: 10 }}>
          {live.count}
        </Text>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, marginHorizontal: gutter },
  rank: { fontFamily: fonts.displayLight, fontSize: 28, lineHeight: 32, width: 36, letterSpacing: -0.5 },
  text: { flex: 1, gap: 2 },
  score: { alignItems: 'flex-end', gap: 3 },
  scoreNum: { fontFamily: fonts.displayMedium, fontSize: 20, lineHeight: 22 },
});
