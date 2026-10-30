import { Platform } from 'react-native';

import { demoStore } from '@/auth/local';
import { AuthError, type Business, type Hours, type Photo, type PlanId, type Subscription } from '@/auth/types';
import type { BillingPeriod } from '@/auth/plans';
import type { Booking, CategoryId, Language, Master, Review, Service } from '@/data/types';
import type { Loc } from '@/i18n/types';
import type { ToneName } from '@/theme/tokens';

import type { Page } from './catalogue';
import { isLive, request } from './client';

/**
 * A booking as the salon sees it: who is coming. `kind: 'block'` is time the
 * salon closed off (a break, a day off); `source: 'salon'` was added by hand.
 */
export type BusinessBooking = Booking & {
  client: { name: string; phone: string };
  kind?: 'visit' | 'block';
  source?: 'customer' | 'salon';
  /** ISO end; time off can run for days. */
  end?: string;
};

/** A phone call or walk-in the salon writes down. */
export type SalonBookingInput = {
  masterId: string;
  serviceIds: string[];
  start: string;
  clientName: string;
  clientPhone?: string | null;
  note?: string | null;
};

/** Time off for one master, or everyone when masterId is null. */
export type BlockInput = { masterId: string | null; start: string; end: string; note?: string | null };

export type MasterInput = {
  name: string;
  role: Loc;
  years: number;
  serviceIds: string[];
  workDays: number[];
  shift: { start: string; end: string };
  languages: Language[];
};

export type ServiceInput = {
  name: Loc;
  category: CategoryId;
  durationMin: number;
  price: number;
  description?: Loc | null;
};

export type BusinessPatch = Partial<
  Pick<
    Business,
    | 'salonName'
    | 'about'
    | 'phone'
    | 'whatsapp'
    | 'address'
    | 'district'
    | 'coords'
    | 'categories'
    | 'audience'
    | 'hours'
    | 'closedDays'
  >
>;

export type Checkout = { checkoutUrl: string; paymentId: string };

/** The salon owner's tools. docs/api.md → "Salon tools". */
export interface BusinessApi {
  get(token: string): Promise<Business>;
  update(token: string, patch: BusinessPatch): Promise<Business>;
  addMaster(token: string, input: MasterInput): Promise<Master>;
  updateMaster(token: string, id: string, input: Partial<MasterInput>): Promise<Master>;
  deleteMaster(token: string, id: string): Promise<void>;
  addService(token: string, input: ServiceInput): Promise<Service>;
  updateService(token: string, id: string, input: Partial<ServiceInput>): Promise<Service>;
  deleteService(token: string, id: string): Promise<void>;
  /** `uri` is a local JPEG already resized on the device. */
  uploadPhoto(token: string, uri: string): Promise<Photo>;
  deletePhoto(token: string, id: string): Promise<void>;
  bookings(token: string, range: { from: string; to: string }): Promise<BusinessBooking[]>;
  cancelBooking(token: string, id: string, reason?: string): Promise<BusinessBooking>;
  completeBooking(token: string, id: string): Promise<BusinessBooking>;
  markNoShow(token: string, id: string): Promise<BusinessBooking>;
  addBooking(token: string, input: SalonBookingInput): Promise<BusinessBooking>;
  blockTime(token: string, input: BlockInput): Promise<BusinessBooking[]>;
  reviews(token: string, page?: number): Promise<Page<Review>>;
  reply(token: string, reviewId: string, text: string): Promise<Review>;
  /** `period`: a month, or a year for the price of ten months. */
  checkout(token: string, plan: PlanId, period?: BillingPeriod): Promise<Checkout>;
  subscription(token: string): Promise<Subscription>;
}

const enc = encodeURIComponent;

const httpBusinessApi: BusinessApi = {
  get: (token) => request('GET', '/business', { token }),
  update: (token, patch) => request('PATCH', '/business', { token, body: patch }),
  addMaster: (token, input) => request('POST', '/business/masters', { token, body: input }),
  updateMaster: (token, id, input) => request('PATCH', `/business/masters/${enc(id)}`, { token, body: input }),
  deleteMaster: (token, id) => request('DELETE', `/business/masters/${enc(id)}`, { token }),
  addService: (token, input) => request('POST', '/business/services', { token, body: input }),
  updateService: (token, id, input) => request('PATCH', `/business/services/${enc(id)}`, { token, body: input }),
  deleteService: (token, id) => request('DELETE', `/business/services/${enc(id)}`, { token }),
  uploadPhoto: async (token, uri) => {
    const form = new FormData();
    if (Platform.OS === 'web') {
      // Browsers need the file itself; the picker gives a blob: or data: URI.
      form.append('photo', await (await fetch(uri)).blob(), 'photo.jpg');
    } else {
      // React Native's FormData takes a file descriptor object for uploads.
      form.append('photo', { uri, name: 'photo.jpg', type: 'image/jpeg' } as unknown as Blob);
    }
    return request('POST', '/business/photos', { token, body: form });
  },
  deletePhoto: (token, id) => request('DELETE', `/business/photos/${enc(id)}`, { token }),
  bookings: (token, range) => request('GET', '/business/bookings', { token, query: range }),
  cancelBooking: (token, id, reason) =>
    request('POST', `/business/bookings/${enc(id)}/cancel`, { token, body: reason ? { reason } : {} }),
  completeBooking: (token, id) => request('POST', `/business/bookings/${enc(id)}/complete`, { token }),
  markNoShow: (token, id) => request('POST', `/business/bookings/${enc(id)}/no-show`, { token }),
  addBooking: (token, input) => request('POST', '/business/bookings', { token, body: input }),
  blockTime: (token, input) => request('POST', '/business/blocks', { token, body: input }),
  reviews: (token, page = 1) => request('GET', '/business/reviews', { token, query: { page } }),
  reply: (token, id, text) => request('POST', `/business/reviews/${enc(id)}/reply`, { token, body: { reply: text } }),
  checkout: (token, plan, period = 'month') =>
    request('POST', '/business/subscription/checkout', { token, body: { plan, period } }),
  subscription: (token) => request('GET', '/business/subscription', { token }),
};

// ---------------------------------------------------------------------------
// Demo: the same tools on the on-device store, so the flows can be tried now.
// ---------------------------------------------------------------------------

const TONES: ToneName[] = ['oxblood', 'forest', 'navy', 'clay', 'olive', 'slate', 'rose', 'ink'];
const rid = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Fills the fields older demo businesses don't have yet. */
function complete(
  b: Business,
): Required<Pick<Business, 'masters' | 'services' | 'photos' | 'hours' | 'closedDays'>> & Business {
  b.masters ??= [];
  b.services ??= [];
  b.photos ??= [];
  b.hours ??= { open: '10:00', close: '20:00' } satisfies Hours;
  b.closedDays ??= [];
  return b as ReturnType<typeof complete>;
}

async function withBusiness<T>(token: string, fn: (b: ReturnType<typeof complete>) => T | Promise<T>): Promise<T> {
  await demoStore.pause();
  const { db, business } = await demoStore.ownerBusiness(token);
  const out = await fn(complete(business));
  await demoStore.save(db);
  return demoStore.copy(out);
}

type WithCalendar = { calendar?: BusinessBooking[] };
const calendarOf = (b: Business) => ((b as WithCalendar).calendar ??= []);
const endOf = (x: BusinessBooking) =>
  x.end ? new Date(x.end).getTime() : new Date(x.start).getTime() + x.durationMin * 60_000;
const overlapping = (b: Business, masterId: string, start: number, end: number) =>
  calendarOf(b).some(
    (x) => x.masterId === masterId && x.status === 'upcoming' && new Date(x.start).getTime() < end && endOf(x) > start,
  );
const setStatus = (token: string, id: string, status: BusinessBooking['status']) =>
  withBusiness(token, (b) => {
    const row = calendarOf(b).find((x) => x.id === id);
    if (!row) throw new AuthError('not_found');
    row.status = status;
    return row;
  });

const keyOf = (name: Loc) =>
  (name.en || name.az)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'service';

const demoBusinessApi: BusinessApi = {
  get: (token) => withBusiness(token, (b) => ({ ...b })),
  update: (token, patch) =>
    withBusiness(token, (b) => {
      Object.assign(b, patch);
      return { ...b };
    }),
  addMaster: (token, input) =>
    withBusiness(token, (b) => {
      const master: Master = {
        ...input,
        id: rid('m'),
        rating: 0,
        reviewCount: 0,
        tone: TONES[b.masters.length % TONES.length],
      };
      b.masters.push(master);
      return master;
    }),
  updateMaster: (token, id, input) =>
    withBusiness(token, (b) => {
      const m = b.masters.find((x) => x.id === id);
      if (!m) throw new AuthError('not_found');
      Object.assign(m, input);
      return { ...m };
    }),
  deleteMaster: (token, id) =>
    withBusiness(token, (b) => {
      b.masters = b.masters.filter((x) => x.id !== id);
    }),
  addService: (token, input) =>
    withBusiness(token, (b) => {
      const service: Service = {
        ...input,
        description: input.description ?? undefined,
        id: rid('s'),
        key: keyOf(input.name),
      };
      b.services.push(service);
      return service;
    }),
  updateService: (token, id, input) =>
    withBusiness(token, (b) => {
      const s = b.services.find((x) => x.id === id);
      if (!s) throw new AuthError('not_found');
      Object.assign(s, { ...input, description: input.description ?? s.description });
      return { ...s };
    }),
  deleteService: (token, id) =>
    withBusiness(token, (b) => {
      b.services = b.services.filter((x) => x.id !== id);
      b.masters.forEach((m) => (m.serviceIds = m.serviceIds.filter((x) => x !== id)));
    }),
  uploadPhoto: (token, uri) =>
    withBusiness(token, (b) => {
      const photo = { id: rid('p'), url: uri };
      b.photos.push(photo);
      return photo;
    }),
  deletePhoto: (token, id) =>
    withBusiness(token, (b) => {
      b.photos = b.photos.filter((x) => x.id !== id);
    }),
  // The demo has no customers booking into owner-made salons; the calendar
  // holds what the owner adds by hand.
  bookings: (token, range) =>
    withBusiness(token, (b) => {
      const from = new Date(`${range.from}T00:00:00`).getTime();
      const to = new Date(`${range.to}T00:00:00`).getTime() + 86_400_000;
      return calendarOf(b).filter((x) => new Date(x.start).getTime() < to && endOf(x) > from);
    }),
  cancelBooking: (token, id) => setStatus(token, id, 'cancelled'),
  completeBooking: (token, id) => setStatus(token, id, 'completed'),
  markNoShow: (token, id) => setStatus(token, id, 'no_show'),
  addBooking: (token, input) =>
    withBusiness(token, (b) => {
      const services = b.services.filter((s) => input.serviceIds.includes(s.id));
      const durationMin = services.reduce((n, s) => n + s.durationMin, 0);
      const start = new Date(input.start).getTime();
      if (overlapping(b, input.masterId, start, start + durationMin * 60_000)) throw new AuthError('slot_taken');
      const booking: BusinessBooking = {
        id: rid('b'),
        salonId: b.salonId ?? b.id,
        masterId: input.masterId,
        serviceIds: input.serviceIds,
        start: input.start,
        durationMin,
        total: services.reduce((n, s) => n + s.price, 0),
        note: input.note ?? undefined,
        status: 'upcoming',
        createdAt: new Date().toISOString(),
        kind: 'visit',
        source: 'salon',
        client: { name: input.clientName, phone: (input.clientPhone ?? '').replace(/\D/g, '') },
      };
      calendarOf(b).push(booking);
      return booking;
    }),
  blockTime: (token, input) =>
    withBusiness(token, (b) => {
      const start = new Date(input.start).getTime();
      const end = new Date(input.end).getTime();
      const masters = input.masterId ? b.masters.filter((m) => m.id === input.masterId) : b.masters;
      if (masters.some((m) => overlapping(b, m.id, start, end))) throw new AuthError('overlaps_bookings');
      const rows = masters.map(
        (m): BusinessBooking => ({
          id: rid('t'),
          salonId: b.salonId ?? b.id,
          masterId: m.id,
          serviceIds: [],
          start: input.start,
          end: input.end,
          durationMin: Math.round((end - start) / 60_000),
          total: 0,
          note: input.note ?? undefined,
          status: 'upcoming',
          createdAt: new Date().toISOString(),
          kind: 'block',
          source: 'salon',
          client: { name: '', phone: '' },
        }),
      );
      calendarOf(b).push(...rows);
      return rows;
    }),
  reviews: async () => ({ data: [], nextPage: null }),
  reply: async () => {
    throw new AuthError('not_found');
  },
  checkout: async () => {
    throw new AuthError('network');
  },
  subscription: (token) =>
    withBusiness(token, (b) => {
      if (!b.subscription) throw new AuthError('not_found');
      return b.subscription;
    }),
};

export const businessApi: BusinessApi = isLive ? httpBusinessApi : demoBusinessApi;
