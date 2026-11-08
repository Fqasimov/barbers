import { useEffect, useState, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { cssEase } from '@/theme/tokens';

/**
 * Enter animation for a screen's blocks: a 10 px rise and fade, 260 ms, ease-out,
 * `index` × 50 ms apart so the page assembles top to bottom. Transform and opacity
 * only (the same CSS-transition mechanism the rest of the app uses); nothing moves
 * for people who asked for reduced motion.
 */
export function Reveal({
  children,
  index = 0,
  style,
}: {
  children: ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(!!reduced);
  useEffect(() => {
    if (reduced) return;
    // One frame after mount, so the browser has painted the hidden state to transition from.
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: shown ? 1 : 0,
          transform: [{ translateY: shown ? 0 : 10 }],
          transitionProperty: ['opacity', 'transform'],
          transitionDuration: reduced ? 0 : 260,
          transitionDelay: reduced ? 0 : index * 50,
          transitionTimingFunction: cssEase.out,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
