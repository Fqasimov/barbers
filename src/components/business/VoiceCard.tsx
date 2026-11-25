import { PhoneCall } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import type { Business } from '@/auth/types';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadow } from '@/theme/tokens';

/** Voice assistant add-on: this month's minutes against the pack, extra minutes and the cap. */
export function VoiceCard({ business }: { business: Business }) {
  const { c } = useTheme();
  const i18n = useI18n();
  const v = business.voice;
  if (!v || !v.active) return null;
  const share = Math.min(1, v.used / Math.max(1, v.cap));
  const packShare = v.pack / Math.max(1, v.cap);
  const bar = v.capped ? c.danger : v.extra > 0 ? c.accent : c.success;

  return (
    <View style={[styles.card, { backgroundColor: c.surface }, shadow(c, 1)]}>
      <View style={styles.head}>
        <PhoneCall size={18} color={c.ink} strokeWidth={1.9} />
        <Text variant="bodyStrong">{i18n.t('voiceTitle')}</Text>
      </View>
      <Text variant="subhead">{i18n.t('voiceUsed', { used: String(v.used), pack: String(v.pack) })}</Text>
      <View style={[styles.track, { backgroundColor: c.sunken }]}>
        <View style={[styles.fill, { width: `${Math.round(share * 100)}%`, backgroundColor: bar }]} />
        <View style={[styles.mark, { left: `${Math.round(packShare * 100)}%`, backgroundColor: c.lineStrong }]} />
      </View>
      {v.extra > 0 ? (
        <Text variant="caption">
          {i18n.t('voiceExtra', { extra: String(v.extra), owed: v.owed.toFixed(2), price: v.extraPrice.toFixed(2) })}
        </Text>
      ) : null}
      <Text variant="caption" tone="soft">
        {v.capped ? i18n.t('voiceCapped', { cap: String(v.cap) }) : i18n.t('voiceLimitNote', { cap: String(v.cap) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 16, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden', position: 'relative' },
  fill: { height: 8, borderRadius: 4 },
  mark: { position: 'absolute', top: 0, bottom: 0, width: 2 },
});
