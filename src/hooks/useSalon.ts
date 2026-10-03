import { useMemo } from 'react';

import { liveRating } from '@/data/ranking';
import { seedReviews } from '@/data/reviews';
import { salonById } from '@/data/salons';
import type { Review, Salon } from '@/data/types';
import { useStore } from '@/store/useStore';

/** Platform reviews plus the ones written on this device, newest first. */
export function useSalonReviews(salonId: string | undefined): Review[] {
  const mine = useStore((s) => s.reviews);
  return useMemo(
    () =>
      [...mine.filter((r) => r.salonId === salonId), ...seedReviews.filter((r) => r.salonId === salonId)].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    [mine, salonId],
  );
}

export function useLiveRating(salon: Salon | undefined) {
  const mine = useStore((s) => s.reviews);
  return useMemo(() => (salon ? liveRating(salon, mine) : { rating: 0, count: 0 }), [salon, mine]);
}

/** Live distribution: seed shares scaled by volume, plus local reviews. */
export function useDistribution(salon: Salon | undefined) {
  const mine = useStore((s) => s.reviews);
  return useMemo(() => {
    if (!salon) return [0, 0, 0, 0, 0];
    const counts = salon.distribution.map((p) => p * salon.reviewCount);
    mine.filter((r) => r.salonId === salon.id).forEach((r) => (counts[5 - r.rating] += 1));
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    return counts.map((n) => n / total);
  }, [salon, mine]);
}

export const useSalon = (id: string | undefined) => useMemo(() => salonById(id), [id]);
