import { ChevronLeft, ChevronRight, MousePointerClick } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi, type ClickKind } from '@/api/business';
import { Card, Stat, useOwnerData } from '@/components/business/kit';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter } from '@/theme/tokens';

const KINDS: [ClickKind, StringKey][] = [
  ['view', 'clickView'],
  ['book', 'clickBook'],
  ['phone', 'clickPhone'],
  ['whatsapp', 'clickWhatsapp'],
  ['directions', 'clickDirections'],
];

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Every plan: what people tapped on the salon page, month by month. */
export default function Clicks() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const { data } = useOwnerData((t) => businessApi.clicks(t, monthKey(month)), [offset]);
  const total = data ? Object.values(data.totals).reduce((a, b) => a + b, 0) : 0;
  const label = `${i18n.monthShort(month)} ${month.getFullYear()}`;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('clicksTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Text variant="subhead" tone="soft">
          {i18n.t('clicksSub')}
        </Text>
        <View style={styles.month}>
          <PressableScale
            onPress={() => setOffset(offset + 1)}
            accessibilityRole="button"
            accessibilityLabel="‹"
            style={styles.arrow}
          >
            <ChevronLeft size={22} color={c.ink} />
          </PressableScale>
          <Text variant="headline" style={{ flex: 1, textAlign: 'center', textTransform: 'capitalize' }}>
            {label}
          </Text>
          <PressableScale
            onPress={() => setOffset(Math.max(0, offset - 1))}
            disabled={offset === 0}
            accessibilityRole="button"
            accessibilityLabel="›"
            style={[styles.arrow, { opacity: offset === 0 ? 0.3 : 1 }]}
          >
            <ChevronRight size={22} color={c.ink} />
          </PressableScale>
        </View>
        {data && total === 0 ? (
          <EmptyState icon={MousePointerClick} title={i18n.t('clicksEmpty')} body={i18n.t('clicksSub')} />
        ) : data ? (
          <>
            <View style={styles.grid}>
              {KINDS.map(([k, key]) => (
                <Stat key={k} label={i18n.t(key)} value={String(data.totals[k] ?? 0)} />
              ))}
            </View>
            <Card>
              {data.byDay.map((d, i) => (
                <View
                  key={d.date}
                  style={[
                    styles.row,
                    i < data.byDay.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line },
                  ]}
                >
                  <Text variant="subhead" style={{ width: 64 }}>
                    {d.date.slice(8, 10)}.{d.date.slice(5, 7)}
                  </Text>
                  <Text variant="caption" tone="soft" style={{ flex: 1 }}>
                    {KINDS.filter(([k]) => d[k])
                      .map(([k, key]) => `${i18n.t(key)} ${d[k]}`)
                      .join(' · ')}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  month: { flexDirection: 'row', alignItems: 'center' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
});
