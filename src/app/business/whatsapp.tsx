import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { MessageCircle } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi } from '@/api/business';
import { authErrorKey } from '@/auth/flow';
import { WHATSAPP_PACK } from '@/auth/plans';
import { useOwner } from '@/components/business/kit';
import { ScreenHeader } from '@/components/ScreenHeader';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { canBuyInApp } from '@/lib/billing';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, shadow } from '@/theme/tokens';

/** Start and Pro add-on: confirmations and reminders on WhatsApp, 300 messages for 30 days. */
export default function WhatsAppPack() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { business, token, refresh } = useOwner();
  const [paying, setPaying] = useState(false);
  const pack = business?.whatsappPack;

  const buy = async () => {
    if (!token) return;
    setPaying(true);
    try {
      const { checkoutUrl } = await businessApi.whatsappCheckout(token);
      if (Platform.OS === 'web') await WebBrowser.openBrowserAsync(checkoutUrl);
      else await WebBrowser.openAuthSessionAsync(checkoutUrl, Linking.createURL('billing/return'));
    } catch (e) {
      toast(i18n.t(authErrorKey(e)), 'info');
    } finally {
      setPaying(false);
      void refresh();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('waTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <View style={[styles.card, { backgroundColor: c.surface }, shadow(c, 1)]}>
          <MessageCircle size={28} color={c.success} strokeWidth={1.8} />
          <Text variant="title">{pack?.left ? i18n.t('waLeft', { n: pack.left }) : i18n.t('waNone')}</Text>
          {pack?.until ? (
            <Text variant="caption" tone="soft">
              {i18n.t('waUntil', { date: i18n.fullDate(new Date(pack.until)) })}
            </Text>
          ) : null}
        </View>
        <Text variant="subhead" tone="soft">
          {i18n.t('waBody', { messages: WHATSAPP_PACK.messages, days: WHATSAPP_PACK.days })}
        </Text>
        {canBuyInApp ? (
          <Button label={i18n.t('waBuy', { price: i18n.price(WHATSAPP_PACK.price) })} onPress={buy} loading={paying} />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 18, gap: 6 },
});
