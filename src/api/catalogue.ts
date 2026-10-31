import { AuthError, type Feature, type PlanId } from '@/auth/types';
import type { Booking, Review, Salon } from '@/data/types';

import { isLive, request } from './client';

/** A master's booked time, as the server reports it (no client details). */
export type BusyRange = { masterId: string; start: string; end: string };

export type Page<T> = { data: T[]; nextPage: number | null };

/** Public catalogue: venues, their booked time and reviews. docs/api.md → "Catalogue". */
export const catalogueApi = {
  salons: (fresh = false) => request<Salon[]>('GET', '/salons', { fresh }),
  busy: (args: { from: string; days: number; salonIds?: string[] }) =>
    request<BusyRange[]>('GET', '/busy', { query: args }),
  reviews: (salonId: string, page = 1) =>
    request<Page<Review>>('GET', `/salons/${encodeURIComponent(salonId)}/reviews`, { query: { page } }),
  plans: () =>
    request<
      {
        id: PlanId;
        price: number;
        priceYear?: number;
        features?: Feature[];
        branches?: { included: number; extraPrice: number };
      }[]
    >('GET', '/plans'),
  /** What people tap on a salon page (the salon's click report). Fire and forget. */
  click: (salonId: string, kind: 'view' | 'book' | 'phone' | 'whatsapp' | 'directions') => {
    if (!isLive) return;
    void request('POST', `/salons/${encodeURIComponent(salonId)}/click`, { body: { kind } }).catch(() => undefined);
  },
};

export type QrInfo = { salonId: string; salonName: string | null; masterId: string | null; masterName: string | null; usable: boolean };
export type QrReviewInput = { rating: number; masterRating?: number | null; text?: string; tags?: string[] };

/** One-time QR reviews: the master shows a code after the visit. */
export const qrReviewsApi = {
  show: (code: string) =>
    isLive
      ? request<QrInfo>('GET', `/reviews/qr/${encodeURIComponent(code)}`, { fresh: true })
      : Promise.reject(new AuthError('not_found')),
  submit: (token: string, code: string, input: QrReviewInput) =>
    request<Review>('POST', `/reviews/qr/${encodeURIComponent(code)}`, { token, body: input }),
};

export type WaitlistEntry = {
  id: string;
  salonId: string;
  date: string;
  serviceIds: string[];
  masterId: string | null;
  fromMin: number;
  toMin: number;
  notified: boolean;
};

/** Pro salons: "tell me if a time opens". */
export const waitlistApi = {
  mine: (token: string) => request<WaitlistEntry[]>('GET', '/me/waitlist', { token }),
  join: (
    token: string,
    salonId: string,
    input: { serviceIds: string[]; date: string; masterId?: string | null; fromMin?: number; toMin?: number },
  ) => request<WaitlistEntry>('POST', `/salons/${encodeURIComponent(salonId)}/waitlist`, { token, body: input }),
  leave: (token: string, id: string) => request<void>('DELETE', `/me/waitlist/${encodeURIComponent(id)}`, { token }),
};

export type ReportReason = 'spam' | 'offensive' | 'fake' | 'other';

/** Anyone signed in can report a review; enough reports hide it until checked. */
export const reportReview = (token: string, id: string, reason: ReportReason, note?: string) =>
  isLive
    ? request<{ ok: true }>('POST', `/reviews/${encodeURIComponent(id)}/report`, { token, body: { reason, note } })
    : Promise.resolve({ ok: true as const });

export type NewBooking = Pick<Booking, 'salonId' | 'masterId' | 'serviceIds' | 'start'> & { note?: string };
export type NewReview = { rating: number; text: string; tags: string[]; masterId?: string };

/** The signed-in customer's bookings. docs/api.md → "Bookings". */
export const bookingsApi = {
  list: (token: string) => request<Booking[]>('GET', '/bookings', { token }),
  create: (token: string, input: NewBooking) => request<Booking>('POST', '/bookings', { token, body: input }),
  /** A fresh payment page for a booking waiting for its deposit. */
  pay: (token: string, id: string) =>
    request<{ checkoutUrl: string }>('POST', `/bookings/${encodeURIComponent(id)}/pay`, { token }),
  cancel: (token: string, id: string) =>
    request<Booking>('POST', `/bookings/${encodeURIComponent(id)}/cancel`, { token }),
  review: (token: string, id: string, input: NewReview) =>
    request<Review>('POST', `/bookings/${encodeURIComponent(id)}/review`, { token, body: input }),
};
