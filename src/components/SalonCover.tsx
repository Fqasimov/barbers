import { Image } from 'expo-image';
import { memo, useMemo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import type { Motif, Salon } from '@/data/types';
import { fonts, tones } from '@/theme/tokens';

import { Text } from './ui/Text';

type Props = {
  salon: Pick<Salon, 'name' | 'tone' | 'motif' | 'imageUrl'>;
  width: number;
  height: number;
  radius?: number;
  /** 'thumb' drops the arch and keeps only the monogram. */
  variant?: 'card' | 'hero' | 'thumb';
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

export const monogram = (name: string) => {
  const words = name.replace(/^the\s+/i, '').split(/\s+/);
  return words[0][0].toUpperCase();
};

function motifElements(motif: Motif, w: number, h: number, color: string, density: number) {
  const els: ReactNode[] = [];
  const sw = 0.75;
  switch (motif) {
    case 'stripes': {
      const step = 14 / density;
      for (let x = -h; x < w + h; x += step) {
        els.push(<Line key={x} x1={x} y1={0} x2={x + h} y2={h} stroke={color} strokeWidth={sw} />);
      }
      break;
    }
    case 'arcs': {
      const step = 16 / density;
      for (let r = step; r < Math.max(w, h) * 1.4; r += step) {
        els.push(<Circle key={r} cx={w / 2} cy={h * 1.08} r={r} stroke={color} strokeWidth={sw} fill="none" />);
      }
      break;
    }
    case 'grid': {
      const step = 18 / density;
      for (let x = step / 2; x < w; x += step)
        els.push(<Line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} stroke={color} strokeWidth={sw} />);
      for (let y = step / 2; y < h; y += step)
        els.push(<Line key={`h${y}`} x1={0} y1={y} x2={w} y2={y} stroke={color} strokeWidth={sw} />);
      break;
    }
    case 'waves': {
      const step = 13 / density;
      const amp = 3.2;
      const len = 26;
      for (let y = step / 2; y < h + step; y += step) {
        let d = `M 0 ${y}`;
        for (let x = 0; x <= w + len; x += len) {
          d += ` Q ${x + len / 4} ${y - amp} ${x + len / 2} ${y} T ${x + len} ${y}`;
        }
        els.push(<Path key={y} d={d} stroke={color} strokeWidth={sw} fill="none" />);
      }
      break;
    }
    case 'rays': {
      const cx = w / 2;
      const cy = h * 1.02;
      const count = Math.round(28 * density);
      for (let i = 0; i <= count; i++) {
        const a = Math.PI + (Math.PI * i) / count;
        const len = Math.hypot(w, h) * 1.2;
        els.push(
          <Line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * len}
            y2={cy + Math.sin(a) * len}
            stroke={color}
            strokeWidth={sw}
          />,
        );
      }
      break;
    }
    case 'dots': {
      const step = 11 / density;
      for (let y = step / 2; y < h; y += step)
        for (let x = step / 2; x < w; x += step)
          els.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill={color} />);
      break;
    }
  }
  return els;
}

/**
 * Art-directed venue cover: a deep tone, a fine motif and an arch framing the
 * monogram. Swaps to a photo when the venue has one.
 */
export const SalonCover = memo(function SalonCover({
  salon,
  width,
  height,
  radius = 0,
  variant = 'card',
  style,
  children,
}: Props) {
  const tone = tones[salon.tone];
  const density = variant === 'hero' ? 1 : variant === 'thumb' ? 1.6 : 1.15;
  const motif = useMemo(
    () => motifElements(salon.motif, width, height, tone.fg, density),
    [salon.motif, width, height, tone.fg, density],
  );

  const archW = Math.min(width * 0.5, height * 0.44);
  const r = archW / 2;
  const x0 = (width - archW) / 2;
  const top = height * (variant === 'hero' ? 0.24 : 0.17);
  const bottom = height * (variant === 'hero' ? 0.9 : 0.86);
  const arch = `M ${x0} ${bottom} L ${x0} ${top + r} A ${r} ${r} 0 0 1 ${x0 + archW} ${top + r} L ${x0 + archW} ${bottom}`;
  const letterSize = variant === 'thumb' ? height * 0.62 : archW * 1.02;
  const letterCenter = variant === 'thumb' ? height / 2 : top + r + (bottom - top - r) * 0.32;

  return (
    <View
      style={[{ width, height, borderRadius: radius, backgroundColor: tone.bg, overflow: 'hidden' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {salon.imageUrl ? (
        <Image source={{ uri: salon.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <G opacity={variant === 'thumb' ? 0.14 : 0.16}>{motif}</G>
            {variant !== 'thumb' ? (
              <Path d={arch} stroke={tone.fg} strokeOpacity={0.55} strokeWidth={1} fill={tone.bg} fillOpacity={0.55} />
            ) : null}
          </Svg>
          <Text
            maxFontSizeMultiplier={1}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: letterCenter - letterSize * 0.6,
              textAlign: 'center',
              color: tone.fg,
              fontFamily: fonts.displayLightItalic,
              fontSize: letterSize,
              lineHeight: letterSize * 1.2,
              letterSpacing: -1,
            }}
          >
            {monogram(salon.name)}
          </Text>
        </>
      )}
      {children}
    </View>
  );
});
