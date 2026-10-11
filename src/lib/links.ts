import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

/** The public website. Set EXPO_PUBLIC_SITE_URL once the domain is live. */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || 'https://ustatap.az').replace(/\/+$/, '');
export const SUPPORT_EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'support@ustatap.az';

export const links = {
  privacy: `${SITE_URL}/privacy`,
  terms: `${SITE_URL}/terms`,
  salonTerms: `${SITE_URL}/terms/salons`,
};

export const openPage = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));

export const emailSupport = (subject: string) =>
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`).catch(() => undefined);
