import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompareTray } from '@/components/CompareTray';
import { SalonRow } from '@/components/SalonRow';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { categories, categoryById } from '@/data/categories';
import { categoryIcon } from '@/data/icons';
import { topRated } from '@/data/ranking';
import { salons } from '@/data/salons';
import type { CategoryId } from '@/data/types';
import { useI18n } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

// A short list (one city), so a plain ScrollView; the list fades in once per filter.
const LIST_IN = FadeIn.duration(200);

export default function TopRatedScreen() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: CategoryId }>();
  const [category, setCategory] = useState<CategoryId | null>(params.category ?? null);
  const localReviews = useStore((s) => s.reviews);
  const ranked = useMemo(() => topRated(salons, localReviews, category), [localReviews, category]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: gutter }}>
          <Text variant="largeTitle" accessibilityRole="header">
            {category
              ? i18n.t('bestOf', { cat: i18n.tx(categoryById[category].plural).toLocaleLowerCase(i18n.locale) })
              : i18n.t('bestInBaku')}
          </Text>
          <Text variant="subhead" tone="soft" style={{ marginTop: 6 }}>
            {i18n.t('rankingExplain')}
          </Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={i18n.t('all')} selected={!category} onPress={() => setCategory(null)} />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              icon={categoryIcon[cat.id]}
              label={i18n.tx(cat.label)}
              selected={category === cat.id}
              onPress={() => setCategory(cat.id)}
            />
          ))}
        </ScrollView>
        <Animated.View key={category ?? 'all'} entering={LIST_IN}>
          {ranked.map((item, index) => (
            <SalonRow key={item.salon.id} item={item} rank={index + 1} last={index === ranked.length - 1} compare />
          ))}
        </Animated.View>
      </ScrollView>
      <CompareTray bottom={Math.max(insets.bottom, 12) + 8} />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { paddingHorizontal: gutter, gap: 8, paddingTop: 18, paddingBottom: 8 },
});
