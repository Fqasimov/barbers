import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { salonPhotos } from '@/data/photos';
import type { Salon } from '@/data/types';
import { fonts, tones } from '@/theme/tokens';

import { Text } from './ui/Text';

type Props = {
  salon: Pick<Salon, 'id' | 'name' | 'tone'>;
  width: number | '100%';
  height: number;
  radius?: number;
  /** Darken the bottom for text laid over the image. */
  scrim?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};

const initials = (name: string) =>
  name
    .replace(/^the\s+/i, '')
    .split(/[\s&.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** A venue's photo, or a quiet tonal placeholder with its initials when it has none yet. */
export const SalonPhoto = memo(function SalonPhoto({
  salon,
  width,
  height,
  radius = 0,
  scrim,
  style,
  children,
}: Props) {
  const photo = salonPhotos[salon.id];
  const tone = tones[salon.tone];
  return (
    <View
      style={[{ width, height, borderRadius: radius, backgroundColor: tone.bg, overflow: 'hidden' }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {photo ? (
        <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
      ) : (
        <>
          <LinearGradient
            colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)', 'rgba(0,0,0,0.18)']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.center}>
            <Text
              maxFontSizeMultiplier={1}
              style={{
                color: tone.fg,
                opacity: 0.9,
                fontFamily: fonts.bold,
                fontSize: Math.min(height * 0.28, 44),
                letterSpacing: 1,
              }}
            >
              {initials(salon.name)}
            </Text>
          </View>
        </>
      )}
      {scrim ? (
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']}
          style={[StyleSheet.absoluteFill, { top: '45%' }]}
        />
      ) : null}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
