import { useEffect } from 'react';
import { AppState } from 'react-native';

import { isLive } from '@/api/client';
import { useSession } from '@/auth/useSession';
import { useCatalogue } from '@/data/catalogue';
import { enableNotifications, listenForTaps } from '@/lib/notifications';
import { useStore } from '@/store/useStore';

/**
 * Live mode: keep the catalogue and the account's bookings fresh. Refreshes on
 * launch, whenever the app comes back to the foreground, and when someone signs
 * in. Signing out forgets that account's bookings on this device.
 */
export function useAppSync() {
  const token = useSession((s) => s.session?.token ?? null);

  useEffect(() => {
    if (!isLive) return;
    const refresh = () => {
      void useCatalogue.getState().load();
      void useStore.getState().syncBookings();
    };
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => listenForTaps(), []);

  useEffect(() => {
    // Re-register silently if permission was given before; never prompts here.
    if (token) void enableNotifications(token, { prompt: false });
    if (!isLive) return;
    if (token) void useStore.getState().syncBookings();
    else useStore.getState().clearAccountData();
  }, [token]);
}
