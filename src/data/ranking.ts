import { distanceKm } from '@/lib/geo';
import { minutesOfDay, toMinutes } from '@/lib/time';

import type { CategoryId, Coords, PriceLevel, Review, Salon } from './types';

/** Prior for the Bayesian average: a venue needs volume before it can top the chart. */
const PRIOR_MEAN = 4.5;
const PRIOR_WEIGHT = 60;

export type LiveRating = { rating: number; count: number };

/** Platform aggregate plus any reviews written on this device. */
export function liveRating(salon: Salon, localReviews: Review[]): LiveRating {
  const mine = localReviews.filter((r) => r.salonId === salon.id);
  const count = salon.reviewCount + mine.length;
  const sum = salon.rating * salon.reviewCount + mine.reduce((acc, r) => acc + r.rating, 0);
  return { rating: count ? sum / count : 0, count };
}

export function bayesian({ rating, count }: LiveRating): number {
  return (PRIOR_MEAN * PRIOR_WEIGHT + rating * count) / (PRIOR_WEIGHT + count);
}

export type RankedSalon = {
  salon: Salon;
  live: LiveRating;
  score: number;
  distance: number;
};

export function topRated(salons: Salon[], localReviews: Review[], category?: CategoryId | null): RankedSalon[] {
  return salons
    .filter((s) => !category || s.categories.includes(category))
    .map((salon) => {
      const live = liveRating(salon, localReviews);
      return { salon, live, score: bayesian(live), distance: 0 };
    })
    .sort((a, b) => b.score - a.score);
}

export type MapSort = 'best' | 'nearest' | 'rating';

/**
 * "Best match" — the nearest highly-rated place in the chosen price range.
 * Rating dominates, but distance decays the score so a 4.9 across town does
 * not beat a 4.8 around the corner.
 */
export function matchScore(rating: number, distance: number): number {
  const quality = Math.min(1, Math.max(0, (rating - 4) / 1));
  const proximity = 1 / (1 + distance / 1.5);
  return quality * 0.62 + proximity * 0.38;
}

export function rankForMap(args: {
  salons: Salon[];
  localReviews: Review[];
  origin: Coords;
  priceLevels: PriceLevel[];
  category: CategoryId | null;
  sort: MapSort;
}): RankedSalon[] {
  const { salons, localReviews, origin, priceLevels, category, sort } = args;
  const ranked = salons
    .filter(
      (s) =>
        (priceLevels.length === 0 || priceLevels.includes(s.priceLevel)) &&
        (!category || s.categories.includes(category)),
    )
    .map((salon) => {
      const live = liveRating(salon, localReviews);
      const distance = distanceKm(origin, salon.coords);
      return { salon, live, distance, score: matchScore(bayesian(live), distance) };
    });
  const by: Record<MapSort, (a: RankedSalon, b: RankedSalon) => number> = {
    best: (a, b) => b.score - a.score,
    nearest: (a, b) => a.distance - b.distance,
    rating: (a, b) => bayesian(b.live) - bayesian(a.live),
  };
  return ranked.sort(by[sort]);
}

export type OpenState = {
  open: boolean;
  /** A key in the strings dictionary; `time` fills its placeholder. */
  kind: 'openUntil' | 'closesSoon' | 'opensAt' | 'closedNow' | 'closedToday';
  time?: string;
};

export function openState(salon: Salon, now = new Date()): OpenState {
  const dow = now.getDay();
  if (salon.closedDays.includes(dow)) return { open: false, kind: 'closedToday' };
  const t = minutesOfDay(now);
  const open = toMinutes(salon.hours.open);
  const close = toMinutes(salon.hours.close);
  if (t < open) return { open: false, kind: 'opensAt', time: salon.hours.open };
  if (t >= close) return { open: false, kind: 'closedNow' };
  if (close - t <= 60) return { open: true, kind: 'closesSoon', time: salon.hours.close };
  return { open: true, kind: 'openUntil', time: salon.hours.close };
}
