import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { businessApi } from '@/api/business';
import { catalogueApi } from '@/api/catalogue';
import { isLive } from '@/api/client';
import { type BillingPeriod, plans, YEAR_MONTHS_PAID } from '@/auth/plans';
import type { PlanId } from '@/auth/types';

/**
 * Salon subscriptions are paid on the provider's hosted page (the app never sees
 * card details). On iOS, Apple requires in-app purchase for digital subscriptions
 * bought inside the app, so there the app shows the plan but no price and no buy
 * button unless EXPO_PUBLIC_IOS_CHECKOUT=1 (only after Apple has agreed).
 */
export const canBuyInApp = Platform.OS !== 'ios' || process.env.EXPO_PUBLIC_IOS_CHECKOUT === '1';

export type PlanPrices = Record<PlanId, Record<BillingPeriod, number>>;

/** Live prices from the server; the bundled plans are the fallback. */
export function usePlanPrices(): PlanPrices {
  const [prices, setPrices] = useState<PlanPrices>(
    () => Object.fromEntries(plans.map((p) => [p.id, { month: p.price, year: p.priceYear }])) as PlanPrices,
  );
  useEffect(() => {
    if (!isLive) return;
    let alive = true;
    catalogueApi
      .plans()
      .then(
        (list) =>
          alive &&
          setPrices((p) => ({
            ...p,
            ...Object.fromEntries(
              list
                .filter((x) => x.id in p)
                .map((x) => [x.id, { month: x.price, year: x.priceYear ?? x.price * YEAR_MONTHS_PAID }]),
            ),
          })),
      )
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
export async function payForPlan(token: string, plan: PlanId, period: BillingPeriod = 'month') {
  const { checkoutUrl } = await businessApi.checkout(token, plan, period);
  const returnUrl = Linking.createURL('billing/return');
  if (Platform.OS === 'web') {
    await WebBrowser.openBrowserAsync(checkoutUrl);
    return;
  }
  await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);
}
