import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { gutter, iconStroke } from '@/theme/tokens';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  overline: string;
  title: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ overline, title, action, style }: Props) {
  const { c } = useTheme();
  return (
    <View style={[styles.row, style]}>
      <View style={styles.text}>
        <Text variant="label" tone="muted">
          {overline}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {action ? (
        <PressableScale onPress={action.onPress} hitSlop={12} accessibilityLabel={action.label} style={styles.action}>
          <Text variant="caption" tone="soft">
            {action.label}
          </Text>
          <ArrowRight size={14} color={c.inkSoft} strokeWidth={iconStroke} />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: gutter,
    gap: 12,
  },
  text: { flexShrink: 1, gap: 6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 6 },
});
