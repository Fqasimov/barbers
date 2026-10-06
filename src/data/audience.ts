import type { Audience, Gender } from '@/auth/types';

import type { Salon } from './types';

/**
 * Who a venue serves. Women-only venues say so; a venue whose services are all
 * barbering (and grooming spa) is a men's barbershop; everything else serves
 * everyone. Registered businesses set this explicitly.
 */
export function audienceOf(salon: Salon): Audience {
  if (salon.womenOnly) return 'women';
  const menOnly = salon.categories.includes('barber') && salon.categories.every((c) => c === 'barber' || c === 'spa');
  return menOnly ? 'men' : 'all';
}

/** True when the venue serves someone of this gender. */
export const servesGender = (salon: Salon, gender: Gender) => {
  const a = audienceOf(salon);
  return a === 'all' || (a === 'women' ? gender === 'female' : gender === 'male');
};
