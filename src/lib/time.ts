export const DAY_MS = 86_400_000;

/** '09:30' → 570 */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** 570 → '09:30' */
export function fmtClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Every salon is in Baku, so the app's calendar is Baku's wall clock (UTC+4,
 * no daylight saving since 2016), whatever time zone the phone is set to. A
 * tourist's phone on London time still sees and books 12:00 Baku time.
 * Dates stay real instants; only reading and building calendar fields goes
 * through Baku.
 */
export const BAKU_OFFSET_MIN = 240;
const OFFSET_MS = BAKU_OFFSET_MIN * 60_000;

/** The instant shifted so that its UTC fields read as Baku's wall clock. */
const wall = (d: Date) => new Date(d.getTime() + OFFSET_MS);

/** 0 = Sunday … 6 = Saturday, in Baku. */
export const weekday = (d: Date) => wall(d).getUTCDay();
/** Day of the month in Baku. */
export const dayOfMonth = (d: Date) => wall(d).getUTCDate();
/** 0 = January, in Baku. */
export const monthIndex = (d: Date) => wall(d).getUTCMonth();
export const yearOf = (d: Date) => wall(d).getUTCFullYear();

/** Baku midnight of the day the instant falls on. */
export function startOfDay(d: Date): Date {
  const w = wall(d);
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()) - OFFSET_MS);
}

/** Whole days later (Baku has no DST, so a day is always 24 hours). */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

/** Baku calendar key — 'YYYY-MM-DD'. */
export function dayKey(d: Date): string {
  const w = wall(d);
  return `${w.getUTCFullYear()}-${String(w.getUTCMonth() + 1).padStart(2, '0')}-${String(w.getUTCDate()).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' → Baku midnight. */
export function fromDayKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) - OFFSET_MS);
}

/** The first day of a month in Baku, `offset` months from the one `d` is in. */
export function monthStart(d: Date, offset = 0): Date {
  const w = wall(d);
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth() + offset, 1) - OFFSET_MS);
}

export function sameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** Today plus the next six days. */
export function weekFrom(today: Date): Date[] {
  const start = startOfDay(today);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Minutes since Baku midnight. */
export function minutesOfDay(d: Date): number {
  const w = wall(d);
  return w.getUTCHours() * 60 + w.getUTCMinutes();
}

/** That day in Baku at minutes past midnight. */
export function atMinutes(day: Date, minutes: number): Date {
  return new Date(startOfDay(day).getTime() + minutes * 60_000);
}
