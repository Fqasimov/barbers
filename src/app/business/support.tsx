import * as Linking from 'expo-linking';
import { Mail, Phone, ShieldCheck } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi } from '@/api/business';
import { useOwnerData } from '@/components/business/kit';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, shadow } from '@/theme/tokens';

/** How to reach us. Pro gets the priority phone line. */
export default function Support() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { data } = useOwnerData((t) => businessApi.support(t));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('supportTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        {data ? (
          <>
            {data.priority && data.phone ? (
              <View style={[styles.card, { backgroundColor: c.primary }]}>
                <ShieldCheck size={22} color={c.onPrimary} strokeWidth={1.9} />
                <Text variant="headline" style={{ color: c.onPrimary }}>
                  {i18n.t('supportPriority')}
                </Text>
                <Text variant="title" style={{ color: c.onPrimary }}>
                  {data.phone}
                </Text>
                <Button
                  label={i18n.t('supportCall')}
                  icon={Phone}
                  variant="secondary"
                  size="sm"
                  onPress={() => void Linking.openURL(`tel:${data.phone!.replace(/[^\d+]/g, '')}`)}
                />
              </View>
            ) : null}
            <View style={[styles.card, { backgroundColor: c.surface }, shadow(c, 1)]}>
              <Text variant="bodyStrong">{data.email}</Text>
              <Text variant="caption" tone="soft">
                {i18n.t('supportHours', { hours: data.hours })}
              </Text>
              <Button
                label={i18n.t('supportWrite')}
                icon={Mail}
                variant="secondary"
                size="sm"
                onPress={() => void Linking.openURL(`mailto:${data.email}`)}
              />
            </View>
            {!data.priority ? (
              <Text variant="caption" tone="soft">
                {i18n.t('supportPriority')}
              </Text>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 18, gap: 8, alignItems: 'flex-start' },
});
