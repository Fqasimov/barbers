import { BadgeCheck } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { reviewTags } from '@/data/reviews';
import type { Review, Salon } from '@/data/types';
import { useI18n } from '@/i18n';
import { firstName } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

import { Avatar } from './ui/Avatar';
import { Stars } from './ui/Stars';
import { Text } from './ui/Text';

const tagLabel = Object.fromEntries(reviewTags.map((t) => [t.id, t.label]));

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
  const i18n = useI18n();
  const master = salon?.masters.find((m) => m.id === review.masterId);
  return (
    <View style={[styles.card, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}>
      <View style={styles.head}>
        <Avatar name={review.author} tone={review.mine ? 'ink' : 'bone'} size={36} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">
            {review.author}
            {review.mine ? <Text variant="caption" tone="muted">{`  · ${i18n.t('you')}`}</Text> : null}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {i18n.timeAgo(review.date)}
            {review.serviceName ? ` · ${i18n.tx(review.serviceName)}` : ''}
            {master ? ` · ${firstName(master.name)}` : ''}
          </Text>
        </View>
        <Stars rating={review.rating} size={12} gap={1.5} />
      </View>
      {review.text ? (
        <Text variant="body" style={{ marginTop: 10 }}>
          {review.text}
        </Text>
      ) : null}
      <View style={styles.foot}>
        <View style={styles.verified}>
          <BadgeCheck size={14} color={c.success} strokeWidth={2} />
          <Text variant="caption" style={{ color: c.success, fontFamily: fonts.medium }}>
            {i18n.t('verifiedVisit')}
          </Text>
        </View>
        {review.tags?.map((tag) => (
          <View key={tag} style={[styles.tag, { backgroundColor: c.sunken }]}>
            <Text variant="caption" tone="soft" style={{ fontSize: 12 }}>
              {tagLabel[tag] ? i18n.tx(tagLabel[tag]) : tag}
            </Text>
          </View>
        ))}
      </View>
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
  const i18n = useI18n();
  return (
    <View style={styles.summary}>
      <View style={{ alignItems: 'flex-start', gap: 4 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 44, lineHeight: 48, letterSpacing: -1, color: c.ink }}>
          {i18n.rating(rating)}
        </Text>
        <Stars rating={rating} size={13} />
        <Text variant="caption" tone="muted">
          {i18n.n(count, 'review')}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 6 }} accessible accessibilityLabel={i18n.t('ratingDistribution')}>
        {distribution.map((p, i) => (
          <View key={i} style={styles.barRow}>
            <Text variant="caption" tone="muted" style={{ width: 10 }}>
              {5 - i}
            </Text>
            <View style={[styles.track, { backgroundColor: c.sunken }]}>
              <View style={[styles.fill, { width: `${Math.max(1, p * 100)}%`, backgroundColor: c.ink }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  foot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
});
