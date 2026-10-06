import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

const ERROR_IN = FadeIn.duration(160);

/** A labelled single-choice row (radio group) styled like the form fields. */
export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
  error,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  hint?: string;
  error?: string | null;
}) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text variant="captionStrong" tone="soft" style={styles.label}>
        {label}
      </Text>
      <View style={styles.row}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <PressableScale
              key={o.value}
              onPress={() => onChange(o.value)}
              haptic="selection"
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.label}
              hitStyle={{ flex: 1 }}
              style={[
                styles.option,
                {
                  backgroundColor: on ? c.primary : c.surface,
                  borderColor: on ? c.primary : error ? c.danger : c.line,
                },
              ]}
            >
              <Text variant="bodyStrong" style={{ color: on ? c.onPrimary : c.ink }}>
                {o.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      {error ? (
        <Animated.View entering={ERROR_IN}>
          <Text variant="caption" tone="danger" style={styles.label}>
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text variant="caption" tone="muted" style={styles.label}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 2 },
  row: { flexDirection: 'row', gap: 8 },
  option: { height: 50, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
