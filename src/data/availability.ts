import { seeded } from '@/lib/random';
import { addDays, atMinutes, dayKey, minutesOfDay, sameDay, startOfDay, toMinutes } from '@/lib/time';

import type { Booking, Master, Salon } from './types';

export const SLOT_STEP = 30;
/** Earliest bookable start, measured from now, for same-day appointments. */
export const LEAD_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 7;

export type Interval = { start: number; end: number };

export type DaySchedule = {
  date: Date;
  off: boolean;
  /** Start times (minutes from midnight) that fit the requested duration. */
  slots: number[];
};

const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** The hours a master can actually take clients on a given weekday. */
export function workingWindow(salon: Salon, master: Master, date: Date): Interval | null {
  const dow = date.getDay();
  if (salon.closedDays.includes(dow) || !master.workDays.includes(dow)) return null;
  const start = Math.max(toMinutes(master.shift.start), toMinutes(salon.hours.open));
  const end = Math.min(toMinutes(master.shift.end), toMinutes(salon.hours.close));
  return end > start ? { start, end } : null;
}

/**
 * Appointments other clients already hold — deterministic per master and day,
 * so the schedule is stable across renders and devices. Weekends run busier.
 */
export function existingAppointments(master: Master, date: Date, window: Interval): Interval[] {
  const rand = seeded(`busy:${master.id}:${dayKey(date)}`);
  const dow = date.getDay();
  const load = dow === 5 || dow === 6 ? 0.24 : dow === 0 ? 0.2 : 0.17;
  const busy: Interval[] = [];
  let t = window.start;
  while (t < window.end) {
    if (rand() < load) {
      const blocks = 1 + Math.floor(rand() * 3);
      const end = Math.min(window.end, t + blocks * SLOT_STEP);
      busy.push({ start: t, end });
      t = end;
    } else {
      t += SLOT_STEP;
    }
  }
  return busy;
}

/** Intervals held by bookings made on this device. */
export function bookedIntervals(bookings: Booking[], masterId: string, date: Date): Interval[] {
  return bookings
    .filter((b) => b.status === 'upcoming' && b.masterId === masterId && sameDay(new Date(b.start), date))
    .map((b) => {
      const start = minutesOfDay(new Date(b.start));
      return { start, end: start + b.durationMin };
    });
}

export function daySchedule(args: {
  salon: Salon;
  master: Master;
  date: Date;
  durationMin: number;
  bookings: Booking[];
  now: Date;
}): DaySchedule {
  const { salon, master, date, durationMin, bookings, now } = args;
  const window = workingWindow(salon, master, date);
  if (!window) return { date, off: true, slots: [] };

  const busy = [...existingAppointments(master, date, window), ...bookedIntervals(bookings, master.id, date)];
  const earliest = sameDay(date, now) ? minutesOfDay(now) + LEAD_MINUTES : -Infinity;

  const slots: number[] = [];
  for (let t = window.start; t + durationMin <= window.end; t += SLOT_STEP) {
    if (t < earliest) continue;
    const candidate = { start: t, end: t + durationMin };
    if (busy.some((b) => overlaps(b, candidate))) continue;
    slots.push(t);
  }
  return { date, off: false, slots };
}

export function weekSchedule(args: {
  salon: Salon;
  master: Master;
  durationMin: number;
  bookings: Booking[];
  now: Date;
}): DaySchedule[] {
  const today = startOfDay(args.now);
  return Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => daySchedule({ ...args, date: addDays(today, i) }));
}

/** The first open slot in the booking window, if any. */
export function nextAvailable(args: {
  salon: Salon;
  master: Master;
  durationMin: number;
  bookings: Booking[];
  now: Date;
}): Date | null {
  for (const day of weekSchedule(args)) {
    if (day.slots.length) return atMinutes(day.date, day.slots[0]);
  }
  return null;
}

/** Masters able to perform every selected service. */
export function eligibleMasters(salon: Salon, serviceIds: string[]): Master[] {
  return salon.masters.filter((m) => serviceIds.every((id) => m.serviceIds.includes(id)));
}

/**
 * "Any master": merge every eligible master's schedule. Each slot remembers the
 * best-rated master who is free then, so the booking can be assigned on confirm.
 */
export function anyMasterWeek(args: {
  salon: Salon;
  masters: Master[];
  durationMin: number;
  bookings: Booking[];
  now: Date;
}): { days: DaySchedule[]; assign: (date: Date, minutes: number) => Master | undefined } {
  const ranked = [...args.masters].sort((a, b) => b.rating - a.rating);
  const perMaster = ranked.map((master) => ({ master, week: weekSchedule({ ...args, master }) }));
  const days: DaySchedule[] = perMaster[0]
    ? perMaster[0].week.map((_, i) => {
        const date = perMaster[0].week[i].date;
        const all = new Set<number>();
        let anyOn = false;
        for (const { week } of perMaster) {
          if (!week[i].off) anyOn = true;
          week[i].slots.forEach((s) => all.add(s));
        }
        return { date, off: !anyOn, slots: [...all].sort((a, b) => a - b) };
      })
    : [];
  const assign = (date: Date, minutes: number) =>
    perMaster.find(({ week }) => week.find((d) => sameDay(d.date, date))?.slots.includes(minutes))?.master;
  return { days, assign };
}

export type SlotGroup = { label: 'Morning' | 'Afternoon' | 'Evening'; slots: number[] };

export function groupSlots(slots: number[]): SlotGroup[] {
  const groups: SlotGroup[] = [
    { label: 'Morning', slots: slots.filter((s) => s < 12 * 60) },
    { label: 'Afternoon', slots: slots.filter((s) => s >= 12 * 60 && s < 17 * 60) },
    { label: 'Evening', slots: slots.filter((s) => s >= 17 * 60) },
  ];
  return groups.filter((g) => g.slots.length > 0);
}
