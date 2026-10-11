import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { Platform } from 'react-native';

import { isLive } from '@/api/client';
import { authApi } from '@/auth';
import type { Booking } from '@/data/types';

/**
 * Booking notifications.
 * - Live: the server sends pushes (new bookings for salons, reminders and
 *   cancellations for clients). This device registers its Expo push token.
 * - Demo: there is no server, so reminders are scheduled on the device.
 * Every push carries `data.url`, the screen to open when it's tapped.
 */

const CHANNEL = 'bookings';
const TOKEN_KEY = 'usta-push-token';
const supported = Platform.OS === 'ios' || Platform.OS === 'android';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Bookings',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#B4233C',
  });
}

/**
 * Asks for permission (once) and, live, registers this device for pushes.
 * Call it at a moment the person understands, like right after booking.
 */
export async function enableNotifications(sessionToken: string | null, { prompt = true } = {}) {
  if (!supported || !Device.isDevice) return false;
  await ensureChannel();
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && prompt) status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return false;
  if (!isLive || !sessionToken) return true;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return true; // A build without EAS_PROJECT_ID can't get a push token.
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await authApi.registerPushToken(sessionToken, token, Platform.OS === 'ios' ? 'ios' : 'android');
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // No network or no push service; we'll try again next launch.
  }
  return true;
}

/** Live: stop pushes for the account that's signing out. */
export async function disableNotifications(sessionToken: string) {
  const token = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
  if (!token) return;
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => undefined);
  await authApi.unregisterPushToken(sessionToken, token).catch(() => undefined);
}

/** Opens the screen a tapped notification points to. */
export function listenForTaps() {
  if (!supported) return () => undefined;
  const open = (r: Notifications.NotificationResponse | null) => {
    const url = r?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
  };
  void Notifications.getLastNotificationResponseAsync().then(open);
  const sub = Notifications.addNotificationResponseReceivedListener(open);
  return () => sub.remove();
}

// ---------------------------------------------------------------------------
// Demo mode: reminders scheduled on the device.
// ---------------------------------------------------------------------------

const REMINDERS: { before: number; key: 'reminderDay' | 'reminderSoon' }[] = [
  { before: 24 * 60 * 60_000, key: 'reminderDay' },
  { before: 2 * 60 * 60_000, key: 'reminderSoon' },
];

export async function scheduleReminders(booking: Booking, texts: { title: string; body: (key: 'reminderDay' | 'reminderSoon') => string }) {
  if (isLive || !supported) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  const start = new Date(booking.start).getTime();
  for (const r of REMINDERS) {
    const at = start - r.before;
    if (at <= Date.now() + 60_000) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: `${booking.id}:${r.key}`,
      content: { title: texts.title, body: texts.body(r.key), data: { url: '/bookings' }, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL },
    });
  }
}

export async function cancelReminders(bookingId: string) {
  if (isLive || !supported) return;
  await Promise.all(
    REMINDERS.map((r) => Notifications.cancelScheduledNotificationAsync(`${bookingId}:${r.key}`).catch(() => undefined)),
  );
}
