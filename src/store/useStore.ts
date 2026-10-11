import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { bookingsApi } from '@/api/catalogue';
import { isLive } from '@/api/client';
import { useSession } from '@/auth/useSession';
import { AuthError } from '@/auth/types';
import { useCatalogue } from '@/data/catalogue';
import type { Booking, Review } from '@/data/types';
import type { Locale } from '@/i18n/types';

export type Appearance = 'system' | 'light' | 'dark';

export const COMPARE_LIMIT = 3;

type State = {
  bookings: Booking[];
  reviews: Review[];
  favorites: string[];
  /** Master ids the user follows — they stay followed even if the master moves salons. */
  followed: string[];
  /** Venue ids queued for side-by-side comparison. */
  compare: string[];
  appearance: Appearance;
  /** null = follow the device language. */
  locale: Locale | null;
  name: string;
  /** The welcome / sign-in screen has been shown once. */
  authPrompted: boolean;
  /** Hide venues that don't serve the signed-in user's gender. */
  forMe: boolean;
  demoSeeded: boolean;
  hydrated: boolean;
};

type Actions = {
  /** Live: the server books it (and may refuse with `slot_taken`). Demo: saved on this device. */
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<Booking>;
  cancelBooking: (id: string) => Promise<void>;
  /** Reviews are only accepted for a completed, not-yet-reviewed booking. */
  addReview: (review: Omit<Review, 'id' | 'date' | 'mine'>, bookingId: string) => Promise<boolean>;
  /** Live: replaces the local list with the account's bookings on the server. */
  syncBookings: () => Promise<void>;
  /** Live: forget the signed-out account's bookings and reviews on this device. */
  clearAccountData: () => void;
  toggleFavorite: (salonId: string) => void;
  toggleFollow: (masterId: string) => void;
  /** Returns false when the compare list is already full. */
  toggleCompare: (salonId: string) => boolean;
  clearCompare: () => void;
  setAppearance: (appearance: Appearance) => void;
  setLocale: (locale: Locale | null) => void;
  setName: (name: string) => void;
  setAuthPrompted: () => void;
  setForMe: (on: boolean) => void;
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const bookingEnd = (b: Booking) => new Date(b.start).getTime() + b.durationMin * 60_000;
export const isCompleted = (b: Booking, now = Date.now()) =>
  b.status === 'completed' || (b.status === 'upcoming' && bookingEnd(b) <= now);

const token = () => {
  const t = useSession.getState().session?.token;
  if (!t) throw new AuthError('session_expired');
  return t;
};

/**
 * A finished visit three days ago, so a new install can try the
 * "review only after a visit" flow straight away.
 */
function demoVisit(): Booking {
  const start = new Date();
  start.setDate(start.getDate() - 3);
  start.setHours(11, 0, 0, 0);
  return {
    id: 'demo-visit',
    salonId: 'old-town-barbers',
    masterId: 'old-town-barbers.m2',
    serviceIds: ['old-town-barbers.cut'],
    start: start.toISOString(),
    durationMin: 45,
    total: 30,
    status: 'upcoming',
    createdAt: start.toISOString(),
  };
}

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      bookings: [],
      reviews: [],
      favorites: [],
      followed: [],
      compare: [],
      appearance: 'system',
      locale: null,
      name: '',
      authPrompted: false,
      forMe: true,
      demoSeeded: false,
      hydrated: false,

      createBooking: async (input) => {
        if (isLive) {
          const { salonId, masterId, serviceIds, start, note } = input;
          try {
            const booking = await bookingsApi.create(token(), { salonId, masterId, serviceIds, start, note });
            set((s) => ({ bookings: [...s.bookings.filter((b) => b.id !== booking.id), booking] }));
            return booking;
          } finally {
            // Whether it worked or someone got there first, show the salon's real schedule.
            void useCatalogue.getState().refreshBusy([salonId]);
          }
        }
        const booking: Booking = { ...input, id: uid(), createdAt: new Date().toISOString(), status: 'upcoming' };
        set((s) => ({ bookings: [...s.bookings, booking] }));
        return booking;
      },
      cancelBooking: async (id) => {
        if (isLive) {
          const booking = await bookingsApi.cancel(token(), id);
          set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? booking : b)) }));
          void useCatalogue.getState().refreshBusy([booking.salonId]);
          return;
        }
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)) }));
      },
      addReview: async (input, bookingId) => {
        const booking = get().bookings.find((b) => b.id === bookingId);
        if (!booking || booking.reviewed || !isCompleted(booking) || booking.salonId !== input.salonId) return false;
        if (isLive) {
          const review = await bookingsApi.review(token(), bookingId, {
            rating: input.rating,
            text: input.text,
            tags: input.tags ?? [],
            masterId: input.masterId,
          });
          set((s) => ({
            reviews: [{ ...review, mine: true }, ...s.reviews],
            bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, reviewed: true } : b)),
          }));
          // Ratings are computed by the server; pick up the new numbers.
          void useCatalogue.getState().load(true);
          void useCatalogue.getState().loadReviews(input.salonId);
          return true;
        }
        set((s) => ({
          reviews: [{ ...input, bookingId, id: uid(), date: new Date().toISOString(), mine: true }, ...s.reviews],
          bookings: s.bookings.map((b) => (b.id === bookingId ? { ...b, reviewed: true } : b)),
        }));
        return true;
      },
      syncBookings: async () => {
        if (!isLive || !useSession.getState().session) return;
        try {
          set({ bookings: await bookingsApi.list(token()) });
        } catch {
          // Offline: keep showing the last known list.
        }
      },
      clearAccountData: () => {
        if (isLive) set({ bookings: [], reviews: [] });
      },
      toggleFavorite: (salonId) =>
        set((s) => ({
          favorites: s.favorites.includes(salonId)
            ? s.favorites.filter((id) => id !== salonId)
            : [salonId, ...s.favorites],
        })),
      toggleFollow: (masterId) =>
        set((s) => ({
          followed: s.followed.includes(masterId)
            ? s.followed.filter((id) => id !== masterId)
            : [masterId, ...s.followed],
        })),
      toggleCompare: (salonId) => {
        const cur = get().compare;
        if (cur.includes(salonId)) {
          set({ compare: cur.filter((id) => id !== salonId) });
          return true;
        }
        if (cur.length >= COMPARE_LIMIT) return false;
        set({ compare: [...cur, salonId] });
        return true;
      },
      clearCompare: () => set({ compare: [] }),
      setAppearance: (appearance) => set({ appearance }),
      setLocale: (locale) => set({ locale }),
      setName: (name) => set({ name }),
      setAuthPrompted: () => set({ authPrompted: true }),
      setForMe: (forMe) => set({ forMe }),
    }),
    {
      name: 'usta-store-v2',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _h, ...rest }) => rest,
      onRehydrateStorage: () => () => {
        const s = useStore.getState();
        useStore.setState({
          hydrated: true,
          // A saved compare list survives restarts; drop venues that no longer exist.
          compare: (s.compare ?? []).slice(0, COMPARE_LIMIT),
          ...(s.demoSeeded || isLive ? {} : { demoSeeded: true, bookings: [demoVisit(), ...s.bookings] }),
        });
      },
    },
  ),
);
