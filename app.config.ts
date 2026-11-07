import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Build-time config on top of app.json. Secrets and per-environment values come
 * from EAS environment variables (`eas env:create`), never from the repo:
 *
 * - EXPO_PUBLIC_API_URL        the Laravel API, e.g. https://api.yazilnow.az (required for store builds)
 * - EXPO_PUBLIC_SITE_URL       the website, default https://yazilnow.az. Its /r/ (review QR), /s/ (wall QR)
 *                              and /salon/ links open the app (universal links / Android App Links).
 * - EAS_PROJECT_ID             from `eas init`; enables EAS Update
 * - GOOGLE_MAPS_ANDROID_KEY    Google Maps SDK for Android (iOS uses Apple Maps, no key)
 * - GOOGLE_SERVICES_JSON       EAS "file" variable with google-services.json, for Android push (FCM)
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const projectId = process.env.EAS_PROJECT_ID || config.extra?.eas?.projectId;

  // A store build must talk to the real server. Without it the app falls back to the
  // on-device demo backend, which shows sign-up codes on screen.
  if (profile === 'production' && !process.env.EXPO_PUBLIC_API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL must be set for production builds (eas env:create --environment production).');
  }

  // Links on the website that open straight in the app when it's installed.
  const site = new URL(process.env.EXPO_PUBLIC_SITE_URL || 'https://yazilnow.az').host;
  const paths = ['/r/', '/s/', '/salon/'];

  // Web builds served from a sub-folder (cPanel: https://yazilnow.az/app). Native builds ignore it.
  const webBase = process.env.EXPO_WEB_BASE_URL;

  return {
    ...config,
    ...(webBase ? { experiments: { ...config.experiments, baseUrl: webBase } } : {}),
    ios: {
      ...config.ios,
      associatedDomains: [`applinks:${site}`],
    },
    name: config.name ?? 'Usta',
    slug: config.slug ?? 'usta',
    runtimeVersion: { policy: 'appVersion' },
    ...(projectId
      ? {
          updates: { url: `https://u.expo.dev/${projectId}`, checkAutomatically: 'ON_LOAD', fallbackToCacheTimeout: 0 },
          extra: { ...config.extra, eas: { projectId } },
        }
      : {}),
    android: {
      ...config.android,
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: paths.map((pathPrefix) => ({ scheme: 'https', host: site, pathPrefix })),
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}),
    },
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY }],
    ],
  };
};
