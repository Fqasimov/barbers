import {
  AuthError,
  type AuthApi,
  type AuthErrorCode,
  type Business,
  type OtpChallenge,
  type Session,
  type User,
} from './types';

/**
 * Client for the Laravel API (Sanctum bearer tokens). Contract: docs/api.md.
 * JSON keys are snake_case on the wire and camelCase in the app.
 */

type Json = Record<string, unknown>;

const snake = (s: string) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (s: string) => s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

function convert(value: unknown, key: (s: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [key(k), convert(v, key)]));
  }
  return value;
}

const ERROR_CODES: AuthErrorCode[] = [
  'invalid_credentials',
  'email_taken',
  'not_verified',
  'otp_invalid',
  'otp_expired',
  'too_many_attempts',
  'resend_too_soon',
  'not_found',
  'session_expired',
];

export function createHttpApi(baseUrl: string): AuthApi {
  const root = baseUrl.replace(/\/+$/, '');

  async function call<T>(method: string, path: string, body?: Json, token?: string): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${root}/api${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(convert(body, snake)) : undefined,
      });
    } catch {
      throw new AuthError('network');
    }
    const data = (res.status === 204 ? {} : await res.json().catch(() => ({}))) as Json;
    if (res.ok) return convert(data, camel) as T;

    const code = typeof data.error === 'string' ? (data.error as AuthErrorCode) : undefined;
    if (res.status === 422 && data.errors && typeof data.errors === 'object') {
      const fields = Object.fromEntries(
        Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [camel(k), v[0] ?? '']),
      );
      throw new AuthError(code && ERROR_CODES.includes(code) ? code : 'validation', fields);
    }
    if (res.status === 401) throw new AuthError(code === 'invalid_credentials' ? code : 'session_expired');
    if (res.status === 429) throw new AuthError(code === 'resend_too_soon' ? code : 'too_many_attempts');
    const challenge = data.otp ? (convert(data.otp, camel) as OtpChallenge) : undefined;
    throw new AuthError(code && ERROR_CODES.includes(code) ? code : 'unknown', undefined, challenge);
  }

  return {
    kind: 'http',
    register: (input) => call<OtpChallenge>('POST', '/auth/register', input),
    registerBusiness: (input) => call<OtpChallenge>('POST', '/business/register', input),
    verifyEmail: (email, code) => call<Session>('POST', '/auth/email/verify', { email, code }),
    resendOtp: (email, purpose) => call<OtpChallenge>('POST', '/auth/otp/resend', { email, purpose }),
    login: (email, password) => call<Session>('POST', '/auth/login', { email, password }),
    forgotPassword: (email) => call<OtpChallenge>('POST', '/auth/password/forgot', { email }),
    verifyResetCode: async (email, code) =>
      (await call<{ resetToken: string }>('POST', '/auth/password/verify', { email, code })).resetToken,
    resetPassword: (resetToken, password) => call<Session>('POST', '/auth/password/reset', { resetToken, password }),
    socialSignIn: (provider, profile) => call<Session>('POST', `/auth/social/${provider}`, profile),
    me: (token) => call<Session>('GET', '/me', undefined, token),
    updateProfile: (token, patch) => call<User>('PATCH', '/me', patch, token),
    startTrial: (token, plan) => call<Business>('POST', '/business/subscription/trial', { plan }, token),
    logout: (token) => call<void>('POST', '/auth/logout', undefined, token),
  };
}
