import { hasFeature } from '@/auth/plans';
import type { Business } from '@/auth/types';
import { SITE_URL } from '@/lib/links';

/**
 * The salon's booking link for an Instagram bio or a message to clients (Fərdi, Start, Pro;
 * not Sadə). The server sends it when signed in to the live server; in demo mode it is built
 * the same way: <site>/u/<personal page address, or the main salon's id>.
 */
export function bookingLink(business: Business): string | null {
  if (business.shareUrl !== undefined) return business.shareUrl;
  if (!hasFeature(business, 'personal_page')) return null;
  const main = business.parentId ?? business.locations?.find((l) => l.isMain)?.id ?? business.id;
  return `${SITE_URL}/u/${business.slug || main}`;
}
