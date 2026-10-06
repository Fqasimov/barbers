import { Eye, EyeOff } from 'lucide-react-native';
import { forwardRef, useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { webReset } from '@/components/ui/Field';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { cssEase, duration, fonts, radius } from '@/theme/tokens';

const ERROR_IN = FadeIn.duration(160);

type Props = Omit<TextInputProps, 'placeholder'> & {
  label: string;
  /** Plain instruction ("Enter your first name"), never a sample value. */
  placeholder: string;
  hint?: string;
  error?: string | null;
  /** Fixed text before the input, e.g. "+994". */
  prefix?: string;
  /** Password field with a show/hide toggle. */
  secure?: boolean;
  right?: ReactNode;
};

/** A labelled input with hint and error text, used by every account form. */
export const FormField = forwardRef<TextInput, Props>(function FormField(
  { label, placeholder, hint, error, prefix, secure, right, onFocus, onBlur, style, ...rest },
  ref,
) {
  const { c } = useTheme();
  const i18n = useI18n();
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  const border = error ? c.danger : focused ? c.ink : c.line;
  return (
    <View style={styles.wrap}>
      <Text variant="captionStrong" tone="soft" style={styles.label} nativeID={`${label}-label`}>
        {label}
      </Text>
      <Animated.View
        style={[
          styles.box,
          {
            backgroundColor: c.surface,
            borderColor: border,
            transitionProperty: 'borderColor',
            transitionDuration: duration.small,
            transitionTimingFunction: cssEase.out,
          },
        ]}
      >
        {prefix ? (
          <View style={[styles.prefix, { borderColor: c.line }]}>
            <Text variant="body" tone="soft">
              {prefix}
            </Text>
          </View>
        ) : null}
        <TextInput
          ref={ref}
          placeholder={placeholder}
          placeholderTextColor={c.inkMuted}
          accessibilityLabel={label}
          accessibilityHint={hint}
          aria-invalid={!!error}
          secureTextEntry={secure && !shown}
          autoCapitalize={secure ? 'none' : rest.autoCapitalize}
          autoCorrect={secure ? false : rest.autoCorrect}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
          style={[styles.input, { color: c.ink }, webReset, style]}
        />
        {secure ? (
          <PressableScale
            onPress={() => setShown((s) => !s)}
            hitSlop={8}
            accessibilityLabel={shown ? i18n.t('hidePassword') : i18n.t('showPassword')}
            style={styles.eye}
          >
            {shown ? (
              <EyeOff size={20} color={c.inkSoft} strokeWidth={1.9} />
            ) : (
              <Eye size={20} color={c.inkSoft} strokeWidth={1.9} />
            )}
          </PressableScale>
        ) : null}
        {right}
      </Animated.View>
      {error ? (
        <Animated.View entering={ERROR_IN}>
          <Text variant="caption" tone="danger" style={styles.below} accessibilityLiveRegion="polite">
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text variant="caption" tone="muted" style={styles.below}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginLeft: 2 },
  box: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, minHeight: 50 },
  prefix: {
    paddingLeft: 14,
    paddingRight: 10,
    borderRightWidth: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  input: { flex: 1, minWidth: 0, fontFamily: fonts.regular, fontSize: 16, paddingHorizontal: 14, paddingVertical: 13 },
  eye: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 3 },
  below: { marginLeft: 2 },
});
