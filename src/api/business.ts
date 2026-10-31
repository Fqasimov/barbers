import { Platform } from 'react-native';

import { demoStore } from '@/auth/local';
import { AuthError, type Business, type Hours, type Photo, type PlanId, type Subscription } from '@/auth/types';
import { BRANCH_PRICE, BRANCHES_INCLUDED, hasFeature, proPrice, WHATSAPP_PACK, type BillingPeriod } from '@/auth/plans';
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
  /** Pro only. */
  deposit?: { type: 'none' | 'fixed' | 'percent'; value: number };
};

export type Branches = {
  data: { id: string; name: string; address: string; district: string; status: Business['status']; isMain: boolean; masters: number }[];
  included: number;
  extraPrice: number;
  /** Pro's monthly price for these locations. */
  price: number | null;
};

export type TeamMember = {
  id: string;
  email: string;
  name: string | null;
  branchId: string | null;
  role: 'manager';
  accepted: boolean;
  createdAt: string;
};

type Row = { id: string; name: string | Loc; bookings: number; revenue: number; rating?: number };
export type Stats = {
  from: string;
  to: string;
  scope: 'location' | 'all';
  totals: {
    bookings: number;
    completed: number;
    cancelled: number;
    noShow: number;
    upcoming: number;
    revenue: number;
    depositsKept: number;
    fromApp: number;
    bySalon: number;
    clients: number;
    newClients: number;
    waitlist: number;
  };
  byDay: { date: string; bookings: number; revenue: number }[];
  byMaster: Row[];
  byService: Row[];
  byLocation: Row[];
};

export type ClickKind = 'view' | 'book' | 'phone' | 'whatsapp' | 'directions';
export type Clicks = {
  month: string;
  totals: Record<ClickKind, number>;
  byDay: ({ date: string } & Record<ClickKind, number>)[];
};

export type WaitingClient = {
  id: string;
  date: string;
  fromMin: number;
  toMin: number;
  masterId: string | null;
  serviceIds: string[];
  client: { name: string; phone: string };
  notifiedAt: string | null;
};

export type ReviewCode = { code: string; url: string; expiresAt: string; masterId: string | null; wallUrl: string };

export type Support = {
  email: string;
  hours: string;
  priority: boolean;
  phone: string | null;
  whatsappPack: { price: number; messages: number; days: number };
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
    | 'bookingUrl'
  >
>;

export type Checkout = { checkoutUrl: string; paymentId: string; amount?: number };

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
  branches(token: string): Promise<Branches>;
  addBranch(token: string, input: { salonName: string; address: string; district: string }): Promise<Branches['data'][number]>;
  deleteBranch(token: string, id: string): Promise<void>;
  team(token: string): Promise<TeamMember[]>;
  invite(token: string, input: { email: string; branchId?: string | null }): Promise<TeamMember>;
  removeMember(token: string, id: string): Promise<void>;
  stats(token: string, q: { from?: string; to?: string; scope?: 'location' | 'all' }): Promise<Stats>;
  clicks(token: string, month?: string): Promise<Clicks>;
  waitlist(token: string): Promise<WaitingClient[]>;
  reviewCode(token: string, masterId?: string | null): Promise<ReviewCode>;
  whatsappCheckout(token: string): Promise<Checkout>;
  support(token: string): Promise<Support>;
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
  branches: (token) => request('GET', '/business/branches', { token }),
  addBranch: (token, input) => request('POST', '/business/branches', { token, body: input }),
  deleteBranch: (token, id) => request('DELETE', `/business/branches/${enc(id)}`, { token }),
  team: (token) => request('GET', '/business/team', { token }),
  invite: (token, input) => request('POST', '/business/team', { token, body: input }),
  removeMember: (token, id) => request('DELETE', `/business/team/${enc(id)}`, { token }),
  stats: (token, q) => request('GET', '/business/stats', { token, query: q }),
  clicks: (token, month) => request('GET', '/business/clicks', { token, query: { month } }),
  waitlist: (token) => request('GET', '/business/waitlist', { token }),
  reviewCode: (token, masterId) => request('POST', '/business/review-codes', { token, body: { masterId: masterId ?? null } }),
  whatsappCheckout: (token) => request('POST', '/business/whatsapp/checkout', { token }),
  support: (token) => request('GET', '/business/support', { token }),
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
  // One location in the demo; Pro tools show their real screens with what the device has.
  branches: (token) =>
    withBusiness(token, (b) => ({
      data: [
        { id: b.id, name: b.salonName, address: b.address, district: b.district, status: b.status, isMain: true, masters: b.masters.length },
        ...demoExtra(b).branches,
      ],
      included: BRANCHES_INCLUDED,
      extraPrice: BRANCH_PRICE,
      price: proPrice(1 + demoExtra(b).branches.length),
    })),
  addBranch: (token, input) =>
    withBusiness(token, (b) => {
      if (!hasFeature(b, 'branches')) throw new AuthError('plan_required');
      const row = { id: rid('br'), name: input.salonName, address: input.address, district: input.district, status: b.status, isMain: false, masters: 0 };
      demoExtra(b).branches.push(row);
      return row;
    }),
  deleteBranch: (token, id) =>
    withBusiness(token, (b) => {
      demoExtra(b).branches = demoExtra(b).branches.filter((x) => x.id !== id);
    }),
  team: (token) => withBusiness(token, (b) => demoExtra(b).team),
  invite: (token, input) =>
    withBusiness(token, (b) => {
      if (!hasFeature(b, 'managers')) throw new AuthError('plan_required');
      const row: TeamMember = {
        id: rid('tm'),
        email: input.email.trim().toLowerCase(),
        name: null,
        branchId: input.branchId ?? null,
        role: 'manager',
        accepted: false,
        createdAt: new Date().toISOString(),
      };
      demoExtra(b).team.push(row);
      return row;
    }),
  removeMember: (token, id) =>
    withBusiness(token, (b) => {
      demoExtra(b).team = demoExtra(b).team.filter((x) => x.id !== id);
    }),
  stats: (token, q) =>
    withBusiness(token, (b) => {
      if (!hasFeature(b, 'stats')) throw new AuthError('plan_required');
      return demoStats(b, q);
    }),
  clicks: (token, month) =>
    withBusiness(token, () => ({
      month: month ?? new Date().toISOString().slice(0, 7),
      totals: { view: 0, book: 0, phone: 0, whatsapp: 0, directions: 0 },
      byDay: [],
    })),
  waitlist: async () => [],
  reviewCode: (token, masterId) =>
    withBusiness(token, (b) => {
      const code = Array.from({ length: 24 }, () => 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 55)]).join('');
      return {
        code,
        url: `${WEB_URL}/r/${code}`,
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        masterId: masterId ?? null,
        wallUrl: `${WEB_URL}/s/${b.salonId ?? b.id}`,
      };
    }),
  whatsappCheckout: async () => {
    throw new AuthError('network');
  },
  support: (token) =>
    withBusiness(token, (b) => ({
      email: 'support@yazilnow.az',
      hours: '09:00–21:00',
      priority: hasFeature(b, 'priority_support'),
      phone: hasFeature(b, 'priority_support') ? '+994 12 000 00 00' : null,
      whatsappPack: WHATSAPP_PACK,
    })),
};

const WEB_URL = 'https://yazilnow.az';

type DemoExtra = { branches: Branches['data']; team: TeamMember[] };
const demoExtra = (b: Business): DemoExtra => ((b as Business & { demoExtra?: DemoExtra }).demoExtra ??= { branches: [], team: [] });

/** The Pro statistics screen over what the owner wrote into the demo calendar. */
function demoStats(b: ReturnType<typeof complete>, q: { from?: string; to?: string; scope?: 'location' | 'all' }): Stats {
  const to = q.to ?? new Date().toISOString().slice(0, 10);
  const fromDate = q.from ? new Date(`${q.from}T00:00:00`) : new Date(new Date(`${to}T00:00:00`).getTime() - 29 * 86_400_000);
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
  const visits = calendarOf(b).filter((x) => x.kind !== 'block' && x.start.slice(0, 10) >= from && x.start.slice(0, 10) <= to);
  const done = (x: BusinessBooking) => x.status === 'completed' || (x.status === 'upcoming' && endOf(x) <= Date.now());
  const revenue = (xs: BusinessBooking[]) => xs.filter(done).reduce((n, x) => n + x.total, 0);
  const byDay: Stats['byDay'] = [];
  for (let d = new Date(`${from}T00:00:00`); d <= new Date(`${to}T00:00:00`); d = new Date(d.getTime() + 86_400_000)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const day = visits.filter((x) => x.start.slice(0, 10) === key);
    byDay.push({ date: key, bookings: day.length, revenue: revenue(day) });
  }
  const clients = new Set(visits.filter(done).map((x) => x.client.phone || x.client.name));
  return {
    from,
    to,
    scope: q.scope ?? 'location',
    totals: {
      bookings: visits.length,
      completed: visits.filter(done).length,
      cancelled: visits.filter((x) => x.status === 'cancelled').length,
      noShow: visits.filter((x) => x.status === 'no_show').length,
      upcoming: visits.filter((x) => x.status === 'upcoming' && endOf(x) > Date.now()).length,
      revenue: revenue(visits),
      depositsKept: 0,
      fromApp: visits.filter((x) => x.source !== 'salon').length,
      bySalon: visits.filter((x) => x.source === 'salon').length,
      clients: clients.size,
      newClients: clients.size,
      waitlist: 0,
    },
    byDay,
    byMaster: b.masters
      .map((m) => {
        const mine = visits.filter((x) => x.masterId === m.id);
        return { id: m.id, name: m.name, bookings: mine.length, revenue: revenue(mine) };
      })
      .filter((r) => r.bookings > 0),
    byService: b.services
      .map((s) => {
        const mine = visits.filter((x) => x.serviceIds.includes(s.id));
        return { id: s.id, name: s.name, bookings: mine.length, revenue: mine.filter(done).length * s.price };
      })
      .filter((r) => r.bookings > 0),
    byLocation: [{ id: b.id, name: b.salonName, bookings: visits.length, revenue: revenue(visits) }],
  };
}

export const businessApi: BusinessApi = isLive ? httpBusinessApi : demoBusinessApi;
