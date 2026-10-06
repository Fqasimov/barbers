import * as Crypto from 'expo-crypto';

/**
 * Hashing for the on-device demo backend only. The Laravel backend hashes
 * passwords with bcrypt/argon2 server-side; the app never stores a password.
 */
export const HASH_ROUNDS = 1000;

const sha256 = (s: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);

/** Salted, iterated SHA-256. Mirrors `scripts/hash-demo-password.mjs`. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  let h = `${salt}:${password}`;
  for (let i = 0; i < HASH_ROUNDS; i++) h = await sha256(`${salt}:${h}`);
  return h;
}

export const hashCode = (code: string, salt: string) => sha256(`${salt}:otp:${code}`);

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export const randomHex = (bytes = 16) => hex(Crypto.getRandomBytes(bytes));

/** Six digits from a CSPRNG, with rejection sampling so every code is equally likely. */
export function randomOtp(): string {
  const limit = 4_294_000_000; // largest multiple of 1e6 below 2^32
  for (;;) {
    const n = Crypto.getRandomValues(new Uint32Array(1))[0];
    if (n < limit) return String(n % 1_000_000).padStart(6, '0');
  }
}

/** Constant-time string comparison for equal-length hex digests. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
