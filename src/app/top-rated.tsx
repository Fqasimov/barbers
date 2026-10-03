import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RankRow } from '@/components/RankRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { categories, categoryById } from '@/data/categories';
import { topRated } from '@/data/ranking';
import { salons } from '@/data/salons';
import type { CategoryId } from '@/data/types';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

// The chart is short (one city), so a plain ScrollView; the whole list fades in once per filter.
const LIST_IN = FadeIn.duration(200);

export default function TopRatedScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: CategoryId }>();
  const [category, setCategory] = useState<CategoryId | null>(params.category ?? null);
  const localReviews = useStore((s) => s.reviews);
  const ranked = useMemo(() => topRated(salons, localReviews, category), [localReviews, category]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: gutter }}>
          <Text variant="label" tone="muted">
            The list · Baku
          </Text>
          <Text variant="display" style={{ marginTop: 8 }} accessibilityRole="header">
            {category ? `The best ${categoryById[category].plural.toLowerCase()}` : 'Top rated, all of Baku'}
          </Text>
          <Text variant="callout" tone="soft" style={{ marginTop: 10 }}>
            Ranked by a weighted rating: a place needs consistent scores across many visits to rise, so a handful of
            perfect reviews can’t buy the top spot.
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="Everything" selected={!category} onPress={() => setCategory(null)} />
          {categories.map((cat) => (
            <Chip key={cat.id} label={cat.label} selected={category === cat.id} onPress={() => setCategory(cat.id)} />
          ))}
        </ScrollView>
        <Animated.View key={category ?? 'all'} entering={LIST_IN}>
          {ranked.map((item, index) => (
            <RankRow key={item.salon.id} item={item} rank={index + 1} last={index === ranked.length - 1} />
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: gutter, gap: 8, paddingTop: 20, paddingBottom: 8 },
});
