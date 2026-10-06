import { router } from 'expo-router';
import { memo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { priceLabel } from '@/data/categories';
import type { RankedSalon } from '@/data/ranking';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, gutter, radius } from '@/theme/tokens';

import { CompareToggle } from './CompareToggle';
import { SalonPhoto } from './SalonPhoto';
import { PressableScale } from './ui/PressableScale';
import { RatingInline } from './ui/Stars';
import { Text } from './ui/Text';

/**
 * A list row: thumbnail, name, meta and rating. `rank` shows a small position number;
 * `compare` adds a compare toggle beside (not inside) the row's pressable.
 */
export const SalonRow = memo(function SalonRow({
  item,
  rank,
  last,
  right,
  onPress,
  compare,
}: {
  item: RankedSalon;
  rank?: number;
  last?: boolean;
  right?: ReactNode;
  onPress?: () => void;
  compare?: boolean;
}) {
  const { c } = useTheme();
  const i18n = useI18n();
  const { salon, live } = item;
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}>
      <PressableScale
        onPress={onPress ?? (() => router.push({ pathname: '/salon/[id]', params: { id: salon.id } }))}
        scaleTo={0.985}
        accessibilityLabel={`${rank ? `${rank}. ` : ''}${salon.name}, ${i18n.rating(live.rating)}, ${i18n.n(live.count, 'review')}`}
        hitStyle={{ flex: 1 }}
        style={styles.press}
      >
        <View>
          <SalonPhoto salon={salon} width={60} height={60} radius={radius.sm} />
          {rank ? (
            <View style={[styles.rank, { backgroundColor: rank <= 3 ? c.ink : c.surface, borderColor: c.bg }]}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: rank <= 3 ? c.onPrimary : c.ink }}>
                {rank}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.text}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {salon.name}
          </Text>
          <Text variant="subhead" tone="soft" numberOfLines={1}>
            {i18n.tx(salon.kind)} · {salon.district} · {priceLabel(salon.priceLevel)}
          </Text>
          <RatingInline rating={live.rating} count={live.count} size="sm" />
        </View>
        {right}
      </PressableScale>
      {compare ? <CompareToggle salonId={salon.id} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: gutter },
  press: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  text: { flex: 1, gap: 2 },
  rank: {
    position: 'absolute',
    top: -6,
    left: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
