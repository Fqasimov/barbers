import type { PlanId } from '@/auth/types';
import type { Booking, Review, Salon } from '@/data/types';

import { request } from './client';

/** A master's booked time, as the server reports it (no client details). */
export type BusyRange = { masterId: string; start: string; end: string };

export type Page<T> = { data: T[]; nextPage: number | null };

/** Public catalogue: venues, their booked time and reviews. docs/api.md → "Catalogue". */
export const catalogueApi = {
  salons: () => request<Salon[]>('GET', '/salons'),
  busy: (args: { from: string; days: number; salonIds?: string[] }) => request<BusyRange[]>('GET', '/busy', { query: args }),
  reviews: (salonId: string, page = 1) =>
    request<Page<Review>>('GET', `/salons/${encodeURIComponent(salonId)}/reviews`, { query: { page } }),
  plans: () => request<{ id: PlanId; price: number }[]>('GET', '/plans'),
};

export type NewBooking = Pick<Booking, 'salonId' | 'masterId' | 'serviceIds' | 'start'> & { note?: string };
export type NewReview = { rating: number; text: string; tags: string[]; masterId?: string };

/** The signed-in customer's bookings. docs/api.md → "Bookings". */
export const bookingsApi = {
  list: (token: string) => request<Booking[]>('GET', '/bookings', { token }),
  create: (token: string, input: NewBooking) => request<Booking>('POST', '/bookings', { token, body: input }),
  cancel: (token: string, id: string) =>
    request<Booking>('POST', `/bookings/${encodeURIComponent(id)}/cancel`, { token }),
  review: (token: string, id: string, input: NewReview) =>
    request<Review>('POST', `/bookings/${encodeURIComponent(id)}/review`, { token, body: input }),
};
