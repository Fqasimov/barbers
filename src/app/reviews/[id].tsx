import { router, useLocalSearchParams } from 'expo-router';
import { PenLine } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RatingSummary, ReviewCard } from '@/components/ReviewCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useDistribution, useLiveRating, useSalon, useSalonReviews } from '@/hooks/useSalon';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

type Filter = 'all' | 5 | 4 | 'low';

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const salon = useSalon(id);
  const live = useLiveRating(salon);
  const dist = useDistribution(salon);
  const reviews = useSalonReviews(id);
  const [filter, setFilter] = useState<Filter>('all');

  const shown = useMemo(
    () => reviews.filter((r) => (filter === 'all' ? true : filter === 'low' ? r.rating <= 3 : r.rating === filter)),
    [reviews, filter],
  );

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
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        ListHeaderComponent={
          <View>
            <View style={{ paddingHorizontal: gutter, paddingTop: 8 }}>
              <Text variant="label" tone="muted">
                What people say
              </Text>
              <Text variant="display" style={{ marginTop: 8, marginBottom: 24 }} accessibilityRole="header">
                Reviews
              </Text>
              <RatingSummary rating={live.rating} count={live.count} distribution={dist} />
              <Text variant="caption" tone="soft" style={{ marginTop: 16 }}>
                Showing the latest written reviews. Scores include every rated visit.
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label="5 stars" selected={filter === 5} onPress={() => setFilter(5)} />
              <Chip label="4 stars" selected={filter === 4} onPress={() => setFilter(4)} />
              <Chip label="3 and below" selected={filter === 'low'} onPress={() => setFilter('low')} />
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <Text tone="soft" style={{ paddingHorizontal: gutter, paddingVertical: 32 }}>
            No written reviews in this range yet.
          </Text>
        }
      />
      <View
        style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.bg, borderColor: c.line }]}
      >
        <Button
          label="Write a review"
          icon={PenLine}
          hitStyle={{ flex: 1 }}
          onPress={() => router.push({ pathname: '/review/[id]', params: { id: salon.id } })}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: gutter, gap: 8, paddingTop: 24, paddingBottom: 4 },
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
