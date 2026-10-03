import { StyleSheet, View } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { brand } from '@/theme/tokens';

/**
 * Drawn on a 240×240 box with the pivot screw at the exact centre, so each
 * half rotates about the pivot simply by rotating its own view.
 * Half A carries the upper blade and the lower handle; half B is its mirror.
 */
const BOX = 240;
const C = BOX / 2;

const blade = (m: (y: number) => number) =>
  `M 100 ${m(121)} L 228 ${m(119.4)} C 204 ${m(113.5)} 166 ${m(105.5)} 132 ${m(104)} ` +
  `C 117 ${m(103.6)} 104 ${m(108)} 100 ${m(114)} Z`;

const edgeHighlight = (m: (y: number) => number) => `M 132 ${m(105.6)} C 166 ${m(107)} 200 ${m(114)} 222 ${m(119)}`;

const shank = (m: (y: number) => number) =>
  `M 104 ${m(113)} C 92 ${m(122)} 80 ${m(133)} 66 ${m(147)} L 74 ${m(155)} C 88 ${m(142)} 102 ${m(131)} 117 ${m(124)} Z`;

const id = (y: number) => y;
const mirror = (y: number) => BOX - y;

function Half({ flipped, gradientId }: { flipped?: boolean; gradientId: string }) {
  const m = flipped ? mirror : id;
  const fill = `url(#${gradientId})`;
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${BOX} ${BOX}`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1={flipped ? '1' : '0'} x2="1" y2={flipped ? '0' : '1'}>
          <Stop offset="0" stopColor={brand.brassLight} />
          <Stop offset="0.48" stopColor={brand.brass} />
          <Stop offset="1" stopColor={brand.brassDeep} />
        </LinearGradient>
      </Defs>
      <Path d={blade(m)} fill={fill} />
      <Path d={edgeHighlight(m)} stroke="#FFF1D6" strokeOpacity={0.55} strokeWidth={0.9} fill="none" />
      <Path d={shank(m)} fill={fill} />
      <Circle cx={46} cy={m(166)} r={20} stroke={fill} strokeWidth={9} fill="none" />
    </Svg>
  );
}

export function ScissorsArt({ size, open }: { size: number; open: SharedValue<number> }) {
  const a = useAnimatedStyle(() => ({ transform: [{ rotate: `${-open.get()}deg` }] }));
  const b = useAnimatedStyle(() => ({ transform: [{ rotate: `${open.get()}deg` }] }));
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, b]}>
        <Half flipped gradientId="usta-blade-b" />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, a]}>
        <Half gradientId="usta-blade-a" />
      </Animated.View>
      <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${BOX} ${BOX}`}>
        <Circle cx={C} cy={C} r={6.5} fill={brand.brassLight} />
        <Circle cx={C} cy={C} r={2.2} fill={brand.ink} />
      </Svg>
    </View>
  );
}

/** Static, closed scissors — used for empty states and the app icon. */
export function ScissorsStatic({ size, color }: { size: number; color?: string }) {
  const m = id;
  const f = color ?? brand.brass;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${BOX} ${BOX}`}>
      {[id, mirror].map((mm, i) => (
        <Path key={`s${i}`} d={shank(mm)} fill={f} />
      ))}
      {[id, mirror].map((mm, i) => (
        <Circle key={`c${i}`} cx={46} cy={mm(166)} r={20} stroke={f} strokeWidth={9} fill="none" />
      ))}
      <Path d={blade(mirror)} fill={f} />
      <Path d={blade(m)} fill={f} />
      <Circle cx={C} cy={C} r={6.5} fill={f} />
    </Svg>
  );
}
