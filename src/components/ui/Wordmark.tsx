import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';

import { SITE_URL } from '@/lib/links';
import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

const MARK = require('../../../assets/intro/mark.webp');

/**
 * The yazılnow lockup: the shears opened into a check mark, then the word.
 * It's a link home: in a browser to the website's main page, in the app to its home screen.
 */
export function Wordmark({
  size = 28,
  color,
  link = true,
}: {
  size?: number;
  color?: string;
  cutColor?: string;
  /** false: just the picture (e.g. inside something that is already a button). */
  link?: boolean;
}) {
  const art = <WordmarkArt size={size} color={color} />;
  if (!link) return art;
  const web = Platform.OS === 'web';
  return (
    <Pressable
      // In a browser it's a real link (open in a new tab works); in the app it goes to the home tab.
      {...(web ? { href: `${SITE_URL}/` } : {})}
      onPress={web ? undefined : () => router.navigate('/')}
      accessibilityRole="link"
      accessibilityLabel="yazılnow"
      hitSlop={6}
      style={({ hovered }: { hovered?: boolean }) => ({ opacity: hovered ? 0.75 : 1, alignSelf: 'flex-start' })}
    >
      {art}
    </Pressable>
  );
}

function WordmarkArt({ size, color }: { size: number; color?: string }) {
  const { c } = useTheme();
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.12 }}
    >
      <Image source={MARK} style={{ width: size * 1.25, height: size * 1.25, marginLeft: -size * 0.2 }} />
      <Text
        maxFontSizeMultiplier={1}
        style={{
          fontFamily: 'Onest_800ExtraBold',
          fontSize: size,
          lineHeight: Math.round(size * 1.12),
          letterSpacing: -size * 0.035,
          color: color ?? c.ink,
        }}
      >
        yazılnow
      </Text>
    </View>
  );
}
