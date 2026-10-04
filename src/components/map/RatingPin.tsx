import { Star } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

import { Text } from '../ui/Text';

/** Rating-first map pin. The active pin turns brand red and grows slightly. */
export function RatingPin({ rating, active, best }: { rating: number; active: boolean; best?: boolean }) {
  const { c } = useTheme();
  const { rating: fmt } = useI18n();
  const bg = active ? c.accent : c.primary;
  const fg = active ? c.onAccent : c.onPrimary;
  return (
    <View style={[styles.wrap, active && styles.active]}>
      <View style={[styles.pill, { backgroundColor: bg, borderColor: active ? c.onAccent : c.bg }]}>
        <Star size={10} color={fg} fill={fg} strokeWidth={1.2} />
        <Text style={[styles.num, { color: fg }]} maxFontSizeMultiplier={1}>
          {fmt(rating)}
        </Text>
        {best ? <View style={[styles.best, { backgroundColor: active ? c.onAccent : c.accent }]} /> : null}
      </View>
      <View style={[styles.tail, { borderTopColor: bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  active: { transform: [{ scale: 1.12 }] },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
  },
  num: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16 },
  best: { width: 5, height: 5, borderRadius: 3, marginLeft: 2 },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
