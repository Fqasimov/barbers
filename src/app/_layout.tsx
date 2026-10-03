import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import {
  Newsreader_300Light,
  Newsreader_300Light_Italic,
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  useFonts,
} from '@expo-google-fonts/newsreader';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';

import { ScissorsSplash } from '@/components/splash/ScissorsSplash';
import { Toaster } from '@/components/Toaster';
import { useStore } from '@/store/useStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Keep the native splash (ink + closed scissors) up until our own takes over.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader_300Light,
    Newsreader_300Light_Italic,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function App() {
  const { c, scheme } = useTheme();
  const reduced = useReducedMotion();
  const hydrated = useStore((s) => s.hydrated);
  const [splashDone, setSplashDone] = useState(false);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: c.bg, card: c.bg, text: c.ink, border: c.line, primary: c.accent },
    };
  }, [scheme, c]);

  return (
    <NavThemeProvider value={navTheme}>
      <StatusBar style={splashDone ? (scheme === 'dark' ? 'light' : 'dark') : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.bg },
          animation: reduced ? 'fade' : 'default',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="salon/[id]" />
        <Stack.Screen name="top-rated" />
        <Stack.Screen name="reviews/[id]" />
        <Stack.Screen name="search" options={{ animation: 'fade' }} />
        <Stack.Screen name="book/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="review/[id]" options={{ presentation: 'modal' }} />
      </Stack>
      <Toaster />
      {!splashDone ? <ScissorsSplash ready={hydrated} onDone={() => setSplashDone(true)} /> : null}
    </NavThemeProvider>
  );
}
