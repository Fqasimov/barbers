import { RefreshCw, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { businessApi } from '@/api/business';
import { useOwner, useOwnerData } from '@/components/business/kit';
import { QrCode } from '@/components/QrCode';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { gutter, radius, shadow } from '@/theme/tokens';

/**
 * "Rəy QR": after the service the master opens this and the client scans a
 * fresh one-time code. Below it, the fixed wall QR that only opens the salon page.
 */
export default function ReviewQr() {
  const { c } = useTheme();
  const i18n = useI18n();
  const insets = useSafeAreaInsets();
  const { business } = useOwner();
  const masters = business?.masters ?? [];
  const [masterId, setMasterId] = useState<string | null>(masters.length === 1 ? masters[0].id : null);
  const { data, loading, reload } = useOwnerData((t) => businessApi.reviewCode(t, masterId), [masterId]);
  const until = data ? new Date(data.expiresAt) : null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenHeader title={i18n.t('qrTitle')} />
      <ScrollView contentContainerStyle={{ padding: gutter, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <Text variant="subhead" tone="soft">
          {i18n.t('qrBody')}
        </Text>
        {masters.length > 0 ? (
          <View style={{ gap: 8 }}>
            <Text variant="captionStrong" tone="soft">
              {i18n.t('qrForMaster')}
            </Text>
            <View style={styles.chips}>
              <Chip size="sm" label={i18n.t('qrAnyMaster')} selected={!masterId} onPress={() => setMasterId(null)} />
              {masters.map((m) => (
                <Chip
                  key={m.id}
                  size="sm"
                  label={m.name}
                  selected={masterId === m.id}
                  onPress={() => setMasterId(m.id)}
                />
              ))}
            </View>
          </View>
        ) : null}
        <View style={[styles.card, { backgroundColor: c.surface }, shadow(c, 2)]}>
          <View style={styles.qr}>
            {data ? <QrCode value={data.url} size={240} /> : <View style={{ height: 240 }} />}
          </View>
          {until ? (
            <Text variant="caption" tone="soft" align="center">
              {i18n.t('qrExpires', { time: `${i18n.fullDate(until)} ${until.toTimeString().slice(0, 5)}` })}
            </Text>
          ) : null}
          <Button label={i18n.t('qrNew')} icon={RefreshCw} variant="secondary" loading={loading} onPress={reload} />
        </View>

        <Text variant="title" style={{ marginTop: 8 }}>
          {i18n.t('qrWallTitle')}
        </Text>
        <Text variant="subhead" tone="soft">
          {i18n.t('qrWallBody')}
        </Text>
        {data ? (
          <View style={[styles.card, { backgroundColor: c.surface }, shadow(c, 1)]}>
            <View style={styles.qr}>
              <QrCode value={data.wallUrl} size={180} />
            </View>
            <Text variant="caption" tone="muted" align="center" selectable>
              {data.wallUrl}
            </Text>
            <Button
              label={i18n.t('qrShare')}
              icon={Share2}
              variant="ghost"
              onPress={() => void Share.share({ message: data.wallUrl, url: data.wallUrl })}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { borderRadius: radius.lg, padding: 18, gap: 12, alignItems: 'stretch' },
  qr: { alignItems: 'center', padding: 8, backgroundColor: '#FFFFFF', borderRadius: radius.md, alignSelf: 'center' },
});
