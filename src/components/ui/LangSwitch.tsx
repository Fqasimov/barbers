import { View } from 'react-native';

import { LOCALES, useLocale } from '@/i18n';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/theme/ThemeProvider';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

/** AZ | RU | EN, as in the website's nav: the current language in ink, the others muted. */
export function LangSwitch() {
  const { c } = useTheme();
  const current = useLocale();
  const setLocale = useStore((s) => s.setLocale);
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', alignItems: 'center' }}>
      {LOCALES.map((l, i) => (
        <View key={l} style={{ flexDirection: 'row', alignItems: 'center' }}>
          {i > 0 ? <View style={{ width: 1, height: 12, backgroundColor: c.lineStrong, marginHorizontal: 2 }} /> : null}
          <PressableScale
            onPress={() => setLocale(l)}
            scaleTo={0.94}
            accessibilityRole="radio"
            accessibilityState={{ selected: l === current }}
            accessibilityLabel={l.toUpperCase()}
            hitSlop={6}
            style={{ paddingHorizontal: 8, paddingVertical: 10 }}
          >
            <Text variant="overline" style={{ color: l === current ? c.ink : c.inkMuted, letterSpacing: 1.6 }}>
              {l}
            </Text>
          </PressableScale>
        </View>
      ))}
    </View>
  );
}
