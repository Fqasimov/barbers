import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { fonts } from '@/theme/tokens';

import { Text } from './Text';

/**
 * The Usta wordmark: lowercase "usta", sliced by a single cut. The top half
 * sits a hair to the right of the bottom — a scissor cut you notice second.
 */
export function Wordmark({ size = 28, color, cutColor }: { size?: number; color?: string; cutColor?: string }) {
  const { c } = useTheme();
  const ink = color ?? c.ink;
  const lineHeight = Math.round(size * 1.12);
  const cut = Math.round(size * 0.62);
  const gap = Math.max(1, Math.round(size * 0.045));
  const shift = Math.max(1, Math.round(size * 0.05));
  const word = (
    <Text
      maxFontSizeMultiplier={1}
      style={{ fontFamily: fonts.bold, fontSize: size, lineHeight, letterSpacing: -size * 0.045, color: ink }}
    >
      usta
    </Text>
  );
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Usta" style={{ height: lineHeight }}>
      <View style={{ opacity: 0, paddingRight: shift }}>{word}</View>
      <View style={[styles.slice, { top: 0, height: cut, transform: [{ translateX: shift }] }]}>{word}</View>
      <View style={[styles.slice, { top: cut + gap, bottom: 0 }]}>
        <View style={{ marginTop: -(cut + gap) }}>{word}</View>
      </View>
      {cutColor ? (
        <View
          style={{
            position: 'absolute',
            left: -size * 0.15,
            right: -size * 0.15,
            top: cut,
            height: gap,
            backgroundColor: cutColor,
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slice: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
});
