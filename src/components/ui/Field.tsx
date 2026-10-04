import { forwardRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, fonts, radius } from '@/theme/tokens';

/**
 * Text input with a visible, on-brand focus state (the border darkens) instead
 * of the browser's default outline on web.
 */
export const Field = forwardRef<TextInput, TextInputProps & { multilineHeight?: number }>(function Field(
  { style, multilineHeight = 120, onFocus, onBlur, multiline, ...rest },
  ref,
) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <Animated.View
      style={[
        styles.box,
        {
          backgroundColor: c.surface,
          // Constant width — only the colour changes, so focusing never shifts layout.
          borderColor: focused ? c.ink : c.line,
          transitionProperty: 'borderColor',
          transitionDuration: duration.small,
          transitionTimingFunction: cssEase.out,
        },
      ]}
    >
      <TextInput
        ref={ref}
        placeholderTextColor={c.inkMuted}
        multiline={multiline}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...rest}
        style={[
          styles.input,
          { color: c.ink },
          multiline && { minHeight: multilineHeight, textAlignVertical: 'top' },
          webReset,
          style,
        ]}
      />
    </Animated.View>
  );
});

/** RN Web draws a UA focus outline on inputs; our container carries focus instead. */
export const webReset = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null;

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, borderWidth: 1 },
  input: { fontFamily: fonts.regular, fontSize: 16, paddingHorizontal: 14, paddingVertical: 12 },
});
