import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform } from 'react-native';

import { bookingsApi } from '@/api/catalogue';
import { authErrorKey } from '@/auth/flow';
import { useSession } from '@/auth/useSession';
import { toast } from '@/components/Toaster';
import { Button } from '@/components/ui/Button';
import type { Salon } from '@/data/types';
import { useI18n } from '@/i18n';
import { paymentsEnabled } from '@/lib/billing';
import { useStore } from '@/store/useStore';

/** What a Pro salon asks now, before the server's answer (which also applies the no-show rule). */
export function depositEstimate(salon: Salon, services: Salon['services']) {
  if (!salon.deposits || !paymentsEnabled) return 0;
  const sum = services.reduce((n, s) => {
    const d = s.deposit;
    if (!d || d.type === 'none') return n;
    return n + (d.type === 'fixed' ? Math.min(s.price, d.value) : Math.ceil((s.price * Math.min(100, d.value)) / 100));
  }, 0);
  return Math.min(
    sum,
    services.reduce((n, s) => n + s.price, 0),
  );
}

/** Opens the deposit payment page and waits for the browser to come back. */
export async function openDepositCheckout(url: string) {
  if (Platform.OS === 'web') await WebBrowser.openBrowserAsync(url);
  else await WebBrowser.openAuthSessionAsync(url, Linking.createURL('billing/return'));
}

/** A booking still waiting for its deposit: a fresh payment page, then the real status. */
export function PayDepositButton({ id, amount }: { id: string; amount: number }) {
  const i18n = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      label={i18n.t('payDeposit', { price: i18n.price(amount) })}
      loading={busy}
      onPress={async () => {
        const token = useSession.getState().session?.token;
        if (!token) return;
        setBusy(true);
        try {
          const { checkoutUrl } = await bookingsApi.pay(token, id);
          await openDepositCheckout(checkoutUrl);
        } catch (e) {
          toast(i18n.t(authErrorKey(e)), 'info');
        } finally {
          await useStore.getState().syncBookings();
          setBusy(false);
        }
      }}
    />
  );
}
