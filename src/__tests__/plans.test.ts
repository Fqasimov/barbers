import { GRACE_DAYS, plans, settle, TRIAL_DAYS, YEAR_MONTHS_PAID } from '@/auth/plans';
import type { Subscription } from '@/auth/types';

const DAY = 86_400_000;
const start = Date.parse('2026-10-01T10:00:00.000Z');
const trial = (over: Partial<Subscription> = {}): Subscription => ({
  plan: 'start',
  status: 'trialing',
  startedAt: new Date(start).toISOString(),
  trialEndsAt: new Date(start + TRIAL_DAYS * DAY).toISOString(),
  ...over,
});

describe('plans', () => {
  it('offers Start and Pro, Pro recommended, a year for ten months', () => {
    expect(plans.map((p) => [p.id, p.price, p.priceYear])).toEqual([
      ['start', 29, 290],
      ['pro', 59, 590],
    ]);
    expect(plans.find((p) => p.recommended)?.id).toBe('pro');
    expect(YEAR_MONTHS_PAID).toBe(10);
  });

  it('labels the unbuilt features as coming soon', () => {
    const soon = plans.flatMap((p) => p.features.filter((f) => f.soon).map((f) => f.en));
    expect(soon).toEqual(['WhatsApp confirmations', 'No-show protection and deposits', 'Waitlist', 'Statistics']);
  });
});

describe('settle', () => {
  const end = start + TRIAL_DAYS * DAY;

  it('keeps a running trial and reports when the grace would end', () => {
    const s = settle(trial(), end - DAY);
    expect(s.status).toBe('trialing');
    expect(s.graceEndsAt).toBe(new Date(end + GRACE_DAYS * DAY).toISOString());
  });

  it('gives an unpaid trial 7 days of grace, then expires it', () => {
    expect(settle(trial(), end).status).toBe('past_due');
    expect(settle(trial(), end + GRACE_DAYS * DAY - 1).status).toBe('past_due');
    expect(settle(trial(), end + GRACE_DAYS * DAY).status).toBe('expired');
  });

  it('measures a paid plan from the paid period, not the trial', () => {
    const paidEnd = end + 30 * DAY;
    const paid = trial({ status: 'active', currentPeriodEnd: new Date(paidEnd).toISOString() });
    expect(settle(paid, end + DAY).status).toBe('active');
    expect(settle(paid, paidEnd + DAY).status).toBe('past_due');
    expect(settle(paid, paidEnd + 8 * DAY).status).toBe('expired');
  });

  it('never revives an expired plan', () => {
    expect(settle(trial({ status: 'expired' }), start).status).toBe('expired');
  });
});
