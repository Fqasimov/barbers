import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';
import { ease } from '@/theme/tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const R = 34;
const RING = 2 * Math.PI * R;
const CHECK = 34;

/** The ring draws itself, then the tick. A rare, earned moment — so it gets a little time. */
export function SuccessMark({ size = 88 }: { size?: number }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const ring = useSharedValue(reduced ? 1 : 0);
  const tick = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    ring.set(withTiming(1, { duration: 520, easing: ease.out }));
    tick.set(withDelay(300, withTiming(1, { duration: 320, easing: ease.out })));
  }, [reduced, ring, tick]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: RING * (1 - ring.get()) }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK * (1 - tick.get()) }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 80 80">
        <Circle cx={40} cy={40} r={R} stroke={c.line} strokeWidth={1.5} fill="none" />
        <AnimatedCircle
          cx={40}
          cy={40}
          r={R}
          stroke={c.success}
          strokeWidth={1.8}
          fill="none"
          strokeDasharray={RING}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          animatedProps={ringProps}
        />
        <AnimatedPath
          d="M 27 41 L 36 50 L 54 31"
          stroke={c.ink}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK}
          animatedProps={tickProps}
        />
      </Svg>
    </View>
  );
}
