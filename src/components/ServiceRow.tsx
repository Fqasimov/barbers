import { Check, Plus } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { Service } from '@/data/types';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration } from '@/theme/tokens';

import { PressableScale } from './ui/PressableScale';
import { Text } from './ui/Text';

type Props = { service: Service; selected: boolean; onToggle: (id: string) => void; last?: boolean };

export const ServiceRow = memo(function ServiceRow({ service, selected, onToggle, last }: Props) {
  const { c } = useTheme();
  const i18n = useI18n();
  const Icon = selected ? Check : Plus;
  return (
    <PressableScale
      onPress={() => onToggle(service.id)}
      haptic="selection"
      scaleTo={0.985}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${i18n.tx(service.name)}, ${i18n.duration(service.durationMin)}, ${i18n.price(service.price)}`}
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text variant="bodyStrong">{i18n.tx(service.name)}</Text>
        <Text variant="subhead" tone="soft">
          {i18n.duration(service.durationMin)}
        </Text>
        {service.description ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {i18n.tx(service.description)}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text variant="price">{i18n.price(service.price)}</Text>
        <Animated.View
          style={[
            styles.toggle,
            {
              backgroundColor: selected ? c.primary : c.surface,
              borderColor: selected ? c.primary : c.lineStrong,
              transitionProperty: ['backgroundColor', 'borderColor'],
              transitionDuration: duration.small,
              transitionTimingFunction: cssEase.out,
            },
          ]}
        >
          <Icon size={16} color={selected ? c.onPrimary : c.ink} strokeWidth={2.2} />
        </Animated.View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, paddingVertical: 16 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  toggle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
