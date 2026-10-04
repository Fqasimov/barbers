import { router } from 'expo-router';
import { ArrowRight, X } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { salonById } from '@/data/salons';
import { useI18n } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';
import { ease, gutter, radius, shadow } from '@/theme/tokens';

import { SalonPhoto } from './SalonPhoto';
import { PressableScale } from './ui/PressableScale';
import { Text } from './ui/Text';

const ENTER = FadeInDown.duration(260).easing(ease.out);
const EXIT = FadeOutDown.duration(200).easing(ease.out);

/** Floating tray that appears once something is queued for comparison. */
export function CompareTray({ bottom }: { bottom: number }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const ids = useStore((s) => s.compare);
  const clear = useStore((s) => s.clearCompare);
  if (!ids.length) return null;
  const items = ids.map((id) => salonById(id)).filter((s) => !!s);
  return (
    <Animated.View entering={ENTER} exiting={EXIT} style={[styles.wrap, { bottom }]} pointerEvents="box-none">
      <View style={[styles.tray, { backgroundColor: c.primary }, shadow(c, 2)]}>
        <PressableScale onPress={clear} hitSlop={10} accessibilityLabel={i18n.t('clearAll')} style={styles.clear}>
          <X size={16} color={c.onPrimary} strokeWidth={2.2} />
        </PressableScale>
        <View style={styles.thumbs}>
          {items.map((s, i) => (
            <SalonPhoto
              key={s.id}
              salon={s}
              width={30}
              height={30}
              radius={15}
              style={{ marginLeft: i ? -8 : 0, borderWidth: 2, borderColor: c.primary }}
            />
          ))}
        </View>
        <Text variant="callout" style={{ color: c.onPrimary, flex: 1 }} numberOfLines={1}>
          {i18n.t('compareTray', { places: i18n.n(items.length, 'place') })}
        </Text>
        <PressableScale
          onPress={() => router.push('/compare')}
          accessibilityLabel={i18n.t('compareNow')}
          style={[styles.go, { backgroundColor: c.onPrimary }]}
        >
          <Text variant="captionStrong" style={{ color: c.primary }}>
            {i18n.t('compareNow')}
          </Text>
          <ArrowRight size={14} color={c.primary} strokeWidth={2.2} />
        </PressableScale>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: gutter, right: gutter },
  tray: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingLeft: 10, borderRadius: radius.lg },
  clear: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  thumbs: { flexDirection: 'row' },
  go: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: radius.sm,
  },
});
