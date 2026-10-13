import { useEffect, useMemo } from 'react';

import { isLive } from '@/api/client';
import { platformReviews, useCatalogue, useSalonById } from '@/data/catalogue';
import { liveRating } from '@/data/ranking';
import type { Review, Salon } from '@/data/types';
import { useStore } from '@/store/useStore';

/**
 * Reviews written on this device count towards ratings only in demo mode. Live,
 * the server's aggregate already includes them.
 */
const useLocalReviews = () => {
  const mine = useStore((s) => s.reviews);
  return isLive ? NONE : mine;
};
const NONE: Review[] = [];

/** Platform reviews plus the ones written on this device, newest first. */
export function useSalonReviews(salonId: string | undefined): Review[] {
  const mine = useStore((s) => s.reviews);
  const server = useCatalogue((s) => (salonId ? s.reviews[salonId] : undefined));
  const loadReviews = useCatalogue((s) => s.loadReviews);
  const hidden = useStore((s) => s.hiddenReviews);
  useEffect(() => {
    if (isLive && salonId) void loadReviews(salonId);
  }, [salonId, loadReviews]);
  return useMemo(() => {
    const platform = server ?? platformReviews(salonId);
    const ids = new Set(platform.map((r) => r.id));
    const own = mine.filter((r) => r.salonId === salonId && !ids.has(r.id));
    return [...own, ...platform].filter((r) => !hidden.includes(r.id)).sort((a, b) => b.date.localeCompare(a.date));
  }, [mine, server, salonId, hidden]);
}

export function useLiveRating(salon: Salon | undefined) {
  const mine = useLocalReviews();
  return useMemo(() => (salon ? liveRating(salon, mine) : { rating: 0, count: 0 }), [salon, mine]);
}

/** Live distribution: platform shares scaled by volume, plus (demo) local reviews. */
export function useDistribution(salon: Salon | undefined) {
  const mine = useLocalReviews();
  return useMemo(() => {
    if (!salon) return [0, 0, 0, 0, 0];
    const counts = salon.distribution.map((p) => p * salon.reviewCount);
    mine.filter((r) => r.salonId === salon.id).forEach((r) => (counts[5 - r.rating] += 1));
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    return counts.map((n) => n / total);
  }, [salon, mine]);
}

export const useSalon = (id: string | undefined) => useSalonById(id);

/** For ranking helpers that take "this device's reviews". */
export { useLocalReviews };
