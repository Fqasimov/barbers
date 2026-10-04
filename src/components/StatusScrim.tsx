import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

/** Keeps scrolled content from colliding with the clock and battery: the page colour fades in under the status bar. */
export function StatusScrim() {
  const { c } = useTheme();
  const { top } = useSafeAreaInsets();
  if (!top) return null;
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[c.bg, c.bg, `${c.bg}00`]}
      locations={[0, 0.72, 1]}
      style={[styles.scrim, { height: top + 14 }]}
    />
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', left: 0, right: 0, top: 0 },
});
