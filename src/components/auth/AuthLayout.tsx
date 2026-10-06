import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

/** Shared frame for the account screens: header, title, scrolling form, pinned action. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  mode = 'back',
  headerRight,
  step,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  mode?: 'back' | 'close';
  headerRight?: ReactNode;
  /** e.g. "1/2" for multi-step forms. */
  step?: string;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader mode={mode} right={headerRight} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: footer ? 24 : insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step ? (
          <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>
            {step}
          </Text>
        ) : null}
        <Text variant="largeTitle" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body" tone="soft" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 14), backgroundColor: c.bg, borderColor: c.line },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gutter, paddingTop: 4 },
  subtitle: { marginTop: 8 },
  body: { marginTop: 26, gap: 18 },
  footer: { paddingTop: 12, paddingHorizontal: gutter, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
});
