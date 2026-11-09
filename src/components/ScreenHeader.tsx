import { router } from 'expo-router';
import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, isSite } from '@/theme/tokens';

import { IconButton } from './ui/IconButton';
import { Text } from './ui/Text';
import { Wordmark } from './ui/Wordmark';
import { PressableScale } from './ui/PressableScale';

type Props = {
  title?: string;
  /** 'close' for modals, 'back' for pushed screens. */
  mode?: 'back' | 'close';
  right?: ReactNode;
  /** Modals on iOS sit below the status bar already. */
  inset?: boolean;
  border?: boolean;
};

/**
 * Where "back" goes when there is no history (a refresh, a shared link, the dashboard itself).
 * The salon panel stays in the panel: a tool → the dashboard; the dashboard, sign-up, plans, the staff
 * cabinet and sign-in reached from the panel → the panel's front door. Everything else → the client home.
 */
function fallback(): '/business' | '/panel' | '/' {
  const path = (globalThis.location?.pathname ?? '').replace(/^\/app(?=\/|$)/, '') || '/';
  const fromPanel = (() => {
    try {
      return globalThis.sessionStorage?.getItem('yazilnow-panel-flow') === '1';
    } catch {
      return false;
    }
  })();
  if (/^\/business\/(?!register|plans)./.test(path)) return '/business';
  if (path.startsWith('/business') || path === '/staff' || (path.startsWith('/auth') && fromPanel)) return '/panel';
  return '/';
}

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace(fallback());
}

export function ScreenHeader({ title, mode = 'back', right, inset = true, border }: Props) {
  const { c } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        { paddingTop: (inset ? insets.top : 0) + 8 },
        (border || isSite) && { borderBottomWidth: 1, borderColor: c.line },
        isSite && styles.siteBar,
      ]}
    >
      <IconButton
        icon={mode === 'close' ? X : ChevronLeft}
        label={mode === 'close' ? t('close') : t('back')}
        onPress={goBack}
        variant="surface"
      />
      {title ? (
        <Text
          variant={isSite ? 'overline' : 'headline'}
          tone={isSite ? 'soft' : 'ink'}
          numberOfLines={1}
          style={styles.title}
          accessibilityRole="header"
        >
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      <View style={styles.right}>
        {right ??
          (isSite ? (
            // The wordmark goes back to the website, like the nav on yazilnow.az.
            <PressableScale
              accessibilityRole="link"
              accessibilityLabel="yazılnow"
              onPress={() => globalThis.location?.assign('/')}
              hitSlop={8}
            >
              <Wordmark size={20} />
            </PressableScale>
          ) : null)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: gutter, paddingBottom: 8, gap: 12 },
  title: { flex: 1, textAlign: 'center' },
  right: { minWidth: 44, alignItems: 'flex-end' },
  siteBar: { minHeight: 68, paddingBottom: 12 },
});
