import { StyleSheet, View } from 'react-native';

import { initials } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, tones, type ToneName } from '@/theme/tokens';

import { Text } from './Text';

type Props = { name: string; tone?: ToneName; size?: number; selected?: boolean };

/** Initials portrait. A ring marks the selected master. */
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
          borderColor: selected ? c.ink : 'transparent',
        },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.bg }]}>
        <Text
          maxFontSizeMultiplier={1}
          style={{
            color: t.fg,
            fontFamily: fonts.semibold,
            fontSize: size * 0.36,
            lineHeight: size * 0.46,
            letterSpacing: 0.2,
          }}
        >
          {initials(name)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  disc: { alignItems: 'center', justifyContent: 'center' },
});
