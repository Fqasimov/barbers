import type { Hours } from '@/auth/types';

/** A master's shift on one day. */
export type DayShift = { start: string; end: string };
/** Seven entries, index 0 = Sunday; null = closed / day off. */
export type Week<T> = (T | null)[];

type HoursLike = { hours?: Hours; closedDays?: number[]; hoursWeek?: Week<Hours> | null };
type ShiftLike = { workDays: number[]; shift: DayShift; schedule?: Week<DayShift> | null };

/** Opening hours on a weekday: the per-day hours when set, else the one pair on every open day. */
export function salonDay(s: HoursLike, dow: number): Hours | null {
  if (s.hoursWeek && s.hoursWeek.length === 7) return s.hoursWeek[dow] ?? null;
  if (!s.hours || (s.closedDays ?? []).includes(dow)) return null;
  return s.hours;
}

/** A master's shift on a weekday: the per-day schedule when set, else work days + one shift. */
export function masterDay(m: ShiftLike, dow: number): DayShift | null {
  if (m.schedule && m.schedule.length === 7) return m.schedule[dow] ?? null;
  return m.workDays.includes(dow) ? m.shift : null;
}

/** The whole week of a salon, 0 = Sunday. */
export const salonWeek = (s: HoursLike): Week<Hours> => [0, 1, 2, 3, 4, 5, 6].map((d) => salonDay(s, d));
/** The whole week of a master, 0 = Sunday. */
export const masterWeek = (m: ShiftLike): Week<DayShift> => [0, 1, 2, 3, 4, 5, 6].map((d) => masterDay(m, d));

/** Days in display order, Monday first. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
