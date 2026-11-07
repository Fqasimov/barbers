import { addDays, atMinutes, dayKey, fromDayKey, minutesOfDay, monthStart, startOfDay, weekday } from '@/lib/time';

// Run under any TZ (CI runs this file with TZ=America/New_York too): Baku's clock wins.
describe('Baku wall clock', () => {
  // 21:30 UTC on Monday 12 Oct is 01:30 on Tuesday 13 Oct in Baku.
  const late = new Date('2026-10-12T21:30:00.000Z');

  it('reads the Baku day, weekday and minutes', () => {
    expect(dayKey(late)).toBe('2026-10-13');
    expect(weekday(late)).toBe(2);
    expect(minutesOfDay(late)).toBe(90);
  });

  it('builds Baku midnights and slot instants', () => {
    expect(startOfDay(late).toISOString()).toBe('2026-10-12T20:00:00.000Z');
    expect(fromDayKey('2026-10-13')!.toISOString()).toBe('2026-10-12T20:00:00.000Z');
    // 12:00 in Baku is 08:00 UTC.
    expect(atMinutes(fromDayKey('2026-10-13')!, 12 * 60).toISOString()).toBe('2026-10-13T08:00:00.000Z');
    expect(dayKey(addDays(fromDayKey('2026-10-31')!, 1))).toBe('2026-11-01');
    expect(dayKey(monthStart(late, -1))).toBe('2026-09-01');
  });
});
