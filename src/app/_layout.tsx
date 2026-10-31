import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/onest';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';

import { useSession } from '@/auth/useSession';
import { BrandIntro } from '@/components/splash/BrandIntro';
import { Toaster } from '@/components/Toaster';
import { useAppSync } from '@/lib/sync';
import { useStore } from '@/store/useStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';

// Keep the native splash (linen + closed shears) up until our own takes over.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Onest_400Regular, Onest_500Medium, Onest_600SemiBold, Onest_700Bold, Onest_800ExtraBold });

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
  const sessionReady = useSession((s) => s.hydrated);
  const signedIn = useSession((s) => !!s.session);
  const authPrompted = useStore((s) => s.authPrompted);
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);
  useAppSync();

  // First launch: offer sign-in / sign-up once, right after the splash. Browsing stays open.
  useEffect(() => {
    // Not over the salon panel's own front door on the website.
    const onPanel = Platform.OS === 'web' && window.location.pathname.endsWith('/panel');
    if (splashDone && hydrated && sessionReady && !signedIn && !authPrompted && !onPanel) router.push('/auth');
  }, [splashDone, hydrated, sessionReady, signedIn, authPrompted]);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: c.bg, card: c.bg, text: c.ink, border: c.line, primary: c.accent },
    };
  }, [scheme, c]);

  return (
    <NavThemeProvider value={navTheme}>
      <View style={[styles.page, { backgroundColor: Platform.OS === 'web' ? c.sunken : c.bg }]}>
        <View style={[styles.column, { backgroundColor: c.bg }]}>
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
            <Stack.Screen name="report/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="auth/index"
              options={{ presentation: 'fullScreenModal', animation: reduced ? 'fade' : 'slide_from_bottom' }}
            />
            <Stack.Screen name="auth/sign-in" />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="auth/verify" options={{ gestureEnabled: false }} />
            <Stack.Screen name="auth/forgot" />
            <Stack.Screen name="auth/new-password" options={{ gestureEnabled: false }} />
            <Stack.Screen name="auth/complete" options={{ gestureEnabled: false }} />
            <Stack.Screen name="business/register" />
            <Stack.Screen name="business/plans" options={{ gestureEnabled: false }} />
            <Stack.Screen name="business/index" />
            <Stack.Screen name="account/delete" />
            <Stack.Screen name="panel" />
          </Stack>
          <Toaster />
        </View>
      </View>
      {!splashDone ? <BrandIntro ready={hydrated && sessionReady} onDone={finishSplash} /> : null}
    </NavThemeProvider>
  );
}

// In a browser (the salon panel on the website) the app is a centred column; on phones it fills the screen.
const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 760 : undefined, overflow: 'hidden' },
});
