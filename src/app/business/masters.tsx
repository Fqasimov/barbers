import { router } from 'expo-router';
import { Plus, Users } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, useOwner } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

export default function Masters() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { business } = useOwner();
  const masters = business?.masters ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('mstTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {masters.length ? (
          <Card>
            {masters.map((m, i) => (
              <PressableScale
                key={m.id}
                onPress={() => router.push({ pathname: '/business/master', params: { id: m.id } })}
                haptic="light"
                scaleTo={0.99}
                accessibilityRole="button"
                accessibilityLabel={m.name}
                style={[styles.row, i < masters.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
              >
                <Avatar name={m.name} tone={m.tone} size={40} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{m.name}</Text>
                  <Text variant="caption" tone="soft" numberOfLines={1}>
                    {i18n.tx(m.role)} · {i18n.n(m.serviceIds.length, 'service')} · {m.shift.start}–{m.shift.end}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </Card>
        ) : (
          <EmptyState icon={Users} title={i18n.t('mstEmptyTitle')} body={i18n.t('mstEmptyBody')} />
        )}
        <Button label={i18n.t('mstAdd')} icon={Plus} variant="secondary" onPress={() => router.push('/business/master')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
});
