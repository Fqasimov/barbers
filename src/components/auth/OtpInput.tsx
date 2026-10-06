import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { webReset } from '@/components/ui/Field';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius } from '@/theme/tokens';

export const OTP_LENGTH = 6;

/**
 * Six boxes over one hidden input, so paste, SMS/e-mail autofill
 * (`oneTimeCode`) and the system keyboard all behave natively.
 */
export function OtpInput({
  value,
  onChange,
  error,
  label,
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  label: string;
  autoFocus?: boolean;
}) {
  const { c } = useTheme();
  const ref = useRef<TextInput>(null);
  const digits = value.split('');
  return (
    <Pressable onPress={() => ref.current?.focus()} accessible={false}>
      <View style={styles.row}>
        {Array.from({ length: OTP_LENGTH }, (_, i) => {
          const active = i === Math.min(value.length, OTP_LENGTH - 1);
          return (
            <View
              key={i}
              style={[
                styles.cell,
                {
                  backgroundColor: c.surface,
                  borderColor: error ? c.danger : active ? c.ink : c.line,
                  borderWidth: active || error ? 1.5 : 1,
                },
              ]}
            >
              <Text style={[styles.digit, { color: c.ink }]}>{digits[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        autoFocus={autoFocus}
        accessibilityLabel={label}
        caretHidden
        style={[StyleSheet.absoluteFill, styles.hidden, webReset]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  cell: { flex: 1, maxWidth: 56, height: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  digit: { fontFamily: fonts.semibold, fontSize: 24, fontVariant: ['tabular-nums'] },
  hidden: { opacity: 0.011, color: 'transparent' },
});
