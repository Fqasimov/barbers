import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Review, Salon } from '@/data/types';
import { firstName, fmtRating } from '@/lib/format';
import { timeAgo } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

import { Avatar } from './ui/Avatar';
import { Stars } from './ui/Stars';
import { Text } from './ui/Text';

export const ReviewCard = memo(function ReviewCard({
  review,
  salon,
  last,
}: {
  review: Review;
  salon?: Salon;
  last?: boolean;
}) {
  const { c } = useTheme();
  const master = salon?.masters.find((m) => m.id === review.masterId);
  return (
    <View style={[styles.card, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}>
      <View style={styles.head}>
        <Avatar name={review.author} tone={review.mine ? 'ink' : 'bone'} size={36} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyMedium">
            {review.author}
            {review.mine ? (
              <Text variant="caption" tone="accent">
                {'  '}· You
              </Text>
            ) : null}
          </Text>
          <Text variant="caption" tone="soft">
            {timeAgo(review.date)}
            {review.serviceName ? ` · ${review.serviceName}` : ''}
            {master ? ` with ${firstName(master.name)}` : ''}
          </Text>
        </View>
        <Stars rating={review.rating} size={11} gap={1.5} />
      </View>
      {review.text ? (
        <Text variant="body" style={{ marginTop: 10 }}>
          {review.text}
        </Text>
      ) : null}
      {review.tags?.length ? (
        <View style={styles.tags}>
          {review.tags.map((t) => (
            <View key={t} style={[styles.tag, { backgroundColor: c.sunken }]}>
              <Text variant="caption" tone="soft" style={{ fontSize: 12 }}>
                {t}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
});

/** Big score + distribution bars. */
export function RatingSummary({
  rating,
  count,
  distribution,
}: {
  rating: number;
  count: number;
  distribution: number[];
}) {
  const { c } = useTheme();
  return (
    <View style={styles.summary}>
      <View style={{ alignItems: 'flex-start', gap: 4 }}>
        <Text variant="hero" style={{ fontSize: 56, lineHeight: 58 }}>
          {fmtRating(rating)}
        </Text>
        <Stars rating={rating} size={13} />
        <Text variant="caption" tone="soft">
          {count} reviews
        </Text>
      </View>
      <View style={{ flex: 1, gap: 6 }} accessible accessibilityLabel="Rating distribution">
        {distribution.map((p, i) => (
          <View key={i} style={styles.barRow}>
            <Text variant="mono" tone="muted" style={{ width: 10 }}>
              {5 - i}
            </Text>
            <View style={[styles.track, { backgroundColor: c.sunken }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.max(1, p * 100)}%`, backgroundColor: i === 0 ? c.accent : c.inkSoft },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 18 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
});
