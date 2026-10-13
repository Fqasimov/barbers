import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';

import { catalogueApi, type BusyRange } from '@/api/catalogue';
import { isLive } from '@/api/client';
import { addDays, dayKey, minutesOfDay, startOfDay } from '@/lib/time';

import { seedReviews } from './reviews';
import { seedSalons, serviceCatalogue as seedServiceCatalogue } from './salons';
import type { Review, Salon } from './types';

/**
 * The venues the app shows. Demo mode: the bundled sample venues. Live mode
 * (EXPO_PUBLIC_API_URL set): the server's catalogue, cached on the device so
 * the app opens instantly and works offline, refreshed in the background.
 */

const CACHE_KEY = 'usta-catalogue-v1';
/** How long the venue list and booked time are trusted before a background refresh. */
const STALE_MS = 60_000;
export const BUSY_DAYS = 7;

type Interval = { start: number; end: number };
type Status = 'idle' | 'loading' | 'ready' | 'error';

type State = {
  salons: Salon[];
  byId: Map<string, Salon>;
  /** Booked time per `${masterId}|${dayKey}`, minutes of the day. Live mode only. */
  busy: Map<string, Interval[]>;
  status: Status;
  loadedAt: number;
  busyAt: number;
  /** Server reviews per venue, newest first. Live mode only. */
  reviews: Record<string, Review[]>;
  load: (force?: boolean) => Promise<void>;
  refreshBusy: (salonIds?: string[]) => Promise<void>;
  loadReviews: (salonId: string) => Promise<void>;
};

const index = (salons: Salon[]) => new Map(salons.map((s) => [s.id, s]));

function indexBusy(ranges: BusyRange[], into = new Map<string, Interval[]>()) {
  for (const r of ranges) {
    const end = new Date(r.end);
    // Time off can run for days; each day gets its own piece.
    for (let start = new Date(r.start); start < end; start = startOfDay(addDays(start, 1))) {
      const dayEnd = startOfDay(addDays(start, 1));
      const until = end < dayEnd ? end : dayEnd;
      const key = `${r.masterId}|${dayKey(start)}`;
      const list = into.get(key) ?? [];
      list.push({
        start: minutesOfDay(start),
        end: minutesOfDay(start) + Math.round((until.getTime() - start.getTime()) / 60_000),
      });
      into.set(key, list);
    }
  }
  return into;
}

export const useCatalogue = create<State>()((set, get) => ({
  salons: isLive ? [] : seedSalons,
  byId: index(isLive ? [] : seedSalons),
  busy: new Map(),
  status: isLive ? 'idle' : 'ready',
  loadedAt: 0,
  busyAt: 0,
  reviews: {},

  load: async (force = false) => {
    if (!isLive) return;
    const { status, loadedAt } = get();
    if (status === 'loading' || (!force && Date.now() - loadedAt < STALE_MS)) return;
    set({ status: 'loading' });
    try {
      const [salons] = await Promise.all([catalogueApi.salons(force), get().refreshBusy()]);
      set({ salons, byId: index(salons), status: 'ready', loadedAt: Date.now() });
      void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(salons)).catch(() => undefined);
    } catch {
      set({ status: get().salons.length ? 'ready' : 'error' });
    }
  },

  refreshBusy: async (salonIds) => {
    if (!isLive) return;
    try {
      const ranges = await catalogueApi.busy({ from: dayKey(startOfDay(new Date())), days: BUSY_DAYS, salonIds });
      if (salonIds?.length) {
        // A partial refresh replaces just those venues' masters.
        const masters = new Set(
          salonIds.flatMap(
            (id) =>
              get()
                .byId.get(id)
                ?.masters.map((m) => m.id) ?? [],
          ),
        );
        const busy = new Map([...get().busy].filter(([k]) => !masters.has(k.split('|')[0])));
        set({ busy: indexBusy(ranges, busy) });
      } else {
        set({ busy: indexBusy(ranges), busyAt: Date.now() });
      }
    } catch {
      // Keep the last known schedule; the server re-checks every booking anyway.
    }
  },

  loadReviews: async (salonId) => {
    if (!isLive) return;
    try {
      const page = await catalogueApi.reviews(salonId);
      set({ reviews: { ...get().reviews, [salonId]: page.data } });
    } catch {
      // Reviews are optional on the venue page.
    }
  },
}));

// Live mode: start from the last catalogue this device saw.
if (isLive) {
  void AsyncStorage.getItem(CACHE_KEY)
    .then((raw) => {
      if (!raw || useCatalogue.getState().salons.length) return;
      const salons = JSON.parse(raw) as Salon[];
      useCatalogue.setState({ salons, byId: index(salons), status: 'ready' });
    })
    .catch(() => undefined);
}

/** Booked intervals for a master on a day, from the server. */
export const busyFor = (masterId: string, date: Date): Interval[] =>
  useCatalogue.getState().busy.get(`${masterId}|${dayKey(date)}`) ?? [];

/** Non-reactive lookups, for code outside React (stores, deep-link handlers). */
export const salonById = (id: string | undefined) => (id ? useCatalogue.getState().byId.get(id) : undefined);

export const masterById = (id: string | undefined) => {
  for (const salon of useCatalogue.getState().salons) {
    const master = salon.masters.find((m) => m.id === id);
    if (master) return { salon, master };
  }
  return undefined;
};

/** Reactive lookup: components re-render when the catalogue changes. */
export function useSalonLookup() {
  const byId = useCatalogue((s) => s.byId);
  return useMemo(() => (id: string | undefined) => (id ? byId.get(id) : undefined), [byId]);
}

/** Ids looked up once and not found, so a missing venue triggers one refetch, not a loop. */
const refetched = new Set<string>();

export function useSalonById(id: string | undefined) {
  const salon = useCatalogue((s) => (id ? s.byId.get(id) : undefined));
  const status = useCatalogue((s) => s.status);
  // A salon newer than the saved list (a fresh link, a just-approved venue): fetch the list again.
  useEffect(() => {
    if (!isLive || !id || salon || status === 'loading' || refetched.has(id)) return;
    refetched.add(id);
    void useCatalogue.getState().load(true);
  }, [id, salon, status]);
  return salon;
}

/** Every distinct service on offer, for city-wide search. */
export function useServiceCatalogue() {
  const salons = useCatalogue((s) => s.salons);
  return useMemo(() => {
    if (!isLive) return seedServiceCatalogue;
    const seen = new Map<string, (typeof seedServiceCatalogue)[number]>();
    for (const salon of salons) {
      for (const s of salon.services) {
        if (!seen.has(s.key))
          seen.set(s.key, { key: s.key, name: s.name, category: s.category, durationMin: s.durationMin });
      }
    }
    return [...seen.values()];
  }, [salons]);
}

/** Platform reviews for a venue (seeded in demo mode, from the server when live). */
export const platformReviews = (salonId: string | undefined): Review[] =>
  !salonId
    ? []
    : isLive
      ? (useCatalogue.getState().reviews[salonId] ?? [])
      : seedReviews.filter((r) => r.salonId === salonId);
