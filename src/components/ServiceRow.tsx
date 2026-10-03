import { Check, Plus } from 'lucide-react-native';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { Service } from '@/data/types';
import { fmtPrice } from '@/lib/format';
import { fmtDuration } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration } from '@/theme/tokens';

import { PressableScale } from './ui/PressableScale';
import { Text } from './ui/Text';

type Props = { service: Service; selected: boolean; onToggle: (id: string) => void; last?: boolean };

export const ServiceRow = memo(function ServiceRow({ service, selected, onToggle, last }: Props) {
  const { c } = useTheme();
  const Icon = selected ? Check : Plus;
  return (
    <PressableScale
      onPress={() => onToggle(service.id)}
      haptic="selection"
      scaleTo={0.985}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${service.name}, ${fmtDuration(service.durationMin)}, ${service.price} manat`}
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.line }]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text variant="serif" style={{ fontSize: 18 }}>
          {service.name}
        </Text>
        {service.description ? (
          <Text variant="caption" tone="soft" numberOfLines={2}>
            {service.description}
          </Text>
        ) : null}
        <Text variant="mono" tone="muted" style={{ marginTop: 4 }}>
          {fmtDuration(service.durationMin).toUpperCase()}
        </Text>
      </View>
      <View style={styles.right}>
        <Text variant="price">{fmtPrice(service.price)}</Text>
        <Animated.View
          style={[
            styles.toggle,
            {
              backgroundColor: selected ? c.primary : 'transparent',
              borderColor: selected ? c.primary : c.lineStrong,
              transitionProperty: ['backgroundColor', 'borderColor'],
              transitionDuration: duration.small,
              transitionTimingFunction: cssEase.out,
            },
          ]}
        >
          <Icon size={16} color={selected ? c.onPrimary : c.ink} strokeWidth={1.8} />
        </Animated.View>
      </View>
    </PressableScale>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, paddingVertical: 18 },
  right: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  toggle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
