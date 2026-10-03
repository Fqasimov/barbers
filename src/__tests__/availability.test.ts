import {
  anyMasterWeek,
  daySchedule,
  eligibleMasters,
  groupSlots,
  LEAD_MINUTES,
  nextAvailable,
  weekSchedule,
  workingWindow,
} from '@/data/availability';
import { salons } from '@/data/salons';
import type { Booking } from '@/data/types';
import { addDays, atMinutes, startOfDay, toMinutes } from '@/lib/time';

const salon = salons.find((s) => s.id === 'old-town-barbers')!;
const rauf = salon.masters[0]; // Tue–Sat, 10:00–20:00
const cut = salon.services.find((s) => s.name === 'Signature cut')!;

/** A Monday morning, so the week ahead is predictable. */
const monday = new Date(2026, 9, 5, 8, 0);

describe('working window', () => {
  it('is closed on a master’s day off', () => {
    expect(workingWindow(salon, rauf, monday)).toBeNull();
  });

  it('clips the shift to opening hours', () => {
    const tuesday = addDays(monday, 1);
    expect(workingWindow(salon, rauf, tuesday)).toEqual({ start: toMinutes('10:00'), end: toMinutes('20:00') });
  });
});

describe('day schedule', () => {
  const tuesday = addDays(startOfDay(monday), 1);

  it('is deterministic for the same master and day', () => {
    const a = daySchedule({ salon, master: rauf, date: tuesday, durationMin: 45, bookings: [], now: monday });
    const b = daySchedule({ salon, master: rauf, date: tuesday, durationMin: 45, bookings: [], now: monday });
    expect(a.slots).toEqual(b.slots);
    expect(a.slots.length).toBeGreaterThan(0);
  });

  it('never offers a slot that runs past closing', () => {
    const day = daySchedule({ salon, master: rauf, date: tuesday, durationMin: 75, bookings: [], now: monday });
    for (const t of day.slots) expect(t + 75).toBeLessThanOrEqual(toMinutes('20:00'));
  });

  it('removes a slot once it is booked on this device', () => {
    const before = daySchedule({
      salon,
      master: rauf,
      date: tuesday,
      durationMin: cut.durationMin,
      bookings: [],
      now: monday,
    });
    const taken = before.slots[0];
    const booking: Booking = {
      id: 'b1',
      salonId: salon.id,
      masterId: rauf.id,
      serviceIds: [cut.id],
      start: atMinutes(tuesday, taken).toISOString(),
      durationMin: cut.durationMin,
      total: cut.price,
      status: 'upcoming',
      createdAt: monday.toISOString(),
    };
    const after = daySchedule({
      salon,
      master: rauf,
      date: tuesday,
      durationMin: cut.durationMin,
      bookings: [booking],
      now: monday,
    });
    expect(after.slots).not.toContain(taken);
    // A cancelled booking frees the slot again.
    const cancelled = daySchedule({
      salon,
      master: rauf,
      date: tuesday,
      durationMin: cut.durationMin,
      bookings: [{ ...booking, status: 'cancelled' }],
      now: monday,
    });
    expect(cancelled.slots).toContain(taken);
  });

  it('respects the lead time for same-day bookings', () => {
    const now = atMinutes(addDays(startOfDay(monday), 1), toMinutes('14:10'));
    const day = daySchedule({ salon, master: rauf, date: now, durationMin: 30, bookings: [], now });
    for (const t of day.slots) expect(t).toBeGreaterThanOrEqual(toMinutes('14:10') + LEAD_MINUTES);
  });
});

describe('week', () => {
  it('covers exactly seven days starting today', () => {
    const week = weekSchedule({ salon, master: rauf, durationMin: 45, bookings: [], now: monday });
    expect(week).toHaveLength(7);
    expect(week[0].date.getDate()).toBe(monday.getDate());
    expect(week[0].off).toBe(true); // Monday
  });

  it('finds the next open slot', () => {
    const next = nextAvailable({ salon, master: rauf, durationMin: 45, bookings: [], now: monday });
    expect(next).not.toBeNull();
    expect(next!.getDay()).not.toBe(1);
  });

  it('merges masters for "any master" and assigns someone who is free', () => {
    const masters = eligibleMasters(salon, [cut.id]);
    const { days, assign } = anyMasterWeek({ salon, masters, durationMin: 45, bookings: [], now: monday });
    expect(days).toHaveLength(7);
    // Elvin works Mondays, so the merged Monday is open even though Rauf is off.
    expect(days[0].off).toBe(false);
    const day = days.find((d) => d.slots.length)!;
    const master = assign(day.date, day.slots[0])!;
    const own = daySchedule({ salon, master, date: day.date, durationMin: 45, bookings: [], now: monday });
    expect(own.slots).toContain(day.slots[0]);
  });
});

describe('eligibility and grouping', () => {
  it('only offers masters who do every selected service', () => {
    const leyla = salons.find((s) => s.id === 'maison-leyla')!;
    const colour = leyla.services.find((s) => s.name === 'Full colour')!;
    const bridal = leyla.services.find((s) => s.name === 'Bridal makeup')!;
    const names = eligibleMasters(leyla, [colour.id, bridal.id]).map((m) => m.name);
    expect(names).toEqual(['Leyla Əliyeva']);
  });

  it('groups slots by part of day', () => {
    const groups = groupSlots([toMinutes('09:00'), toMinutes('12:30'), toMinutes('18:00')]);
    expect(groups.map((g) => g.label)).toEqual(['Morning', 'Afternoon', 'Evening']);
  });
});
