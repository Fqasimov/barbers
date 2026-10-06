import { useMemo } from 'react';

import { useSession } from '@/auth/useSession';
import { servesGender } from '@/data/audience';
import { salons } from '@/data/salons';
import { useStore } from '@/store/useStore';

/**
 * The venues to show in lists, maps and search. When a signed-in user has a
 * gender on file and "only places that serve me" is on (the default), venues
 * that don't serve them are left out. Direct links still open any venue.
 */
export function useVisibleSalons() {
  const gender = useSession((s) => s.session?.user.gender ?? null);
  const forMe = useStore((s) => s.forMe);
  return useMemo(() => (gender && forMe ? salons.filter((s) => servesGender(s, gender)) : salons), [gender, forMe]);
}
