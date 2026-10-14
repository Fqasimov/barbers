import { config, isDemo } from './config';
import type { CategoryId, Key, Loc } from './i18n';

/** Errors the site knows how to explain; anything else reads as "something went wrong". */
export type ErrorCode =
  | 'email_taken'
  | 'otp_invalid'
  | 'otp_expired'
  | 'too_many_attempts'
  | 'resend_too_soon'
  | 'validation'
  | 'network'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    /** Laravel 422 field messages, keyed by snake_case field. */
    public fields: Record<string, string> = {},
  ) {
    super(code);
  }
}

const KNOWN: ErrorCode[] = ['email_taken', 'otp_invalid', 'otp_expired', 'too_many_attempts', 'resend_too_soon'];

export async function request<T>(method: 'GET' | 'POST', path: string, opts: { body?: unknown; token?: string } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}/api${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError('network');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => null);
  if (res.ok) return json as T;

  const code = json?.error as string | undefined;
  if (code && (KNOWN as string[]).includes(code)) throw new ApiError(code as ErrorCode);
  if (res.status === 422 && json?.errors) {
    const fields = Object.fromEntries(
      Object.entries(json.errors as Record<string, string[]>).map(([k, v]) => [k.split('.')[0], v[0]]),
    );
    throw new ApiError('validation', fields);
  }
  if (res.status === 429) throw new ApiError('too_many_attempts');
  throw new ApiError('unknown');
}

export const errorKey = (e: unknown): Key => {
  const code = e instanceof ApiError ? e.code : 'unknown';
  switch (code) {
    case 'email_taken':
      return 'errEmailTaken';
    case 'otp_invalid':
      return 'errOtpInvalid';
    case 'otp_expired':
      return 'errOtpExpired';
    case 'too_many_attempts':
      return 'errTooMany';
    case 'resend_too_soon':
      return 'errResendSoon';
    case 'network':
      return 'errNetwork';
    default:
      return 'errUnknown';
  }
};

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

export type Venue = {
  id: string;
  name: string;
  kind: Loc;
  categories: CategoryId[];
  district: string;
  address: string;
  coords: { latitude: number; longitude: number };
  rating: number;
  reviewCount: number;
  tone: string;
  photo: string | null;
};

export type VenueReview = { author: string; rating: number; text: string; date: string; serviceName: Loc | null };

export type Stats = {
  salons: number | null;
  masters: number | null;
  bookings: number | null;
  clients: number | null;
  average_rating: number | null;
  districts: number | null;
  updated_at?: string;
};

type DemoData = {
  salons: (Omit<Venue, 'photo'> & { photos: string[]; masters: number })[];
  reviews: Record<string, VenueReview[]>;
};

let demoData: Promise<DemoData> | null = null;
const demo = () => (demoData ??= fetch('/data/demo.json').then((r) => r.json() as Promise<DemoData>));

type ApiSalon = {
  id: string;
  name: string;
  kind: Loc;
  categories: CategoryId[];
  district: string;
  address: string;
  coords: { latitude: number; longitude: number };
  rating: number;
  review_count: number;
  tone: string;
  photos: string[];
};

/** Every listed venue: from the API when it's set, sample data in demo mode, otherwise none. */
export async function loadVenues(): Promise<Venue[]> {
  if (config.apiUrl) {
    const list = await request<ApiSalon[]>('GET', '/salons');
    return list.map((s) => ({
      id: s.id,
      name: s.name,
      kind: s.kind,
      categories: s.categories,
      district: s.district,
      address: s.address,
      coords: s.coords,
      rating: s.rating,
      reviewCount: s.review_count,
      tone: s.tone,
      photo: s.photos?.[0] ?? null,
    }));
  }
  if (!isDemo) return [];
  const d = await demo();
  return d.salons.map(({ photos, masters: _m, ...s }) => ({ ...s, photo: photos[0] ?? null }));
}

const reviewCache = new Map<string, Promise<VenueReview[]>>();

/** The newest reviews with text, fetched once per venue. */
export function loadReviews(id: string): Promise<VenueReview[]> {
  let p = reviewCache.get(id);
  if (!p) {
    p = config.apiUrl
      ? request<{ data: { author: string; rating: number; text: string; date: string; service_name: Loc | null }[] }>(
          'GET',
          `/salons/${encodeURIComponent(id)}/reviews`,
        ).then((r) =>
          r.data
            .filter((x) => x.text?.trim())
            .map((x) => ({
              author: x.author,
              rating: x.rating,
              text: x.text,
              date: x.date,
              serviceName: x.service_name,
            })),
        )
      : demo().then((d) => d.reviews[id] ?? []);
    p.catch(() => reviewCache.delete(id));
    reviewCache.set(id, p);
  }
  return p;
}

/**
 * Public figures. Live: GET /api/stats. Demo: what the sample data can honestly
 * say; bookings and clients stay empty, to show the placeholders.
 */
export async function loadStats(): Promise<Stats | null> {
  if (config.apiUrl) return request<Stats>('GET', '/stats');
  if (!isDemo) return null;
  const d = await demo();
  const reviews = d.salons.reduce((n, s) => n + s.reviewCount, 0);
  return {
    salons: d.salons.length,
    masters: d.salons.reduce((n, s) => n + s.masters, 0),
    bookings: null,
    clients: null,
    average_rating: reviews ? d.salons.reduce((n, s) => n + s.rating * s.reviewCount, 0) / reviews : null,
    districts: new Set(d.salons.map((s) => s.district.toLowerCase())).size,
  };
}

export async function loadPlanPrices(): Promise<Record<string, number>> {
  if (!config.apiUrl) return {};
  try {
    const list = await request<{ id: string; price: number }[]>('GET', '/plans');
    return Object.fromEntries(list.map((p) => [p.id, p.price]));
  } catch {
    return {};
  }
}
