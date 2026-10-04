import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';

import type { Coords } from '@/data/types';
import { useI18n } from '@/i18n';
import { distanceKm } from '@/lib/geo';
import { useTheme } from '@/theme/ThemeProvider';
import { ease, fonts } from '@/theme/tokens';

import { RatingPin } from './RatingPin';
import type { MapCanvasProps } from './types';

/**
 * Web has no native map SDK here, so this draws an illustrated Baku — the
 * Caspian shoreline, district names, a quiet street grid — with the same pins
 * as the native map. A camera follows the selected venue and can be dragged.
 */
const COAST: [number, number][] = [
  [40.25, 49.8],
  [40.3, 49.818],
  [40.322, 49.83],
  [40.336, 49.84],
  [40.348, 49.846],
  [40.358, 49.85],
  [40.364, 49.856],
  [40.368, 49.866],
  [40.37, 49.878],
  [40.37, 49.892],
  [40.372, 49.91],
  [40.378, 49.93],
  [40.384, 49.955],
  [40.39, 49.99],
  [40.4, 50.05],
];

const DISTRICTS: { name: string; at: Coords }[] = [
  { name: 'İÇƏRİŞƏHƏR', at: { latitude: 40.3628, longitude: 49.8318 } },
  { name: 'YASAMAL', at: { latitude: 40.3985, longitude: 49.8085 } },
  { name: 'NƏSİMİ', at: { latitude: 40.3905, longitude: 49.8355 } },
  { name: 'NƏRİMANOV', at: { latitude: 40.4085, longitude: 49.8735 } },
  { name: 'XƏTAİ', at: { latitude: 40.3905, longitude: 49.8905 } },
  { name: 'BAYIL', at: { latitude: 40.3445, longitude: 49.8255 } },
  { name: 'GƏNCLİK', at: { latitude: 40.4075, longitude: 49.8455 } },
  { name: 'AĞ ŞƏHƏR', at: { latitude: 40.3845, longitude: 49.9115 } },
  { name: '8-Cİ KM', at: { latitude: 40.4075, longitude: 49.9455 } },
];

const PAD = 40;

export function MapCanvas({ items, activeId, origin, onSelect, insets }: MapCanvasProps) {
  const i18n = useI18n();
  const { c, scheme } = useTheme();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const viewH = Math.max(1, size.h - insets.top - insets.bottom);
  const focus = { x: size.w / 2, y: insets.top + viewH / 2 };

  // Scale to fit the core cluster (outliers stay reachable by panning).
  const { project, extent } = useMemo(() => {
    const byDistance = [...items].sort(
      (a, b) => distanceKm(origin, a.salon.coords) - distanceKm(origin, b.salon.coords),
    );
    const core = [
      origin,
      ...byDistance.slice(0, Math.max(2, Math.ceil(byDistance.length * 0.8))).map((i) => i.salon.coords),
    ];
    const lats = core.map((p) => p.latitude);
    const lons = core.map((p) => p.longitude);
    const lat0 = (Math.min(...lats) + Math.max(...lats)) / 2;
    const lon0 = (Math.min(...lons) + Math.max(...lons)) / 2;
    const k = Math.cos((lat0 * Math.PI) / 180);
    const spanX = Math.max(0.012, (Math.max(...lons) - Math.min(...lons)) * k);
    const spanY = Math.max(0.012, Math.max(...lats) - Math.min(...lats));
    const scale = Math.min((size.w - PAD * 2) / spanX, (viewH - PAD * 2) / spanY);
    const proj = (p: Coords) => ({ x: (p.longitude - lon0) * k * scale, y: -(p.latitude - lat0) * scale });
    const all = [origin, ...items.map((i) => i.salon.coords)].map(proj);
    const ext = Math.max(800, ...all.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y)))) + 700;
    return { project: proj, extent: ext };
  }, [items, origin, size.w, viewH]);

  // Camera — translate the world so the target sits at the focus point.
  const camX = useSharedValue(0);
  const camY = useSharedValue(0);
  const start = useSharedValue({ x: 0, y: 0 });
  const placed = useSharedValue(0);

  useEffect(() => {
    if (!size.w) return;
    const active = items.find((i) => i.salon.id === activeId);
    const target = active ? project(active.salon.coords) : { x: 0, y: 0 };
    const x = focus.x - target.x;
    const y = focus.y - target.y;
    const cfg = { duration: 450, easing: ease.inOut };
    camX.set(placed.get() ? withTiming(x, cfg) : x);
    camY.set(placed.get() ? withTiming(y, cfg) : y);
    placed.set(1);
  }, [activeId, items, project, focus.x, focus.y, size.w, camX, camY, placed]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(4)
        .onStart(() => {
          start.set({ x: camX.get(), y: camY.get() });
        })
        .onUpdate((e) => {
          camX.set(start.get().x + e.translationX);
          camY.set(start.get().y + e.translationY);
        }),
    [camX, camY, start],
  );

  const camera = useAnimatedStyle(() => ({
    transform: [{ translateX: camX.get() }, { translateY: camY.get() }],
  }));

  const world = useMemo(() => {
    if (!size.w) return null;
    const coast = COAST.map(([lat, lon]) => project({ latitude: lat, longitude: lon }));
    const sea = `M ${-extent} ${coast[0].y} L ${coast.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${extent} ${coast[coast.length - 1].y} L ${extent} ${extent} L ${-extent} ${extent} Z`;
    const shore = `M ${coast.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
    const lines: { x1: number; y1: number; x2: number; y2: number; major: boolean }[] = [];
    const step = 46;
    const t = Math.tan((-16 * Math.PI) / 180);
    let n = 0;
    for (let d = -extent; d < extent; d += step, n++) {
      lines.push({ x1: d, y1: -extent, x2: d + extent * 2 * t * -0.35, y2: extent, major: n % 5 === 0 });
      lines.push({ x1: -extent, y1: d, x2: extent, y2: d + extent * 2 * t, major: n % 6 === 0 });
    }
    return { sea, shore, lines };
  }, [project, extent, size.w]);

  const land = scheme === 'dark' ? '#171513' : '#ECE6DC';
  const water = scheme === 'dark' ? '#0F1416' : '#D3D9D5';
  const street = scheme === 'dark' ? '#211E1B' : '#F7F3EC';
  const me = project(origin);
  const seaLabel = project({ latitude: 40.342, longitude: 49.89 });

  return (
    <GestureDetector gesture={pan}>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: land, overflow: 'hidden' }]}
        onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      >
        {world ? (
          <Animated.View style={[styles.camera, camera]}>
            <Svg
              width={extent * 2}
              height={extent * 2}
              viewBox={`${-extent} ${-extent} ${extent * 2} ${extent * 2}`}
              style={{ position: 'absolute', left: -extent, top: -extent }}
            >
              {world.lines.map((l, i) => (
                <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={street} strokeWidth={l.major ? 6 : 2} />
              ))}
              <Path d={world.sea} fill={water} />
              <Path d={world.shore} fill="none" stroke={scheme === 'dark' ? '#2A2622' : '#C4CCC7'} strokeWidth={1.2} />
              {DISTRICTS.map((d) => {
                const p = project(d.at);
                return (
                  <SvgText
                    key={d.name}
                    x={p.x}
                    y={p.y}
                    fill={c.inkMuted}
                    fontSize={9}
                    letterSpacing={1.6}
                    textAnchor="middle"
                    fontFamily={fonts.medium}
                    opacity={0.8}
                  >
                    {d.name}
                  </SvgText>
                );
              })}
              <SvgText
                x={seaLabel.x}
                y={seaLabel.y}
                fill={c.inkMuted}
                fontSize={16}
                textAnchor="middle"
                fontFamily={fonts.medium}
                opacity={0.75}
              >
                Xəzər dənizi
              </SvgText>
            </Svg>

            <Origin x={me.x} y={me.y} />

            {items.map((item, i) => {
              const p = project(item.salon.coords);
              const active = item.salon.id === activeId;
              return (
                <Pressable
                  key={item.salon.id}
                  onPress={() => onSelect(item.salon.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.salon.name}, ★ ${i18n.rating(item.live.rating)}`}
                  style={[styles.pin, { left: p.x - 30, top: p.y - 34, zIndex: active ? 10 : 1 }]}
                >
                  <RatingPin rating={item.live.rating} active={active} best={i === 0} />
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

function Origin({ x, y }: { x: number; y: number }) {
  const { c } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!reduced) pulse.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
  }, [reduced, pulse]);
  const ring = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.get()),
    transform: [{ scale: 1 + pulse.get() * 2.2 }],
  }));
  return (
    <View pointerEvents="none" style={[styles.origin, { left: x - 9, top: y - 9 }]}>
      <Animated.View style={[styles.ring, { backgroundColor: c.accent }, ring]} />
      <View style={[styles.dot, { backgroundColor: c.accent, borderColor: c.raised }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  camera: { position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'visible' },
  pin: { position: 'absolute', width: 60, alignItems: 'center' },
  origin: { position: 'absolute', width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 18, height: 18, borderRadius: 9 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 3 },
});
