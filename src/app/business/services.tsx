import { router } from 'expo-router';
import { Plus, Scissors } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, MenuRow, useOwner } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { categoryIcon } from '@/data/icons';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

export default function Services() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { business } = useOwner();
  const services = business?.services ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('svcTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {services.length ? (
          <Card>
            {services.map((s, i) => (
              <MenuRow
                key={s.id}
                icon={categoryIcon[s.category] ?? Scissors}
                title={i18n.tx(s.name)}
                detail={`${i18n.duration(s.durationMin)} · ${i18n.price(s.price)}`}
                onPress={() => router.push({ pathname: '/business/service', params: { id: s.id } })}
                last={i === services.length - 1}
              />
            ))}
          </Card>
        ) : (
          <EmptyState icon={Scissors} title={i18n.t('svcEmptyTitle')} body={i18n.t('svcEmptyBody')} />
        )}
        <Button label={i18n.t('svcAdd')} icon={Plus} variant="secondary" onPress={() => router.push('/business/service')} />
      </ScrollView>
    </View>
  );
}
