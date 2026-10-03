import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { cssEase, duration } from '@/theme/tokens';

export type HapticKind = 'selection' | 'light' | 'medium' | 'none';

export function haptic(kind: HapticKind) {
  if (Platform.OS === 'web' || kind === 'none') return;
  if (kind === 'selection') Haptics.selectionAsync();
  else Haptics.impactAsync(kind === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
}

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Style for the outer hit area (layout props such as flex). */
  hitStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: HapticKind;
};

/**
 * Press feedback for every tappable surface: 3% scale in 120ms, fired on
 * press-in (the moment the user perceives), committed on release.
 */
export function PressableScale({
  children,
  style,
  hitStyle,
  scaleTo = 0.97,
  haptic: hapticKind = 'none',
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      pressRetentionOffset={16}
      disabled={disabled}
      style={hitStyle}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        haptic(hapticKind);
        onPress?.(e);
      }}
      {...rest}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale: pressed && !disabled ? scaleTo : 1 }],
            transitionProperty: 'transform',
            transitionDuration: duration.press,
            transitionTimingFunction: cssEase.out,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
