import { Image } from 'expo-image';
import { View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

const MARK = require('../../../assets/intro/mark.webp');

/** The yazılnow lockup: the shears opened into a check mark, then the word. */
export function Wordmark({ size = 28, color }: { size?: number; color?: string; cutColor?: string }) {
  const { c } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="yazılnow"
      style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.12 }}
    >
      <Image source={MARK} style={{ width: size * 1.25, height: size * 1.25, marginLeft: -size * 0.2 }} />
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Onest_800ExtraBold',
          fontSize: size,
          lineHeight: Math.round(size * 1.12),
          letterSpacing: -size * 0.035,
          color: color ?? c.ink,
        }}
      >
        yazılnow
      </Text>
    </View>
  );
}
