import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { ScissorsStatic } from './splash/Scissors';
import { Button } from './ui/Button';
import { Text } from './ui/Text';

type Props = { title: string; body: string; action?: { label: string; onPress: () => void } };

export function EmptyState({ title, body, action }: Props) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.mark, { borderColor: c.line }]}>
        <ScissorsStatic size={64} color={c.inkMuted} />
      </View>
      <Text variant="title" align="center">
        {title}
      </Text>
      <Text variant="body" tone="soft" align="center" style={{ maxWidth: 280 }}>
        {body}
      </Text>
      {action ? (
        <Button label={action.label} variant="secondary" size="md" onPress={action.onPress} style={{ marginTop: 8 }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 48, paddingHorizontal: 24 },
  mark: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
});
