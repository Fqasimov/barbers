import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Button } from './ui/Button';
import { Text } from './ui/Text';

type Props = { icon: LucideIcon; title: string; body: string; action?: { label: string; onPress: () => void } };

export function EmptyState({ icon: Icon, title, body, action }: Props) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.mark, { backgroundColor: c.sunken }]}>
        <Icon size={28} color={c.inkSoft} strokeWidth={1.8} />
      </View>
      <Text variant="title" align="center">
        {title}
      </Text>
      <Text variant="body" tone="soft" align="center" style={{ maxWidth: 290 }}>
        {body}
      </Text>
      {action ? <Button label={action.label} size="md" onPress={action.onPress} style={{ marginTop: 10 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 24 },
  mark: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
