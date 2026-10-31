import { ListTodo } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi } from '@/api/business';
import { Card, useOwner, useOwnerData } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { fmtClock } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

/** Pro: clients waiting for a time. They get a push when a booking on their day is cancelled. */
export default function Waitlist() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { business } = useOwner();
  const { data } = useOwnerData((t) => businessApi.waitlist(t));
  const service = (id: string) => business?.services?.find((s) => s.id === id);
  const master = (id: string | null) => (id ? business?.masters?.find((m) => m.id === id)?.name : null);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('waitlistTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {data && !data.length ? (
          <EmptyState icon={ListTodo} title={i18n.t('waitlistEmpty')} body={i18n.t('waitlistJoined')} />
        ) : data ? (
          <Card>
            {data.map((e, i) => (
              <View
                key={e.id}
                style={[
                  styles.row,
                  i < data.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="bodyStrong">{e.client.name || '—'}</Text>
                  <Text variant="caption" tone="soft">
                    {i18n.fullDate(new Date(`${e.date}T12:00:00`))} · {fmtClock(e.fromMin)}–
                    {fmtClock(Math.min(e.toMin, 1439))}
                  </Text>
                  <Text variant="caption" tone="soft" numberOfLines={2}>
                    {e.serviceIds
                      .map((id) => i18n.tx(service(id)?.name))
                      .filter(Boolean)
                      .join(', ')}
                    {master(e.masterId) ? ` · ${master(e.masterId)}` : ''}
                    {e.client.phone ? ` · ${e.client.phone}` : ''}
                  </Text>
                </View>
                {e.notifiedAt ? (
                  <Text variant="micro" tone="success">
                    {i18n.t('waitlistNotified')}
                  </Text>
                ) : null}
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
});
