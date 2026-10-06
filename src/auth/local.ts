import AsyncStorage from '@react-native-async-storage/async-storage';

import { hashCode, hashPassword, randomHex, randomOtp, safeEqual } from './crypto';
import { TRIAL_DAYS } from './plans';
import {
  AuthError,
  type AuthApi,
  type Business,
  type OtpChallenge,
  type OtpPurpose,
  type Session,
  type User,
} from './types';

/**
 * On-device stand-in for the Laravel backend, used until the API has a domain.
 * It keeps the same contract (`AuthApi`) and the same rules as the real
 * service: hashed passwords, emailed six-digit codes that expire, attempt
 * limits and resend cooldowns. Because there is no mail server yet, the code
 * is returned as `demoCode` and shown on the verification screen instead of
 * being emailed.
 *
 * It is a demo: data lives on this device only and nothing here is a security
 * boundary. Switch to the HTTP backend by setting EXPO_PUBLIC_API_URL.
 */

const KEY = 'usta-demo-backend-v1';
const OTP_TTL_MS = 10 * 60_000;
const OTP_RESEND_MS = 60_000;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TTL_MS = 15 * 60_000;

type StoredUser = User & { salt: string; hash: string | null };
type StoredOtp = {
  email: string;
  purpose: OtpPurpose;
  salt: string;
  codeHash: string;
  expiresAt: number;
  resendAt: number;
  attempts: number;
};
type Db = {
  users: StoredUser[];
  businesses: Business[];
  otps: StoredOtp[];
  sessions: { token: string; userId: string }[];
  resets: { token: string; email: string; expiresAt: number }[];
};

/**
 * The seeded demo account (verified). Only a salted hash is stored; it was made
 * with scripts/hash-demo-password.mjs. Phone, date of birth and gender are left
 * for the owner to fill in on first sign-in.
 */
const DEMO_USER: StoredUser = {
  id: 'u_demo_faiq',
  firstName: 'Faiq',
  lastName: 'Farid',
  email: 'faiq.farid0604@gmail.com',
  phone: '',
  birthDate: '',
  gender: null,
  role: 'customer',
  provider: 'password',
  emailVerified: true,
  createdAt: '2026-10-06T00:00:00.000Z',
  salt: '0765bf57806863e7917aeca05b9afce8',
  hash: 'f9f393a8799d01bbf514dd214c0d77907a3e313fdd30771e1b1d2d5f91087047',
};

const empty = (): Db => ({ users: [DEMO_USER], businesses: [], otps: [], sessions: [], resets: [] });

let cache: Db | null = null;
async function load(): Promise<Db> {
  if (cache) return cache;
  const raw = await AsyncStorage.getItem(KEY);
  const db: Db = raw ? (JSON.parse(raw) as Db) : empty();
  if (!db.users.some((u) => u.id === DEMO_USER.id)) db.users.push(DEMO_USER);
  cache = db;
  return db;
}
async function save(db: Db) {
  cache = db;
  await AsyncStorage.setItem(KEY, JSON.stringify(db));
}

const norm = (email: string) => email.trim().toLowerCase();
const publicUser = ({ salt: _s, hash: _h, ...u }: StoredUser): User => u;
/** A little latency so loading states are exercised like they will be on a network. */
const pause = () => new Promise((r) => setTimeout(r, 350));

async function issueOtp(db: Db, email: string, purpose: OtpPurpose, force = false): Promise<OtpChallenge> {
  const now = Date.now();
  const prev = db.otps.find((o) => o.email === email && o.purpose === purpose);
  if (prev && !force && prev.resendAt > now) throw new AuthError('resend_too_soon');
  const code = randomOtp();
  const salt = randomHex(8);
  const otp: StoredOtp = {
    email,
    purpose,
    salt,
    codeHash: await hashCode(code, salt),
    expiresAt: now + OTP_TTL_MS,
    resendAt: now + OTP_RESEND_MS,
    attempts: 0,
  };
  db.otps = [...db.otps.filter((o) => !(o.email === email && o.purpose === purpose)), otp];
  await save(db);
  return {
    email,
    purpose,
    expiresAt: new Date(otp.expiresAt).toISOString(),
    resendAt: new Date(otp.resendAt).toISOString(),
    demoCode: code,
  };
}

async function checkOtp(db: Db, email: string, purpose: OtpPurpose, code: string) {
  const otp = db.otps.find((o) => o.email === email && o.purpose === purpose);
  if (!otp) throw new AuthError('otp_expired');
  if (Date.now() > otp.expiresAt) throw new AuthError('otp_expired');
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new AuthError('too_many_attempts');
  const ok = safeEqual(await hashCode(code, otp.salt), otp.codeHash);
  if (!ok) {
    otp.attempts += 1;
    await save(db);
    throw new AuthError(otp.attempts >= OTP_MAX_ATTEMPTS ? 'too_many_attempts' : 'otp_invalid');
  }
  db.otps = db.otps.filter((o) => o !== otp);
}

async function openSession(db: Db, user: StoredUser): Promise<Session> {
  const token = randomHex(24);
  db.sessions.push({ token, userId: user.id });
  await save(db);
  return { token, user: publicUser(user), business: db.businesses.find((b) => b.ownerId === user.id) ?? null };
}

function userFor(db: Db, token: string): StoredUser {
  const s = db.sessions.find((x) => x.token === token);
  const user = s && db.users.find((u) => u.id === s.userId);
  if (!user) throw new AuthError('session_expired');
  return user;
}

async function newUser(
  db: Db,
  fields: Omit<User, 'id' | 'createdAt' | 'emailVerified'>,
  password: string | null,
): Promise<StoredUser> {
  const salt = randomHex(16);
  const user: StoredUser = {
    ...fields,
    id: `u_${randomHex(8)}`,
    emailVerified: false,
    createdAt: new Date().toISOString(),
    salt,
    hash: password ? await hashPassword(password, salt) : null,
  };
  db.users.push(user);
  return user;
}

/** Social tokens are verified by the real backend; the demo only reads the claims. */
function claimsOf(idToken: string): { email?: string; given_name?: string; family_name?: string; sub?: string } {
  try {
    const part = idToken.split('.')[1] ?? '';
    const json = atob(
      part
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(part.length / 4) * 4, '='),
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export const localApi: AuthApi = {
  kind: 'demo',

  async register(input) {
    await pause();
    const db = await load();
    const email = norm(input.email);
    const existing = db.users.find((u) => u.email === email);
    if (existing?.emailVerified) throw new AuthError('email_taken');
    if (existing) db.users = db.users.filter((u) => u !== existing);
    const { password, ...rest } = input;
    await newUser(db, { ...rest, email, role: 'customer', provider: 'password' }, password);
    return issueOtp(db, email, 'register', true);
  },

  async registerBusiness(input) {
    await pause();
    const db = await load();
    const email = norm(input.email);
    const existing = db.users.find((u) => u.email === email);
    if (existing?.emailVerified) throw new AuthError('email_taken');
    if (existing) {
      db.users = db.users.filter((u) => u !== existing);
      db.businesses = db.businesses.filter((b) => b.ownerId !== existing.id);
    }
    const { password, salonName, categories, district, address, audience, ...owner } = input;
    const user = await newUser(
      db,
      { ...owner, email, birthDate: '', gender: null, role: 'business', provider: 'password' },
      password,
    );
    db.businesses.push({
      id: `b_${randomHex(8)}`,
      ownerId: user.id,
      salonName,
      categories,
      district,
      address,
      audience,
      status: 'pending_review',
      subscription: null,
      createdAt: new Date().toISOString(),
    });
    return issueOtp(db, email, 'register', true);
  },

  async verifyEmail(email, code) {
    await pause();
    const db = await load();
    const e = norm(email);
    await checkOtp(db, e, 'register', code);
    const user = db.users.find((u) => u.email === e);
    if (!user) throw new AuthError('not_found');
    user.emailVerified = true;
    return openSession(db, user);
  },

  async resendOtp(email, purpose) {
    await pause();
    const db = await load();
    return issueOtp(db, norm(email), purpose);
  },

  async login(email, password) {
    await pause();
    const db = await load();
    const user = db.users.find((u) => u.email === norm(email));
    // Same error for unknown email and wrong password, so accounts can't be probed.
    if (!user?.hash || !safeEqual(await hashPassword(password, user.salt), user.hash)) {
      throw new AuthError('invalid_credentials');
    }
    if (!user.emailVerified) {
      throw new AuthError('not_verified', undefined, await issueOtp(db, user.email, 'register', true));
    }
    return openSession(db, user);
  },

  async forgotPassword(email) {
    await pause();
    const db = await load();
    const e = norm(email);
    // Real backend: always 202 so it never reveals whether an email is registered.
    if (!db.users.some((u) => u.email === e && u.hash)) {
      const now = Date.now();
      return {
        email: e,
        purpose: 'reset',
        expiresAt: new Date(now + OTP_TTL_MS).toISOString(),
        resendAt: new Date(now + OTP_RESEND_MS).toISOString(),
      };
    }
    return issueOtp(db, e, 'reset', true);
  },

  async verifyResetCode(email, code) {
    await pause();
    const db = await load();
    const e = norm(email);
    await checkOtp(db, e, 'reset', code);
    const token = randomHex(24);
    db.resets = [...db.resets.filter((r) => r.email !== e), { token, email: e, expiresAt: Date.now() + RESET_TTL_MS }];
    await save(db);
    return token;
  },

  async resetPassword(resetToken, password) {
    await pause();
    const db = await load();
    const reset = db.resets.find((r) => r.token === resetToken);
    if (!reset || Date.now() > reset.expiresAt) throw new AuthError('otp_expired');
    const user = db.users.find((u) => u.email === reset.email);
    if (!user) throw new AuthError('not_found');
    user.salt = randomHex(16);
    user.hash = await hashPassword(password, user.salt);
    user.emailVerified = true;
    db.resets = db.resets.filter((r) => r !== reset);
    // Changing the password signs out every other device.
    db.sessions = db.sessions.filter((s) => s.userId !== user.id);
    return openSession(db, user);
  },

  async socialSignIn(provider, profile) {
    await pause();
    const db = await load();
    const claims = claimsOf(profile.idToken);
    const email = norm(profile.email ?? claims.email ?? '');
    if (!email) throw new AuthError('validation', { email: 'missing' });
    let user = db.users.find((u) => u.email === email);
    if (!user) {
      user = await newUser(
        db,
        {
          firstName: profile.firstName ?? claims.given_name ?? '',
          lastName: profile.lastName ?? claims.family_name ?? '',
          email,
          phone: '',
          birthDate: '',
          gender: null,
          role: 'customer',
          provider,
        },
        null,
      );
    }
    // The provider has already verified the address.
    user.emailVerified = true;
    return openSession(db, user);
  },

  async me(token) {
    const db = await load();
    const user = userFor(db, token);
    return { token, user: publicUser(user), business: db.businesses.find((b) => b.ownerId === user.id) ?? null };
  },

  async updateProfile(token, patch) {
    await pause();
    const db = await load();
    const user = userFor(db, token);
    Object.assign(user, patch);
    await save(db);
    return publicUser(user);
  },

  async startTrial(token, plan) {
    await pause();
    const db = await load();
    const user = userFor(db, token);
    const business = db.businesses.find((b) => b.ownerId === user.id);
    if (!business) throw new AuthError('not_found');
    // One free trial per business; choosing again only switches the plan.
    const now = new Date();
    const startedAt = business.subscription?.startedAt ?? now.toISOString();
    const trialEndsAt =
      business.subscription?.trialEndsAt ?? new Date(now.getTime() + TRIAL_DAYS * 86_400_000).toISOString();
    business.subscription = { plan, status: 'trialing', startedAt, trialEndsAt };
    await save(db);
    return business;
  },

  async logout(token) {
    const db = await load();
    db.sessions = db.sessions.filter((s) => s.token !== token);
    await save(db);
  },
};
