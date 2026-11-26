import { useEffect, useRef, type ComponentRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/ScreenHeader';
import { Kicker } from '@/components/ui/Kicker';
import { Reveal } from '@/components/ui/Reveal';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, isSite } from '@/theme/tokens';
import { useWide } from '@/theme/wide';

/** Shared frame for the account screens: header, title, scrolling form, pinned action. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  mode = 'back',
  headerRight,
  step,
  onBack,
  stacked = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  mode?: 'back' | 'close';
  headerRight?: ReactNode;
  /** e.g. "1/2" for multi-step forms. */
  step?: string;
  /** What the header's back button does (a multi-step form goes back a step). */
  onBack?: () => void;
  /** On wide screens: title above a full-width body (for a grid of cards), not side by side. */
  stacked?: boolean;
}) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const wideScreen = useWide();
  const wide = wideScreen && !stacked;
  // A new step of a multi-step form starts at its title, not where the last one was scrolled to.
  useEffect(() => {
    scroller.current?.scrollTo({ y: 0, animated: false });
  }, [step]);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader mode={mode} right={headerRight} onBack={onBack} />
      <ScrollView
        ref={scroller}
        contentContainerStyle={[
          styles.content,
          wide && styles.contentWide,
          wideScreen && stacked && styles.contentStacked,
          { paddingBottom: footer && !wideScreen ? 24 : insets.bottom + 48 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Reveal index={0} style={wide ? styles.leftPane : undefined}>
          {step ? (
            isSite ? (
              <Kicker style={{ marginBottom: 18 }}>{step}</Kicker>
            ) : (
              <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>
                {step}
              </Text>
            )
          ) : null}
          <Text variant="largeTitle" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" tone="soft" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </Reveal>
        <Reveal index={1} style={[styles.body, wide && styles.rightPane]}>
          {children}
          {wideScreen && footer ? (
            <View style={[styles.inlineFooter, stacked && styles.inlineFooterStacked]}>{footer}</View>
          ) : null}
        </Reveal>
      </ScrollView>
      {footer && !wideScreen ? (
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
  content: { paddingHorizontal: gutter, paddingTop: isSite ? 36 : 4 },
  contentWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 96, paddingTop: 64 },
  leftPane: { flex: 1, position: 'sticky' as 'relative', top: 24 },
  rightPane: { flex: 1.15, marginTop: 8, maxWidth: 720 },
  contentStacked: { paddingTop: 64, width: '100%', maxWidth: 1180, alignSelf: 'center' },
  inlineFooter: { gap: 10, marginTop: 6 },
  inlineFooterStacked: { maxWidth: 420 },
  subtitle: { marginTop: isSite ? 16 : 8, maxWidth: 520 },
  body: { marginTop: isSite ? 36 : 26, gap: isSite ? 22 : 18 },
  footer: {
    paddingTop: isSite ? 16 : 12,
    paddingHorizontal: gutter,
    borderTopWidth: isSite ? 1 : StyleSheet.hairlineWidth,
    gap: 10,
  },
});
