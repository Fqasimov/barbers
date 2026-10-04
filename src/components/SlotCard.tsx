import { router } from 'expo-router';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { SlotResult } from '@/data/find';
import { useI18n } from '@/i18n';
import { firstName } from '@/lib/format';
import { dayKey, fmtClock } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, shadow } from '@/theme/tokens';

import { SalonPhoto } from './SalonPhoto';
import { PressableScale } from './ui/PressableScale';
import { Text } from './ui/Text';

/** Opens the booking flow at its confirm step, with this exact slot chosen. */
export function bookSlot(s: SlotResult) {
  router.push({
    pathname: '/book/[id]',
    params: {
      id: s.salon.id,
      services: s.service.id,
      master: s.master.id,
      date: dayKey(s.date),
      time: String(s.time),
    },
  });
}

/** A bookable free slot: time first, then where and with whom. */
export const SlotCard = memo(function SlotCard({ slot, width }: { slot: SlotResult; width: number }) {
  const { c } = useTheme();
  const i18n = useI18n();
  return (
    <PressableScale
      onPress={() => bookSlot(slot)}
      scaleTo={0.97}
      accessibilityLabel={`${fmtClock(slot.time)}, ${i18n.tx(slot.service.name)}, ${slot.salon.name}, ${i18n.price(slot.service.price)}`}
      style={[styles.card, { width, backgroundColor: c.surface }, shadow(c, 1)]}
    >
      <View style={styles.top}>
        <SalonPhoto salon={slot.salon} width={40} height={40} radius={radius.sm} />
        <View style={{ flex: 1 }}>
          <Text variant="captionStrong" numberOfLines={1}>
            {slot.salon.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {i18n.distance(slot.distance)}
          </Text>
        </View>
      </View>
      <View style={[styles.time, { backgroundColor: c.successSoft }]}>
        <Text variant="title" style={{ color: c.success }}>
          {fmtClock(slot.time)}
        </Text>
      </View>
      <Text variant="callout" numberOfLines={1}>
        {i18n.tx(slot.service.name)}
      </Text>
      <Text variant="caption" tone="soft" numberOfLines={1}>
        {firstName(slot.master.name)} · {i18n.price(slot.service.price)}
      </Text>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: 12, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  time: { borderRadius: radius.sm, paddingVertical: 6, alignItems: 'center' },
});
