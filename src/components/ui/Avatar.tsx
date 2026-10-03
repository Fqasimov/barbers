import { StyleSheet, View } from 'react-native';

import { initials } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, tones, type ToneName } from '@/theme/tokens';

import { Text } from './Text';

type Props = { name: string; tone?: ToneName; size?: number; selected?: boolean };

/** Monogram portrait. A hairline ring marks the selected master. */
export function Avatar({ name, tone = 'ink', size = 48, selected }: Props) {
  const { c } = useTheme();
  const t = tones[tone];
  return (
    <View
      style={[
        styles.ring,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          borderColor: selected ? c.accent : 'transparent',
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg }]}>
        <Text
          style={{
            color: t.fg,
            fontFamily: fonts.displayItalic,
            fontSize: size * 0.4,
            lineHeight: size * 0.48,
            letterSpacing: -0.3,
          }}
          maxFontSizeMultiplier={1}
        >
          {initials(name)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  disc: { alignItems: 'center', justifyContent: 'center' },
});
