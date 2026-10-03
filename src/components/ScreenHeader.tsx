import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

import { IconButton } from './ui/IconButton';
import { Text } from './ui/Text';

type Props = {
  title?: string;
  /** 'close' for modals, 'back' for pushed screens. */
  mode?: 'back' | 'close';
  right?: ReactNode;
  /** Modals on iOS sit below the status bar already. */
  inset?: boolean;
  border?: boolean;
};

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function ScreenHeader({ title, mode = 'back', right, inset = true, border }: Props) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: (inset ? insets.top : 0) + 8 },
        border && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
      ]}
    >
      <IconButton
        icon={mode === 'close' ? X : ChevronLeft}
        label={mode === 'close' ? 'Close' : 'Back'}
        onPress={goBack}
        variant="surface"
      />
      {title ? (
        <Text variant="bodyMedium" numberOfLines={1} style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: 8, gap: 12 },
  title: { flex: 1, textAlign: 'center' },
  right: { minWidth: 44, alignItems: 'flex-end' },
});
