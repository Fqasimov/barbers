import { Redirect, useLocalSearchParams } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { catalogueApi } from '@/api/catalogue';
import { isLive } from '@/api/client';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useCatalogue } from '@/data/catalogue';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * A personal page address: https://orxanosmanov.yazilnow.az (the website sends it
 * to /app/u/orxanosmanov). Opens the master's or salon's page.
 */
export default function PersonalPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { c } = useTheme();
  const i18n = useI18n();
  const salons = useCatalogue((s) => s.salons);
  const key = String(slug ?? '').toLowerCase();
  // Demo: the on-device catalogue; a page address matches a salon by its id.
  const demo = isLive ? undefined : (salons.find((s) => s.id === key)?.id ?? null);
  const [found, setFound] = useState<{ key: string; id: string | null } | null>(null);

  useEffect(() => {
    if (!isLive) return;
    let alive = true;
    catalogueApi.page(key).then(
      (p) => alive && setFound({ key, id: p.salonId }),
      () => alive && setFound({ key, id: null }),
    );
    return () => {
      alive = false;
    };
  }, [key]);

  const id = demo !== undefined ? demo : found?.key === key ? found.id : undefined;
  const missing = id === null;

  if (id) return <Redirect href={{ pathname: '/salon/[id]', params: { id } }} />;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader mode="close" />
      {missing ? <EmptyState icon={UserRound} title={i18n.t('pageNotFound')} body={`${slug}.yazilnow.az`} /> : null}
    </View>
  );
}
