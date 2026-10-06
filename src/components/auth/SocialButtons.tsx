import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { authApi } from '@/auth';
import { authErrorKey, useFinishSignIn } from '@/auth/flow';
import { toast } from '@/components/Toaster';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

WebBrowser.maybeCompleteAuthSession();

/**
 * OAuth client IDs from Google Cloud Console. Until they exist (they need the
 * app's final domain / bundle IDs) the Google button explains that instead of
 * failing. See docs/api.md → "Social sign-in".
 */
const GOOGLE = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
};
const googleReady = !!(Platform.OS === 'ios'
  ? GOOGLE.iosClientId
  : Platform.OS === 'android'
    ? GOOGLE.androidClientId
    : GOOGLE.webClientId);

export function SocialButtons() {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setApple, () => setApple(false));
  }, []);
  return (
    <View style={styles.stack}>
      {apple ? <AppleButton /> : null}
      {googleReady ? <GoogleButtonLive /> : <GoogleButtonUnconfigured />}
    </View>
  );
}

function GoogleFace({ onPress, busy }: { onPress: () => void; busy?: boolean }) {
  const { c } = useTheme();
  const i18n = useI18n();
  return (
    <PressableScale
      onPress={onPress}
      disabled={busy}
      haptic="light"
      accessibilityLabel={i18n.t('continueGoogle')}
      style={[styles.button, { backgroundColor: c.surface, borderColor: c.lineStrong }]}
    >
      {busy ? <ActivityIndicator color={c.ink} /> : <GoogleG />}
      <Text variant="bodyStrong">{i18n.t('continueGoogle')}</Text>
    </PressableScale>
  );
}

function GoogleButtonUnconfigured() {
  const i18n = useI18n();
  return <GoogleFace onPress={() => toast(i18n.t('socialNotConfigured', { provider: 'Google' }), 'info')} />;
}

/** Mounted only when a client ID exists, because the Google hook requires one. */
function GoogleButtonLive() {
  const i18n = useI18n();
  const finish = useFinishSignIn();
  const [busy, setBusy] = useState(false);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE.webClientId,
    iosClientId: GOOGLE.iosClientId,
    androidClientId: GOOGLE.androidClientId,
    selectAccount: true,
  });
  useEffect(() => {
    if (!response) return;
    let alive = true;
    const idToken = response.type === 'success' ? response.params.id_token : undefined;
    if (!idToken) {
      if (response.type !== 'dismiss' && response.type !== 'cancel') {
        toast(i18n.t('socialFailed', { provider: 'Google' }), 'info');
      }
      void Promise.resolve().then(() => alive && setBusy(false));
      return () => {
        alive = false;
      };
    }
    // The backend verifies the ID token with Google before trusting any claim.
    authApi
      .socialSignIn('google', { idToken })
      .then((s) => alive && finish(s))
      .catch((e) => toast(i18n.t(authErrorKey(e)), 'info'))
      .finally(() => alive && setBusy(false));
    return () => {
      alive = false;
    };
  }, [response, finish, i18n]);
  return (
    <GoogleFace
      busy={busy}
      onPress={() => {
        if (!request) return;
        setBusy(true);
        promptAsync().catch(() => setBusy(false));
      }}
    />
  );
}

function AppleButton() {
  const { scheme } = useTheme();
  const i18n = useI18n();
  const finish = useFinishSignIn();
  const signIn = async () => {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!cred.identityToken) throw new Error('no token');
      // Apple sends the name and email only on the very first sign-in.
      const session = await authApi.socialSignIn('apple', {
        idToken: cred.identityToken,
        email: cred.email,
        firstName: cred.fullName?.givenName,
        lastName: cred.fullName?.familyName,
      });
      finish(session);
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      toast(i18n.t('socialFailed', { provider: 'Apple' }), 'info');
    }
  };
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={
        scheme === 'dark'
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={radius.md}
      style={styles.apple}
      onPress={signIn}
    />
  );
}

/** Google's four-colour "G", per their sign-in branding guidelines. */
function GoogleG() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 10 },
  button: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  apple: { height: 52, width: '100%' },
});
