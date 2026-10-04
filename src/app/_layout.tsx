import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  useFonts,
} from '@expo-google-fonts/onest';
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

// Keep the native splash (linen + closed shears) up until our own takes over.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold });

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
      <StatusBar style={splashDone && scheme === 'dark' ? 'light' : 'dark'} />
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
        <Stack.Screen name="find" />
        <Stack.Screen name="compare" />
        <Stack.Screen name="book/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="review/[id]" options={{ presentation: 'modal' }} />
      </Stack>
      <Toaster />
      {!splashDone ? <ScissorsSplash ready={hydrated} onDone={() => setSplashDone(true)} /> : null}
    </NavThemeProvider>
  );
}
