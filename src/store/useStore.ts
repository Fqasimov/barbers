import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Booking, Review } from '@/data/types';

export type Appearance = 'system' | 'light' | 'dark';

type State = {
  bookings: Booking[];
  reviews: Review[];
  favorites: string[];
  appearance: Appearance;
  name: string;
  hydrated: boolean;
};

type Actions = {
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Booking;
  cancelBooking: (id: string) => void;
  addReview: (review: Omit<Review, 'id' | 'date' | 'mine'>, bookingId?: string) => void;
  toggleFavorite: (salonId: string) => void;
  setAppearance: (appearance: Appearance) => void;
  setName: (name: string) => void;
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const useStore = create<State & Actions>()(
  persist(
    (set) => ({
      bookings: [],
      reviews: [],
      favorites: [],
      appearance: 'system',
      name: '',
      hydrated: false,

      addBooking: (input) => {
        const booking: Booking = { ...input, id: uid(), createdAt: new Date().toISOString(), status: 'upcoming' };
        set((s) => ({ bookings: [...s.bookings, booking] }));
        return booking;
      },
      cancelBooking: (id) =>
        set((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)) })),
      addReview: (input, bookingId) =>
        set((s) => ({
          reviews: [{ ...input, id: uid(), date: new Date().toISOString(), mine: true }, ...s.reviews],
          bookings: bookingId ? s.bookings.map((b) => (b.id === bookingId ? { ...b, reviewed: true } : b)) : s.bookings,
        })),
      toggleFavorite: (salonId) =>
        set((s) => ({
          favorites: s.favorites.includes(salonId)
            ? s.favorites.filter((id) => id !== salonId)
            : [salonId, ...s.favorites],
        })),
      setAppearance: (appearance) => set({ appearance }),
      setName: (name) => set({ name }),
    }),
    {
      name: 'usta-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ hydrated: _hydrated, ...rest }) => rest,
      onRehydrateStorage: () => () => useStore.setState({ hydrated: true }),
    },
  ),
);
