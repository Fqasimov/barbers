import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

import { Text } from './Text';

/** Five stars with fractional fill — the filled row is clipped to the rating. */
export function Stars({ rating, size = 14, gap = 2 }: { rating: number; size?: number; gap?: number }) {
  const { c } = useTheme();
  const { rating: fmt, t } = useI18n();
  const total = size * 5 + gap * 4;
  const filled = Math.max(0, Math.min(5, rating));
  const width = Math.floor(filled) * (size + gap) + (filled % 1) * size;
  const row = (fill: string, stroke: string) => (
    <View style={[styles.row, { gap }]}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={size} color={stroke} fill={fill} strokeWidth={1.4} />
      ))}
    </View>
  );
  return (
    <View
      style={{ width: total, height: size }}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('ofFive', { n: fmt(rating) })}
    >
      {row('transparent', c.lineStrong)}
      <View style={[StyleSheet.absoluteFill, { width, overflow: 'hidden' }]}>{row(c.star, c.star)}</View>
    </View>
  );
}

/** Compact "★ 4,9 (412)" — the workhorse rating display. */
export function RatingInline({
  rating,
  count,
  size = 'md',
  tone = 'ink',
}: {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
  tone?: 'ink' | 'onPrimary';
}) {
  const { c } = useTheme();
  const { rating: fmt, n } = useI18n();
  const color = tone === 'ink' ? c.ink : c.onPrimary;
  return (
    <View
      style={styles.inline}
      accessible
      accessibilityLabel={`${fmt(rating)}${count ? `, ${n(count, 'review')}` : ''}`}
    >
      <Star size={size === 'sm' ? 12 : 14} color={color} fill={color} strokeWidth={1.2} />
      <Text style={[styles.num, { color, fontSize: size === 'sm' ? 13 : 14.5 }]}>{fmt(rating)}</Text>
      {count !== undefined ? (
        <Text
          variant="caption"
          tone={tone === 'ink' ? 'muted' : 'onPrimary'}
          style={size === 'sm' && { fontSize: 12.5 }}
        >
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  num: { fontFamily: fonts.semibold, lineHeight: 18 },
});
