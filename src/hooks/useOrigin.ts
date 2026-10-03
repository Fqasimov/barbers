import * as Location from 'expo-location';
import { useCallback, useEffect } from 'react';
import { create } from 'zustand';

import type { Coords } from '@/data/types';
import { BAKU_CENTER, distanceKm } from '@/lib/geo';

/** The catalogue is Baku-only; further away than this we fall back to the city centre. */
const SERVICE_RADIUS_KM = 40;

type OriginState = {
  origin: Coords;
  source: 'device' | 'city';
  status: 'idle' | 'locating' | 'denied' | 'ready';
};

const useOriginStore = create<OriginState>(() => ({ origin: BAKU_CENTER, source: 'city', status: 'idle' }));

async function locate(prompt: boolean) {
  const set = useOriginStore.setState;
  try {
    const existing = await Location.getForegroundPermissionsAsync();
    let granted = existing.granted;
    if (!granted && prompt && existing.canAskAgain) {
      set({ status: 'locating' });
      granted = (await Location.requestForegroundPermissionsAsync()).granted;
    }
    if (!granted) {
      set({ status: prompt ? 'denied' : 'idle' });
      return;
    }
    set({ status: 'locating' });
    const fix =
      (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const here = { latitude: fix.coords.latitude, longitude: fix.coords.longitude };
    const inCity = distanceKm(here, BAKU_CENTER) <= SERVICE_RADIUS_KM;
    set({ origin: inCity ? here : BAKU_CENTER, source: inCity ? 'device' : 'city', status: 'ready' });
  } catch {
    set({ status: 'idle' });
  }
}

/**
 * Where "near you" is measured from. Uses the device location when permission
 * was already granted; `request()` asks for it explicitly (e.g. from the map).
 */
export function useOrigin() {
  const state = useOriginStore();
  useEffect(() => {
    if (useOriginStore.getState().status === 'idle') locate(false);
  }, []);
  const request = useCallback(() => locate(true), []);
  return { ...state, request };
}
