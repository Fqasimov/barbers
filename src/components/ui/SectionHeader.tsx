import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

type Props = {
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, subtitle, action, style }: Props) {
  const { c } = useTheme();
  return (
    <View style={[styles.row, style]}>
      <View style={styles.text}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="subhead" tone="soft">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <PressableScale onPress={action.onPress} hitSlop={12} accessibilityLabel={action.label} style={styles.action}>
          <Text variant="callout" tone="soft">
            {action.label}
          </Text>
          <ChevronRight size={16} color={c.inkSoft} strokeWidth={2} />
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
  text: { flexShrink: 1, gap: 2 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 3 },
});
