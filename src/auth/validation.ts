import type { StringKey } from '@/i18n/strings';

/** Each validator returns an i18n key for the error, or null when the value is fine. */
export type Check = StringKey | null;

const NAME = /^\p{L}[\p{L}\p{M}' -]{0,39}$/u;
export const checkName = (v: string): Check => {
  const s = v.trim();
  if (!s) return 'errRequired';
  return NAME.test(s) && s.length >= 2 ? null : 'errName';
};

/** Azerbaijani mobile prefixes: Azercell 10/50/51, Bakcell 55/99, Nar 70/77, Naxtel 60. */
const AZ_PREFIX = ['10', '50', '51', '55', '60', '70', '77', '99'];
export const phoneDigits = (v: string) => v.replace(/\D/g, '').replace(/^994/, '').replace(/^0/, '').slice(0, 9);
export const checkPhone = (v: string): Check => {
  const d = phoneDigits(v);
  if (!d) return 'errRequired';
  return d.length === 9 && AZ_PREFIX.includes(d.slice(0, 2)) ? null : 'errPhone';
};
/** "501234567" → "50 123 45 67" while typing. */
export const formatPhone = (v: string) => {
  const d = phoneDigits(v);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
};
export const toE164 = (v: string) => `+994${phoneDigits(v)}`;

/** "06041995" → "06.04.1995" while typing. */
export const formatDate = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4, 8)].filter(Boolean).join('.');
};
/** DD.MM.YYYY → YYYY-MM-DD, or null if it isn't a real date. */
export const parseDate = (v: string): string | null => {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(v.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Date.UTC(+yyyy, +mm - 1, +dd));
  if (d.getUTCFullYear() !== +yyyy || d.getUTCMonth() !== +mm - 1 || d.getUTCDate() !== +dd) return null;
  return `${yyyy}-${mm}-${dd}`;
};
export const isoToDisplay = (iso: string) => (iso ? iso.split('-').reverse().join('.') : '');
export const MIN_AGE = 13;
export const checkBirthDate = (v: string, now = new Date()): Check => {
  if (!v.trim()) return 'errRequired';
  const iso = parseDate(v);
  if (!iso) return 'errDate';
  const [y, m, d] = iso.split('-').map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  if (age > 110 || age < 0) return 'errDate';
  return age < MIN_AGE ? 'errTooYoung' : null;
};

export const checkEmail = (v: string): Check => {
  const s = v.trim();
  if (!s) return 'errRequired';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 254 ? null : 'errEmail';
};

export const PASSWORD_MIN = 6;
export const checkPassword = (v: string): Check => {
  if (!v) return 'errRequired';
  if (v.length < PASSWORD_MIN || v.length > 64) return 'errPasswordLength';
  return /\p{L}/u.test(v) && /\d/.test(v) ? null : 'errPasswordMix';
};

export const checkRequired = (v: string): Check => (v.trim() ? null : 'errRequired');
