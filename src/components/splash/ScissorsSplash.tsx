import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { brand, ease, fonts } from '@/theme/tokens';

/**
 * Thirteen rendered frames of a pair of steel barber shears, 0° (shut) to 30°
 * (wide open) in 2.5° steps. Rendered in 3D with studio lighting and a real
 * contact shadow, so the snip reads as an object on the table, not an icon.
 */
const FRAMES = [
  require('../../../assets/splash/shears-00.webp'),
  require('../../../assets/splash/shears-01.webp'),
  require('../../../assets/splash/shears-02.webp'),
  require('../../../assets/splash/shears-03.webp'),
  require('../../../assets/splash/shears-04.webp'),
  require('../../../assets/splash/shears-05.webp'),
  require('../../../assets/splash/shears-06.webp'),
  require('../../../assets/splash/shears-07.webp'),
  require('../../../assets/splash/shears-08.webp'),
  require('../../../assets/splash/shears-09.webp'),
  require('../../../assets/splash/shears-10.webp'),
  require('../../../assets/splash/shears-11.webp'),
  require('../../../assets/splash/shears-12.webp'),
];
const LAST = FRAMES.length - 1;

/** Must match `imageWidth` of the native splash in app.json, so the hand-off is seamless. */
export const SPLASH_SHEARS_WIDTH = 280;
const SHEARS_HEIGHT = Math.round((SPLASH_SHEARS_WIDTH * 617) / 840);
/** Long enough for two snips, short enough to never feel like waiting. */
const MIN_HOLD_MS = 1300;

type Props = { ready: boolean; onDone: () => void };

/**
 * Launch sequence (once per cold start):
 *  1. The shears snip open and shut while the store hydrates.
 *  2. One last full snip; as the blades close, the wordmark is cut — its top half slips sideways.
 *  3. Everything lifts away and the app (same linen) is simply there.
 * Reduced motion: shears stay shut, a single crossfade.
 */
export function ScissorsSplash({ ready, onDone }: Props) {
  const reduced = useReducedMotion();
  const open = useSharedValue(0);
  const cut = useSharedValue(0);
  const word = useSharedValue(0);
  const out = useSharedValue(0);

  const [held, setHeld] = useState(false);
  const finishing = useRef(false);

  useEffect(() => {
    word.set(withDelay(200, withTiming(1, { duration: 520, easing: ease.out })));
    if (!reduced) {
      open.set(
        withDelay(
          260,
          withRepeat(
            withSequence(
              withTiming(LAST * 0.7, { duration: 300, easing: ease.inOut }),
              withTiming(0, { duration: 150, easing: Easing.in(Easing.quad) }),
              withTiming(0, { duration: 160 }),
            ),
            -1,
          ),
        ),
      );
    }
    const t = setTimeout(() => setHeld(true), MIN_HOLD_MS);
    // Belt and braces: never leave the native splash up if the first frame is slow to report.
    const hide = setTimeout(() => SplashScreen.hide(), 700);
    return () => {
      clearTimeout(t);
      clearTimeout(hide);
    };
  }, [open, word, reduced]);

  const leave = useCallback(() => {
    out.set(
      withDelay(
        reduced ? 0 : 260,
        withTiming(1, { duration: reduced ? 300 : 380, easing: ease.out }, (finished) => {
          if (finished) scheduleOnRN(onDone);
        }),
      ),
    );
  }, [out, reduced, onDone]);

  const finish = useCallback(() => {
    if (finishing.current) return;
    finishing.current = true;
    if (reduced) return leave();
    cancelAnimation(open);
    open.set(
      withSequence(
        withTiming(LAST, { duration: 260, easing: ease.inOut }),
        withTiming(0, { duration: 130, easing: Easing.in(Easing.quad) }, (finished) => {
          if (finished) scheduleOnRN(leave);
        }),
      ),
    );
    // The cut lands as the blades meet.
    cut.set(withDelay(330, withTiming(1, { duration: 220, easing: ease.out })));
  }, [reduced, open, cut, leave]);

  useEffect(() => {
    if (ready && held) finish();
  }, [ready, held, finish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: 1 - out.get() }));
  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -out.get() * 24 }, { scale: 1 - out.get() * 0.03 }],
  }));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: word.get(),
    transform: [{ translateY: (1 - word.get()) * 8 }],
  }));
  const topSlice = useAnimatedStyle(() => ({ transform: [{ translateX: cut.get() * 3 }] }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, rootStyle]}
      accessibilityLabel="Usta"
      accessibilityRole="progressbar"
    >
      <Pressable style={styles.center} onPress={() => ready && finish()} accessible={false}>
        <Animated.View style={[styles.stage, stageStyle]}>
          <View style={{ width: SPLASH_SHEARS_WIDTH, height: SHEARS_HEIGHT }}>
            {FRAMES.map((src, i) => (
              <Frame
                key={i}
                index={i}
                source={src}
                open={open}
                onShown={i === 0 ? () => SplashScreen.hide() : undefined}
              />
            ))}
          </View>
          <Animated.View style={[styles.wordmark, wordStyle]}>
            <View style={{ height: WORD_LH }}>
              <Animated.View style={[styles.slice, { top: 0, height: CUT_AT }, topSlice]}>
                <Word />
              </Animated.View>
              <View style={[styles.slice, { top: CUT_AT, bottom: 0 }]}>
                <View style={{ marginTop: -CUT_AT }}>
                  <Word />
                </View>
              </View>
              <View style={{ opacity: 0 }}>
                <Word />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const WORD_SIZE = 40;
const WORD_LH = Math.round(WORD_SIZE * 1.12);
const CUT_AT = Math.round(WORD_SIZE * 0.62);

function Word() {
  return (
    <Animated.Text maxFontSizeMultiplier={1} style={styles.word}>
      usta
    </Animated.Text>
  );
}

function Frame({
  index,
  source,
  open,
  onShown,
}: {
  index: number;
  source: number;
  open: SharedValue<number>;
  onShown?: () => void;
}) {
  const style = useAnimatedStyle(() => ({ opacity: Math.round(open.get()) === index ? 1 : 0 }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        cachePolicy="memory"
        transition={0}
        onDisplay={onShown}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 100, backgroundColor: brand.linen },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stage: { alignItems: 'center' },
  wordmark: { position: 'absolute', top: SHEARS_HEIGHT + 56 },
  slice: { position: 'absolute', left: 0, right: 0, overflow: 'hidden' },
  word: {
    fontFamily: fonts.bold,
    fontSize: WORD_SIZE,
    lineHeight: WORD_LH,
    letterSpacing: -WORD_SIZE * 0.045,
    color: brand.ink,
  },
});
