import { AuthError, type AuthErrorCode, type OtpChallenge } from '@/auth/types';

/**
 * HTTP client for the Laravel API (docs/api.md). JSON keys are snake_case on the
 * wire and camelCase in the app. Every failure becomes an `AuthError` with a code
 * the UI knows how to explain.
 */

/** Set EXPO_PUBLIC_API_URL (for example https://api.ustatap.az) to use the real server. */
export const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') || null;
export const isLive = API_URL !== null;

type Json = Record<string, unknown>;

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
export const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

export function convert(value: unknown, key: (s: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, key));
  if (value && typeof value === 'object' && !(value instanceof FormData)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [key(k), convert(v, key)]));
  }
  return value;
}

const KNOWN: AuthErrorCode[] = [
  'invalid_credentials',
  'email_taken',
  'not_verified',
  'otp_invalid',
  'otp_expired',
  'too_many_attempts',
  'resend_too_soon',
  'not_found',
  'session_expired',
  'slot_taken',
  'overlaps_bookings',
  'too_late_to_cancel',
  'not_reviewable',
  'forbidden',
  'subscription_required',
  'plan_required',
  'booking_external',
  'hold_expired',
  'code_used',
  'own_salon',
  'review_limit',
  'waitlist_limit',
  'has_bookings',
];

/** The salon location /business calls act on (Pro branches); null = the main salon. */
let branch: string | null = null;
export const setBranch = (id: string | null) => {
  branch = id;
};
export const currentBranch = () => branch;

const TIMEOUT_MS = 20_000;

/** `query` values that are arrays are sent as `key[]=a&key[]=b`, as Laravel expects. */
function queryString(query?: Record<string, string | number | string[] | undefined>) {
  if (!query) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    const name = snake(k);
    if (Array.isArray(v)) v.forEach((x) => parts.push(`${name}[]=${encodeURIComponent(x)}`));
    else parts.push(`${name}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  opts: {
    body?: Json | FormData;
    token?: string;
    query?: Record<string, string | number | string[] | undefined>;
    /** Skip the HTTP cache (public GETs are cacheable for a minute). */
    fresh?: boolean;
  } = {},
): Promise<T> {
  if (!API_URL) throw new AuthError('network');
  const form = opts.body instanceof FormData;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}${queryString(opts.query)}`, {
      method,
      signal: controller.signal,
      ...(opts.fresh ? { cache: 'no-store' as const } : {}),
      headers: {
        Accept: 'application/json',
        ...(form || !opts.body ? {} : { 'Content-Type': 'application/json' }),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
        ...(branch && path.startsWith('/business') ? { 'X-Branch': branch } : {}),
      },
      body: !opts.body ? undefined : form ? (opts.body as FormData) : JSON.stringify(convert(opts.body, snake)),
    });
  } catch {
    throw new AuthError('network');
  } finally {
    clearTimeout(timer);
  }
  const data = (res.status === 204 ? {} : await res.json().catch(() => ({}))) as Json;
  if (res.ok) return convert(data, camel) as T;

  const code = typeof data.error === 'string' ? (data.error as AuthErrorCode) : undefined;
  const known = code && KNOWN.includes(code) ? code : undefined;
  if (res.status === 422 && data.errors && typeof data.errors === 'object') {
    const fields = Object.fromEntries(
      Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [camel(k), v[0] ?? '']),
    );
    throw new AuthError(known ?? 'validation', fields);
  }
  if (res.status === 401) throw new AuthError(known === 'invalid_credentials' ? known : 'session_expired');
  if (res.status === 403 && !known) throw new AuthError('forbidden');
  if (res.status === 404 && !known) throw new AuthError('not_found');
  if (res.status === 409 && !known) throw new AuthError('slot_taken');
  if (res.status === 410) throw new AuthError('code_used');
  if (res.status === 429 && known === 'review_limit') throw new AuthError(known);
  if (res.status === 429) throw new AuthError(known === 'resend_too_soon' ? known : 'too_many_attempts');
  const challenge = data.otp ? (convert(data.otp, camel) as OtpChallenge) : undefined;
  throw new AuthError(known ?? 'unknown', undefined, challenge);
}
