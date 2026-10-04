import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { groupSlots } from '@/data/availability';
import { useI18n } from '@/i18n';
import { fmtClock } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, fonts, radius } from '@/theme/tokens';

import { PressableScale } from '../ui/PressableScale';
import { Text } from '../ui/Text';

type Props = { slots: number[]; selected: number | null; onSelect: (minutes: number) => void };

export function TimeGrid({ slots, selected, onSelect }: Props) {
  const { c } = useTheme();
  const i18n = useI18n();
  return (
    <View style={{ gap: 22 }}>
      {groupSlots(slots).map((group) => (
        <View key={group.label} style={{ gap: 10 }}>
          <View style={styles.groupHead}>
            <Text variant="bodyStrong">{i18n.t(group.label)}</Text>
            <Text variant="caption" tone="muted">
              {i18n.n(group.slots.length, 'slot')}
            </Text>
          </View>
          <View style={styles.grid} accessibilityRole="radiogroup">
            {group.slots.map((t) => {
              const active = t === selected;
              return (
                <PressableScale
                  key={t}
                  hitStyle={styles.cellWrap}
                  onPress={() => onSelect(t)}
                  haptic="selection"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={fmtClock(t)}
                >
                  <Animated.View
                    style={[
                      styles.cell,
                      {
                        backgroundColor: active ? c.primary : c.surface,
                        borderColor: active ? c.primary : c.line,
                        transitionProperty: ['backgroundColor', 'borderColor'],
                        transitionDuration: duration.small,
                        transitionTimingFunction: cssEase.out,
                      },
                    ]}
                  >
                    <Animated.Text
                      maxFontSizeMultiplier={1.3}
                      style={[
                        styles.time,
                        {
                          color: active ? c.onPrimary : c.ink,
                          transitionProperty: 'color',
                          transitionDuration: duration.small,
                        },
                      ]}
                    >
                      {fmtClock(t)}
                    </Animated.Text>
                  </Animated.View>
                </PressableScale>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  groupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cellWrap: { width: '25%', padding: 4 },
  cell: {
    height: 46,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  time: { fontFamily: fonts.semibold, fontSize: 15, fontVariant: ['tabular-nums'] },
});
