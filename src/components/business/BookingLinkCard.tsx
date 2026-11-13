import { Copy, ExternalLink, Link2, Share2 } from 'lucide-react-native';
import { Linking, Platform, Share, StyleSheet, View } from 'react-native';

import { hasFeature } from '@/auth/plans';
import type { Business } from '@/auth/types';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { bookingLink } from '@/lib/bookingLink';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadow } from '@/theme/tokens';

/** Shown on the dashboard: the link to copy into an Instagram bio or send to clients. */
export function BookingLinkCard({ business, onPickAddress }: { business: Business; onPickAddress?: () => void }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const url = bookingLink(business);
  if (!url) return null;
  const pro = hasFeature(business, 'branches');
  const pretty = url.replace(/^https?:\/\//, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast(i18n.t('pageCopied'), 'success');
    } catch {
      void Share.share({ message: url });
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface }, shadow(c, 1)]}>
      <View style={styles.head}>
        <Link2 size={18} color={c.ink} strokeWidth={1.9} />
        <Text variant="bodyStrong">{i18n.t('linkTitle')}</Text>
      </View>
      <Text variant="caption" tone="soft">
        {i18n.t(pro ? 'linkBodyPro' : 'linkBody')}
      </Text>
      <View style={[styles.url, { backgroundColor: c.sunken }]}>
        <Text variant="bodyStrong" selectable numberOfLines={1}>
          {pretty}
        </Text>
      </View>
      <View style={styles.actions}>
        {Platform.OS === 'web' ? (
          <Button label={i18n.t('linkCopy')} icon={Copy} size="sm" onPress={copy} />
        ) : (
          <Button
            label={i18n.t('share')}
            icon={Share2}
            size="sm"
            onPress={() => void Share.share({ message: url, url })}
          />
        )}
        <Button
          label={i18n.t('linkOpen')}
          icon={ExternalLink}
          size="sm"
          variant="secondary"
          onPress={() => void Linking.openURL(url)}
        />
      </View>
      {!business.slug && onPickAddress ? (
        <Text variant="caption" tone="soft" onPress={onPickAddress} style={{ textDecorationLine: 'underline' }}>
          {i18n.t('linkPickAddress')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 16, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  url: { borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
