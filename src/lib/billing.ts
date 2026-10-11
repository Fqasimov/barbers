import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { businessApi } from '@/api/business';
import { catalogueApi } from '@/api/catalogue';
import { isLive } from '@/api/client';
import { plans } from '@/auth/plans';
import type { PlanId } from '@/auth/types';

/**
 * Salon subscriptions are paid on the provider's hosted page (the app never sees
 * card details). On iOS, Apple requires in-app purchase for digital subscriptions
 * bought inside the app, so there the app shows the plan but no price and no buy
 * button unless EXPO_PUBLIC_IOS_CHECKOUT=1 (only after Apple has agreed).
 */
export const canBuyInApp = Platform.OS !== 'ios' || process.env.EXPO_PUBLIC_IOS_CHECKOUT === '1';

/** Live prices from the server; the bundled plans are the fallback. */
export function usePlanPrices(): Record<PlanId, number> {
  const [prices, setPrices] = useState<Record<PlanId, number>>(
    () => Object.fromEntries(plans.map((p) => [p.id, p.price])) as Record<PlanId, number>,
  );
  useEffect(() => {
    if (!isLive) return;
    let alive = true;
    catalogueApi
      .plans()
      .then((list) => alive && setPrices((p) => ({ ...p, ...Object.fromEntries(list.map((x) => [x.id, x.price])) })))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return prices;
}

/**
 * Opens the provider's checkout and waits for it to send the person back to the
 * app (`usta://billing/return`). Resolves when the browser closes, whatever the
 * outcome; the caller re-reads the subscription from the server.
 */
export async function payForPlan(token: string, plan: PlanId) {
  const { checkoutUrl } = await businessApi.checkout(token, plan);
  const returnUrl = Linking.createURL('billing/return');
  if (Platform.OS === 'web') {
    await WebBrowser.openBrowserAsync(checkoutUrl);
    return;
  }
  await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
}
