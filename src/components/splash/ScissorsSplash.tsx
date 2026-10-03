import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { APP_NAME, TAGLINE } from '@/constants/brand';
import { brand, ease, fonts } from '@/theme/tokens';

import { ScissorsArt } from './Scissors';

/** Must match `imageWidth` of the native splash in app.json, so the hand-off is seamless. */
export const SPLASH_SCISSORS_SIZE = 200;
/** Long enough to read as a snip-snip-snip, short enough to never feel like waiting. */
const MIN_HOLD_MS = 1350;

type Props = { ready: boolean; onDone: () => void };

/**
 * Launch sequence (once per cold start — the delight tier):
 *  1. The scissors snip open and shut while the app hydrates.
 *  2. One decisive snip; a hairline cut shoots across the screen.
 *  3. The ink sheet parts along the cut and reveals the app.
 * Reduced motion: no snipping, a single crossfade.
 */
export function ScissorsSplash({ ready, onDone }: Props) {
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();

  const open = useSharedValue(0);
  const cut = useSharedValue(0);
  const split = useSharedValue(0);
  const tools = useSharedValue(1);
  const word = useSharedValue(0);
  const fade = useSharedValue(1);

  const [held, setHeld] = useState(false);
  const finishing = useRef(false);

  useEffect(() => {
    word.set(withDelay(220, withTiming(1, { duration: 600, easing: ease.out })));
    if (!reduced) {
      open.set(
        withDelay(
          180,
          withRepeat(
            withSequence(
              withTiming(22, { duration: 280, easing: ease.inOut }),
              withTiming(0, { duration: 140, easing: ease.out }),
              withTiming(0, { duration: 120 }),
            ),
            -1,
          ),
        ),
      );
    }
    const t = setTimeout(() => setHeld(true), MIN_HOLD_MS);
    return () => clearTimeout(t);
  }, [open, word, reduced]);

  const part = useCallback(() => {
    cut.set(withTiming(1, { duration: 260, easing: ease.out }));
    tools.set(withDelay(240, withTiming(0, { duration: 160, easing: ease.out })));
    split.set(
      withDelay(
        280,
        withTiming(1, { duration: 720, easing: ease.inOut }, (finished) => {
          if (finished) scheduleOnRN(onDone);
        }),
      ),
    );
  }, [cut, tools, split, onDone]);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    if (reduced) {
      fade.set(
        withTiming(0, { duration: 320, easing: ease.out }, (finished) => {
          if (finished) scheduleOnRN(onDone);
        }),
      );
      return;
    }
    cancelAnimation(open);
    open.set(
      withSequence(
        withTiming(34, { duration: 240, easing: ease.inOut }),
        withTiming(0, { duration: 120, easing: ease.out }, (finished) => {
          if (finished) scheduleOnRN(part);
        }),
      ),
    );
  }, [reduced, fade, open, part, onDone]);

  useEffect(() => {
    if (ready && held) finish();
  }, [ready, held, finish]);

  const half = height / 2;

  const topStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -split.get() * (half + 4) }] }));
  const bottomStyle = useAnimatedStyle(() => ({ transform: [{ translateY: split.get() * (half + 4) }] }));
  const edgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(split.get(), [0, 0.02, 1], [0, 0.7, 0.25]),
  }));
  const cutStyle = useAnimatedStyle(() => ({ opacity: tools.get(), transform: [{ scaleX: cut.get() }] }));
  const scissorsStyle = useAnimatedStyle(() => ({
    opacity: tools.get(),
    transform: [{ scale: interpolate(tools.get(), [0, 1], [0.94, 1]) }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.get(),
    transform: [{ translateY: (1 - word.get()) * 10 }],
  }));
  const rootStyle = useAnimatedStyle(() => ({ opacity: fade.get() }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
      onLayout={() => SplashScreen.hide()}
      accessibilityLabel={`${APP_NAME} is loading`}
      accessibilityRole="progressbar"
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => ready && finish()} accessible={false}>
        <Animated.View style={[styles.half, { top: 0, height: half }, topStyle]}>
          <Animated.View style={[styles.edge, { bottom: 0 }, edgeStyle]} />
        </Animated.View>

        <Animated.View style={[styles.half, { top: half, height: half }, bottomStyle]}>
          <Animated.View style={[styles.edge, { top: 0 }, edgeStyle]} />
          <Animated.View style={[styles.wordmark, wordStyle]}>
            <Animated.Text style={styles.word} maxFontSizeMultiplier={1}>
              {APP_NAME}
            </Animated.Text>
            <Animated.Text style={styles.tagline} maxFontSizeMultiplier={1}>
              {TAGLINE.toUpperCase()}
            </Animated.Text>
          </Animated.View>
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.cut, { top: half - 0.5 }, cutStyle]} />

        <View pointerEvents="none" style={[styles.center, { top: half - SPLASH_SCISSORS_SIZE / 2 }]}>
          <Animated.View style={scissorsStyle}>
            <ScissorsArt size={SPLASH_SCISSORS_SIZE} open={open} />
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100 },
  half: { position: 'absolute', left: 0, right: 0, backgroundColor: brand.ink },
  edge: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: brand.brass },
  cut: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: brand.brassLight },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  wordmark: { position: 'absolute', top: 92, left: 0, right: 0, alignItems: 'center' },
  word: {
    fontFamily: fonts.displayLightItalic,
    fontSize: 46,
    lineHeight: 54,
    letterSpacing: -0.5,
    color: brand.bone,
  },
  tagline: {
    marginTop: 6,
    fontFamily: fonts.mono,
    fontSize: 10.5,
    letterSpacing: 2.4,
    color: brand.brass,
    opacity: 0.8,
  },
});
