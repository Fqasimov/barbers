import { router, useLocalSearchParams } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RatingSummary, ReviewCard } from '@/components/ReviewCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useDistribution, useLiveRating, useSalon, useSalonReviews } from '@/hooks/useSalon';
import { useI18n } from '@/i18n';
import { isCompleted, useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius } from '@/theme/tokens';

type Filter = 'all' | 5 | 4 | 'low';

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const salon = useSalon(id);
  const live = useLiveRating(salon);
  const dist = useDistribution(salon);
  const reviews = useSalonReviews(id);
  const bookings = useStore((s) => s.bookings);
  const [filter, setFilter] = useState<Filter>('all');

  const shown = useMemo(
    () => reviews.filter((r) => (filter === 'all' ? true : filter === 'low' ? r.rating <= 3 : r.rating === filter)),
    [reviews, filter],
  );
  const reviewable = bookings
    .filter((b) => b.salonId === id && !b.reviewed && isCompleted(b))
    .sort((a, b) => b.start.localeCompare(a.start))[0];

  if (!salon) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={salon.name} />
      <FlatList
        data={shown}
        keyExtractor={(r) => r.id}
        renderItem={({ item, index }) => (
          <View style={{ paddingHorizontal: gutter }}>
            <ReviewCard review={item} salon={salon} last={index === shown.length - 1} />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: insets.bottom + (reviewable ? 100 : 32) }}
        ListHeaderComponent={
          <View>
            <View style={{ paddingHorizontal: gutter, paddingTop: 8 }}>
              <Text variant="largeTitle" style={{ marginBottom: 20 }} accessibilityRole="header">
                {i18n.t('reviewsTitle')}
              </Text>
              <RatingSummary rating={live.rating} count={live.count} distribution={dist} />
              <View style={[styles.note, { backgroundColor: c.sunken }]}>
                <Text variant="caption" tone="soft">
                  {i18n.t('reviewLockedBody')}
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label={i18n.t('all')} selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label={i18n.t('stars5')} selected={filter === 5} onPress={() => setFilter(5)} />
              <Chip label={i18n.t('stars4')} selected={filter === 4} onPress={() => setFilter(4)} />
              <Chip label={i18n.t('starsLow')} selected={filter === 'low'} onPress={() => setFilter('low')} />
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <Text tone="soft" style={{ paddingHorizontal: gutter, paddingVertical: 32 }}>
            {i18n.t('noReviewsInRange')}
          </Text>
        }
      />
      {reviewable ? (
        <View
          style={[
            styles.cta,
            { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.surface, borderColor: c.line },
          ]}
        >
          <Button
            label={i18n.t('rateVisit')}
            icon={Star}
            hitStyle={{ flex: 1 }}
            onPress={() => router.push({ pathname: '/review/[id]', params: { id: salon.id, booking: reviewable.id } })}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { marginTop: 18, padding: 12, borderRadius: radius.md },
  chips: { paddingHorizontal: gutter, gap: 8, paddingTop: 20, paddingBottom: 4 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: gutter,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
