import { distanceKm } from '@/lib/geo';
import { minutesOfDay, sameDay, startOfDay } from '@/lib/time';

import { daySchedule, eligibleMasters, LEAD_MINUTES } from './availability';
import { bayesian, liveRating } from './ranking';
import type { Booking, Coords, Master, PriceLevel, Review, Salon, Service } from './types';

export type TimeWindow = 'any' | 'morning' | 'afternoon' | 'evening';
export type FindSort = 'earliest' | 'cheapest' | 'nearest' | 'rating';

export const windows: Record<TimeWindow, [number, number]> = {
  any: [0, 24 * 60],
  morning: [9 * 60, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening: [17 * 60, 24 * 60],
};

export type SlotResult = {
  salon: Salon;
  service: Service;
  master: Master;
  /** Minutes from midnight. */
  time: number;
  date: Date;
  distance: number;
  rating: number;
};

/**
 * City-wide search: every venue that offers `serviceKey`, every master who
 * does it, every free start time on `date` inside the window. One row per
 * venue and time — the best-rated free master wins it.
 */
export function findSlots(args: {
  salons: Salon[];
  serviceKey: string;
  date: Date;
  window: TimeWindow;
  origin: Coords;
  bookings: Booking[];
  localReviews: Review[];
  now: Date;
  priceLevels?: PriceLevel[];
  womenOnly?: boolean;
  englishSpeaking?: boolean;
  sort?: FindSort;
}): SlotResult[] {
  const { serviceKey, date, window, origin, bookings, localReviews, now } = args;
  const [from, to] = windows[window];
  const out: SlotResult[] = [];

  for (const salon of args.salons) {
    if (args.womenOnly && !salon.womenOnly) continue;
    if (args.priceLevels?.length && !args.priceLevels.includes(salon.priceLevel)) continue;
    const service = salon.services.find((s) => s.key === serviceKey);
    if (!service) continue;

    const masters = eligibleMasters(salon, [service.id])
      .filter((m) => !args.englishSpeaking || m.languages.includes('en'))
      .sort((a, b) => b.rating - a.rating);
    const taken = new Set<number>();
    const distance = distanceKm(origin, salon.coords);
    const rating = bayesian(liveRating(salon, localReviews));

    for (const master of masters) {
      const day = daySchedule({
        salon,
        master,
        date: startOfDay(date),
        durationMin: service.durationMin,
        bookings,
        now,
      });
      for (const time of day.slots) {
        if (time < from || time >= to || taken.has(time)) continue;
        taken.add(time);
        out.push({ salon, service, master, time, date: startOfDay(date), distance, rating });
      }
    }
  }

  const by: Record<FindSort, (a: SlotResult, b: SlotResult) => number> = {
    earliest: (a, b) => a.time - b.time || a.distance - b.distance,
    cheapest: (a, b) => a.service.price - b.service.price || a.time - b.time,
    nearest: (a, b) => a.distance - b.distance || a.time - b.time,
    rating: (a, b) => b.rating - a.rating || a.time - b.time,
  };
  return out.sort(by[args.sort ?? 'earliest']);
}

/** The next open slot today for each popular service, one per venue — for the home screen. */
export function openToday(args: {
  salons: Salon[];
  serviceKeys: string[];
  origin: Coords;
  bookings: Booking[];
  localReviews: Review[];
  now: Date;
  limit: number;
}): SlotResult[] {
  const seen = new Set<string>();
  const picks: SlotResult[] = [];
  for (const key of args.serviceKeys) {
    const slots = findSlots({ ...args, serviceKey: key, date: args.now, window: 'any', sort: 'earliest' });
    const near = slots.filter((s) => s.distance < 6 && !seen.has(s.salon.id));
    const pick = near[0] ?? slots.find((s) => !seen.has(s.salon.id));
    if (pick) {
      seen.add(pick.salon.id);
      picks.push(pick);
    }
  }
  return picks.sort((a, b) => a.time - b.time).slice(0, args.limit);
}

/** Can this slot still be booked right now? (Guards deep links from search.) */
export function slotStillFree(args: {
  salon: Salon;
  master: Master;
  date: Date;
  time: number;
  durationMin: number;
  bookings: Booking[];
  now: Date;
}): boolean {
  if (sameDay(args.date, args.now) && args.time < minutesOfDay(args.now) + LEAD_MINUTES) return false;
  return daySchedule({ ...args, date: startOfDay(args.date) }).slots.includes(args.time);
}
