import { Store, WifiOff } from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { Text } from '@/components/ui/Text';
import { useCatalogue } from '@/data/catalogue';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Shows the screen once there are venues to show. Live mode starts from the
 * device's cached catalogue; only a first launch without a connection waits here.
 */
export function CatalogueGate({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const count = useCatalogue((s) => s.salons.length);
  const status = useCatalogue((s) => s.status);
  const load = useCatalogue((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);

  if (count) return <>{children}</>;
  return <View style={[styles.fill, { backgroundColor: c.bg }]}>{placeholder()}</View>;

  function placeholder() {
  if (status === 'error') {
    return (
      <EmptyState
        icon={WifiOff}
        title={i18n.t('catalogueErrorTitle')}
        body={i18n.t('catalogueErrorBody')}
        action={{ label: i18n.t('retry'), onPress: () => void load(true) }}
      />
    );
  }
  if (status === 'ready') {
    return <EmptyState icon={Store} title={i18n.t('catalogueEmptyTitle')} body={i18n.t('catalogueEmptyBody')} />;
  }
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={c.inkSoft} />
      <Text variant="subhead" tone="soft">
        {i18n.t('catalogueLoading')}
      </Text>
    </View>
  );
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'center' },
  loading: { alignItems: 'center', gap: 12, paddingVertical: 64 },
});
