import {
  Onest_400Regular,
  Onest_500Medium,
  Onest_600SemiBold,
  Onest_700Bold,
  Onest_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/onest';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider as NavThemeProvider, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';

import { useSession } from '@/auth/useSession';
import { BrandIntro } from '@/components/splash/BrandIntro';
import { Toaster } from '@/components/Toaster';
import { useAppSync } from '@/lib/sync';
import { useStore } from '@/store/useStore';
import { siteFonts } from '@/theme/siteFonts';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { SITE_URL } from '@/lib/links';
import { isSite } from '@/theme/tokens';
import { panelInset, WIDE_MIN, WideContext } from '@/theme/wide';

// Keep the native splash (linen + closed shears) up until our own takes over.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Onest_400Regular,
    Onest_500Medium,
    Onest_600SemiBold,
    Onest_700Bold,
    Onest_800ExtraBold,
    ...siteFonts,
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

const PANEL_FLAG = 'yazilnow-panel-flow';
const isPanelPath = (p: string) => p === '/panel' || p.startsWith('/business') || p === '/staff';
const isAuthPath = (p: string) => p.startsWith('/auth');

/**
 * Web only: true on the salon panel's screens (front door, sign-up, plans, dashboard) and on the sign-in /
 * verify screens reached from them. Client screens (home, salon pages, booking) keep the narrow column.
 */
function usePanelWide(pathname: string): boolean {
  const wide = isSite && (isPanelPath(pathname) || (isAuthPath(pathname) && readFlag()));
  useEffect(() => {
    if (!isSite) return;
    if (isPanelPath(pathname)) writeFlag('1');
    else if (!isAuthPath(pathname)) writeFlag('0');
  }, [pathname]);
  return wide;
}
function readFlag(): boolean {
  try {
    return globalThis.sessionStorage?.getItem(PANEL_FLAG) === '1';
  } catch {
    return false;
  }
}
function writeFlag(v: '0' | '1') {
  try {
    globalThis.sessionStorage?.setItem(PANEL_FLAG, v);
  } catch {
    // Not remembered; the auth screens then use the narrow column.
  }
}

/**
 * In a browser only the salon side runs: the panel, sign-up / sign-in, the dashboard and its tools,
 * the staff cabinet, account deletion, and QR reviews (scanned in the salon). The client app is
 * for phones; any other page sends the visitor to the website.
 */
const isWebAllowed = (p: string) =>
  isPanelPath(p) || p.startsWith('/auth') || p.startsWith('/r/') || p.startsWith('/review/') || p.startsWith('/account');

function App() {
  const { c, scheme } = useTheme();
  const reduced = useReducedMotion();
  const hydrated = useStore((s) => s.hydrated);
  const sessionReady = useSession((s) => s.hydrated);
  const signedIn = useSession((s) => !!s.session);
  const authPrompted = useStore((s) => s.authPrompted);
  // The web build (salon panel, QR pages) has no opening animation: a plain cover until the stores are ready.
  const [introDone, setIntroDone] = useState(false);
  const finishSplash = useCallback(() => setIntroDone(true), []);
  const ready = hydrated && sessionReady;
  const splashDone = introDone || (isSite && ready);
  useAppSync();

  // First launch: offer sign-in / sign-up once, right after the splash. Browsing stays open.
  // Only on the home screen: a scanned QR, a shared salon link or the salon panel's front door
  // opens where it points, and asks for an account only when it needs one.
  const pathname = usePathname();
  const onHome = pathname === '/';
  const wide = usePanelWide(pathname);
  const { width } = useWindowDimensions();
  const desktop = wide && width >= WIDE_MIN;
  useEffect(() => {
    if (!isSite && splashDone && hydrated && sessionReady && !signedIn && !authPrompted && onHome) router.push('/auth');
  }, [splashDone, hydrated, sessionReady, signedIn, authPrompted, onHome]);

  const offWeb = isSite && !isWebAllowed(pathname);
  useEffect(() => {
    if (offWeb) globalThis.location?.replace(SITE_URL);
  }, [offWeb]);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: c.bg, card: c.bg, text: c.ink, border: c.line, primary: c.accent },
    };
  }, [scheme, c]);

  // On its way to the website: show nothing of the client app.
  if (offWeb) return <View style={{ flex: 1, backgroundColor: c.bg }} />;

  return (
    <NavThemeProvider value={navTheme}>
      <View style={[styles.page, { backgroundColor: Platform.OS === 'web' && !wide ? c.sunken : c.bg }]}>
        <View
          style={[
            styles.column,
            { backgroundColor: c.bg },
            // In a browser the client app is a column framed by hairlines, like a sheet of paper on the desk.
            // The salon panel, from sign-up to the dashboard, takes the whole screen.
            isSite && !wide && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: c.line },
            wide && { maxWidth: '100%', paddingHorizontal: panelInset(width) },
          ]}
        >
          <WideContext.Provider value={desktop}>
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
            <Stack.Screen name="staff" />
            </Stack>
            <Toaster />
          </WideContext.Provider>
        </View>
      </View>
      {!splashDone ? (
        isSite ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }]} />
        ) : (
          <BrandIntro ready={ready} onDone={finishSplash} />
        )
      ) : null}
    </NavThemeProvider>
  );
}

// In a browser (the salon panel on the website) the app is a centred column; on phones it fills the screen.
const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 760 : undefined, overflow: 'hidden' },
});
