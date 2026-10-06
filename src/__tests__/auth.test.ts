/* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories must require lazily */
import {
  checkBirthDate,
  checkEmail,
  checkName,
  checkPassword,
  checkPhone,
  formatDate,
  formatPhone,
  parseDate,
  toE164,
} from '@/auth/validation';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-crypto', () => {
  const nodeCrypto = require('node:crypto') as {
    createHash: (alg: string) => { update: (s: string, enc: string) => { digest: (enc: string) => string } };
    randomBytes: (n: number) => Uint8Array;
    getRandomValues: <T extends Uint32Array>(a: T) => T;
  };
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_alg: string, s: string) =>
      nodeCrypto.createHash('sha256').update(s, 'utf8').digest('hex'),
    getRandomBytes: (n: number) => new Uint8Array(nodeCrypto.randomBytes(n)),
    getRandomValues: <T extends Uint32Array>(a: T) => nodeCrypto.getRandomValues(a),
  };
});

// Imported after the mocks.
const { localApi } = require('@/auth/local') as typeof import('@/auth/local');

describe('validation', () => {
  it('accepts Azerbaijani names and rejects digits', () => {
    expect(checkName('Gülnarə')).toBeNull();
    expect(checkName("O'Brien")).toBeNull();
    expect(checkName('Анна-Мария')).toBeNull();
    expect(checkName('A1')).toBe('errName');
    expect(checkName('  ')).toBe('errRequired');
  });

  it('formats and validates Azerbaijani mobile numbers', () => {
    expect(formatPhone('0501234567')).toBe('50 123 45 67');
    expect(toE164('50 123 45 67')).toBe('+994501234567');
    expect(checkPhone('50 123 45 67')).toBeNull();
    expect(checkPhone('12 345 67 89')).toBe('errPhone');
    expect(checkPhone('50 123')).toBe('errPhone');
  });

  it('parses real dates and enforces the minimum age', () => {
    expect(formatDate('06041995')).toBe('06.04.1995');
    expect(parseDate('06.04.1995')).toBe('1995-04-06');
    expect(parseDate('31.02.2000')).toBeNull();
    const now = new Date(2026, 9, 6);
    expect(checkBirthDate('06.04.1995', now)).toBeNull();
    expect(checkBirthDate('01.01.2020', now)).toBe('errTooYoung');
    expect(checkBirthDate('1995', now)).toBe('errDate');
  });

  it('checks email and password rules', () => {
    expect(checkEmail('a@gmail.com')).toBeNull();
    expect(checkEmail('a@b')).toBe('errEmail');
    expect(checkPassword('abc12')).toBe('errPasswordLength');
    expect(checkPassword('abcdefg')).toBe('errPasswordMix');
    expect(checkPassword('abc1234')).toBeNull();
  });
});

describe('demo backend', () => {
  // The demo password is never committed: run with USTA_DEMO_PASSWORD=… to check it.
  const demoPassword = process.env.USTA_DEMO_PASSWORD;
  (demoPassword ? it : it.skip)('signs in the seeded demo account with its password only', async () => {
    const session = await localApi.login('Faiq.Farid0604@gmail.com', demoPassword!);
    expect(session.user.email).toBe('faiq.farid0604@gmail.com');
    expect(session.user.emailVerified).toBe(true);
    expect(session.token).toHaveLength(48);
    await expect(localApi.login('faiq.farid0604@gmail.com', 'wrong1')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
    await expect(localApi.login('nobody@gmail.com', demoPassword!)).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
  });

  it('registers, rejects a wrong code, then verifies with the emailed code', async () => {
    const challenge = await localApi.register({
      firstName: 'Aysel',
      lastName: 'Məmmədova',
      phone: '+994551234567',
      birthDate: '1998-03-12',
      gender: 'female',
      email: 'aysel@example.com',
      password: 'secret12',
    });
    expect(challenge.demoCode).toMatch(/^\d{6}$/);
    const wrong = challenge.demoCode === '000000' ? '111111' : '000000';
    await expect(localApi.verifyEmail('aysel@example.com', wrong)).rejects.toMatchObject({ code: 'otp_invalid' });
    await expect(localApi.login('aysel@example.com', 'secret12')).rejects.toMatchObject({ code: 'not_verified' });
  });

  it('locks a code after five wrong attempts', async () => {
    const c = await localApi.register({
      firstName: 'Elvin',
      lastName: 'Quliyev',
      phone: '+994501112233',
      birthDate: '1990-01-01',
      gender: 'male',
      email: 'elvin@example.com',
      password: 'secret12',
    });
    const wrong = c.demoCode === '000000' ? '111111' : '000000';
    for (let i = 0; i < 4; i++) {
      await expect(localApi.verifyEmail('elvin@example.com', wrong)).rejects.toMatchObject({ code: 'otp_invalid' });
    }
    await expect(localApi.verifyEmail('elvin@example.com', wrong)).rejects.toMatchObject({
      code: 'too_many_attempts',
    });
    await expect(localApi.verifyEmail('elvin@example.com', c.demoCode!)).rejects.toMatchObject({
      code: 'too_many_attempts',
    });
  });

  it('registers a business and starts a 30-day trial once', async () => {
    const c = await localApi.registerBusiness({
      firstName: 'Rauf',
      lastName: 'Məmmədov',
      phone: '+994707654321',
      email: 'owner@example.com',
      password: 'salon123',
      salonName: 'Test Barbers',
      categories: ['barber'],
      district: 'Nəsimi',
      address: 'Nizami küç. 1',
      audience: 'men',
    });
    const session = await localApi.verifyEmail('owner@example.com', c.demoCode!);
    expect(session.user.role).toBe('business');
    expect(session.business?.status).toBe('pending_review');
    const b = await localApi.startTrial(session.token, 'pro');
    const days =
      (new Date(b.subscription!.trialEndsAt).getTime() - new Date(b.subscription!.startedAt).getTime()) / 86_400_000;
    expect(Math.round(days)).toBe(30);
    const again = await localApi.startTrial(session.token, 'studio');
    expect(again.subscription!.plan).toBe('studio');
    expect(again.subscription!.trialEndsAt).toBe(b.subscription!.trialEndsAt);
  });

  it('resets a password with a code and signs out other sessions', async () => {
    const email = 'reset@example.com';
    const reg = await localApi.register({
      firstName: 'Nərmin',
      lastName: 'Əliyeva',
      phone: '+994771234567',
      birthDate: '1996-05-20',
      gender: 'female',
      email,
      password: 'oldPass1',
    });
    const old = await localApi.verifyEmail(email, reg.demoCode!);
    const c = await localApi.forgotPassword(email);
    const token = await localApi.verifyResetCode(email, c.demoCode!);
    await localApi.resetPassword(token, 'NewPass9');
    await expect(localApi.me(old.token)).rejects.toMatchObject({ code: 'session_expired' });
    await expect(localApi.login(email, 'oldPass1')).rejects.toMatchObject({ code: 'invalid_credentials' });
    expect((await localApi.login(email, 'NewPass9')).user.id).toBe(old.user.id);
  });
});
