import { TRIAL_DAYS } from '@/auth/plans';
import type { Business, Subscription } from '@/auth/types';
import { bookingLink } from '@/lib/bookingLink';

const sub = (plan: Subscription['plan']): Subscription => ({
  plan,
  status: 'trialing',
  startedAt: '2026-11-01T10:00:00.000Z',
  trialEndsAt: new Date(Date.parse('2026-11-01T10:00:00.000Z') + TRIAL_DAYS * 86_400_000).toISOString(),
});
const biz = (plan: Subscription['plan'], over: Partial<Business> = {}) =>
  ({ id: 'salon1', subscription: sub(plan), ...over }) as Business;

describe('booking link', () => {
  it('exists on every plan that takes bookings, not on Sadə', () => {
    expect(bookingLink(biz('sade'))).toBeNull();
    for (const plan of ['ferdi', 'start', 'pro'] as const) {
      expect(bookingLink(biz(plan))).toBe('https://yazilnow.az/u/salon1');
    }
  });

  it('uses the picked address, and the main salon for a branch', () => {
    expect(bookingLink(biz('start', { slug: 'orxanosmanov' }))).toBe('https://yazilnow.az/u/orxanosmanov');
    expect(bookingLink(biz('pro', { id: 'branch2', parentId: 'salon1' }))).toBe('https://yazilnow.az/u/salon1');
  });

  it('takes the server’s link when it sends one', () => {
    expect(bookingLink(biz('start', { shareUrl: 'https://yazilnow.az/u/x' }))).toBe('https://yazilnow.az/u/x');
    expect(bookingLink(biz('start', { shareUrl: null }))).toBeNull();
  });
});
