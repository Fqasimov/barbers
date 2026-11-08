import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { isSite } from '@/theme/tokens';

import { Text } from './Text';

/** The website's silver, for fine rules only (it is 2:1 on paper, so never for text). */
export const SILVER = '#A3A8AE';

/**
 * The website's "kicker": a short silver rule, then a small uppercase label.
 * Outside the browser it is just the label.
 */
export function Kicker({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 14 }, style]}>
      {isSite ? <View style={{ width: 32, height: 1, backgroundColor: SILVER }} /> : null}
      <Text variant={isSite ? 'overline' : 'caption'} tone="muted" style={{ color: c.inkMuted }}>
        {children}
      </Text>
    </View>
  );
}
