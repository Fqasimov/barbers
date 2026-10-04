import { bayesian, liveRating, matchScore, openState, rankForMap, topRated } from '@/data/ranking';
import { distributionFor, salons } from '@/data/salons';
import type { Review } from '@/data/types';
import { BAKU_CENTER, distanceKm, fmtDistance } from '@/lib/geo';

describe('ratings', () => {
  it('folds local reviews into the live rating', () => {
    const salon = salons[0];
    const mine: Review = {
      id: 'x',
      salonId: salon.id,
      author: 'You',
      rating: 1,
      text: '',
      date: new Date().toISOString(),
    };
    const live = liveRating(salon, [mine]);
    expect(live.count).toBe(salon.reviewCount + 1);
    expect(live.rating).toBeLessThan(salon.rating);
  });

  it('needs volume to beat the prior', () => {
    expect(bayesian({ rating: 5, count: 3 })).toBeLessThan(bayesian({ rating: 4.9, count: 400 }));
  });

  it('ranks the chart by Bayesian score and filters by category', () => {
    const ranked = topRated(salons, [], 'nails');
    expect(ranked.every((r) => r.salon.categories.includes('nails'))).toBe(true);
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
  });

  it('builds a rating distribution that averages to the rating', () => {
    for (const r of [4.5, 4.7, 4.9]) {
      const d = distributionFor(r);
      const mean = d.reduce((acc, p, i) => acc + p * (5 - i), 0);
      expect(d.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 6);
      expect(mean).toBeCloseTo(r, 2);
    }
  });
});

describe('map ranking', () => {
  it('prefers a slightly lower rating that is much closer', () => {
    expect(matchScore(4.8, 0.3)).toBeGreaterThan(matchScore(4.9, 6));
  });

  it('respects the price filter', () => {
    const ranked = rankForMap({
      salons,
      localReviews: [],
      origin: BAKU_CENTER,
      priceLevels: [1],
      category: null,
      sort: 'best',
    });
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every((r) => r.salon.priceLevel === 1)).toBe(true);
  });

  it('sorts by distance when asked', () => {
    const ranked = rankForMap({
      salons,
      localReviews: [],
      origin: BAKU_CENTER,
      priceLevels: [],
      category: 'barber',
      sort: 'nearest',
    });
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].distance).toBeLessThanOrEqual(ranked[i].distance);
  });
});

describe('geo & hours', () => {
  it('measures Baku distances sensibly', () => {
    const oldCity = salons.find((s) => s.id === 'old-town-barbers')!;
    const crown = salons.find((s) => s.id === 'crown-clipper')!;
    const km = distanceKm(oldCity.coords, crown.coords);
    expect(km).toBeGreaterThan(8);
    expect(km).toBeLessThan(12);
    expect(fmtDistance(0.42)).toBe('400 m');
    expect(fmtDistance(2.345)).toBe('2.3 km');
  });

  it('reports open and closed states', () => {
    const salon = salons.find((s) => s.id === 'maison-leyla')!; // 10–20, closed Mondays
    expect(openState(salon, new Date(2026, 9, 5, 12)).kind).toBe('closedToday');
    expect(openState(salon, new Date(2026, 9, 6, 9))).toEqual({ open: false, kind: 'opensAt', time: '10:00' });
    expect(openState(salon, new Date(2026, 9, 6, 12)).open).toBe(true);
    expect(openState(salon, new Date(2026, 9, 6, 19, 30))).toEqual({ open: true, kind: 'closesSoon', time: '20:00' });
  });
});
