import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { MapPin, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogueApi } from '@/api/catalogue';
import { isLive } from '@/api/client';
import { Card, MenuRow } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Text } from '@/components/ui/Text';
import { useCatalogue } from '@/data/catalogue';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

type Page = Awaited<ReturnType<typeof catalogueApi.page>>;

/**
 * A salon's booking link (yazilnow.az/u/<address or salon id>, or <address>.yazilnow.az):
 * what salons put in their Instagram bio. Opens the salon's page with its masters, hours
 * and free times; on Pro with several branches the client picks a branch first.
 */
export default function PersonalPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const salons = useCatalogue((s) => s.salons);
  const key = String(slug ?? '').toLowerCase();
  // Demo: the on-device catalogue; a link matches a salon by its id.
  const demo = isLive ? undefined : (salons.find((s) => s.id === key)?.id ?? null);
  const [found, setFound] = useState<{ key: string; page: Page | null } | null>(null);

  useEffect(() => {
    if (!isLive) return;
    let alive = true;
    catalogueApi.page(key).then(
      (p) => alive && setFound({ key, page: p }),
      () => alive && setFound({ key, page: null }),
    );
    return () => {
      alive = false;
    };
  }, [key]);

  const page = found?.key === key ? found.page : undefined;
  const id = demo !== undefined ? demo : page === undefined ? undefined : (page?.salonId ?? null);
  const branches = page?.branches ?? [];

  if (id && branches.length < 2) return <Redirect href={{ pathname: '/salon/[id]', params: { id } }} />;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader mode="close" title={branches.length > 1 ? page?.name : undefined} />
      {id === null ? <EmptyState icon={UserRound} title={i18n.t('pageNotFound')} body={key} /> : null}
      {branches.length > 1 ? (
        <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 12 }}>
          <Text variant="title">{i18n.t('pickBranch')}</Text>
          <Card>
            {branches.map((b, i) => (
              <MenuRow
                key={b.id}
                icon={MapPin}
                title={b.name}
                detail={[b.district, b.address].filter(Boolean).join(' · ') || undefined}
                last={i === branches.length - 1}
                onPress={() => router.push({ pathname: '/salon/[id]', params: { id: b.id } })}
              />
            ))}
          </Card>
        </ScrollView>
      ) : null}
    </View>
  );
}
