import { seeded } from '@/lib/random';

import { salons } from './salons';
import type { CategoryId, Review } from './types';

const authors = [
  'Murad A.',
  'Sevinc H.',
  'Kənan R.',
  'Aytən M.',
  'Rəşad İ.',
  'Gülnar Ə.',
  'Teymur Q.',
  'Nərgiz B.',
  'Ziya K.',
  'Aynur S.',
  'Elnur C.',
  'Xədicə N.',
  'Farid M.',
  'Lalə V.',
  'Orxan T.',
  'Ülkər Z.',
  'Ceyhun D.',
  'Səadət F.',
  'Vüsal H.',
  'Fəridə Y.',
];

type Snippet = { rating: number; text: string; tags: string[] };

const byCategory: Record<CategoryId, Snippet[]> = {
  barber: [
    {
      rating: 5,
      text: 'Best fade I have had in Baku. He took his time with the neckline and the razor work was spotless.',
      tags: ['Skilled', 'Punctual'],
    },
    {
      rating: 5,
      text: 'Walked in with a mess, walked out looking like I had somewhere important to be. Hot towel was a nice touch.',
      tags: ['Skilled', 'Friendly'],
    },
    {
      rating: 4,
      text: 'Great cut, though I waited about ten minutes past my slot. Coffee made up for it.',
      tags: ['Great value'],
    },
    {
      rating: 5,
      text: 'Finally a barber who listens. Explained what would suit my hair instead of just cutting.',
      tags: ['Friendly', 'Skilled'],
    },
    {
      rating: 5,
      text: 'Clean shop, sharp tools, sharper beard line. Booked my next visit before leaving.',
      tags: ['Clean', 'Skilled'],
    },
    {
      rating: 4,
      text: 'Solid cut at a fair price. The shop gets busy on Saturdays so book ahead.',
      tags: ['Great value'],
    },
    {
      rating: 5,
      text: 'The shave is a ritual. Three hot towels and not a single nick. Worth every manat.',
      tags: ['Relaxing', 'Skilled'],
    },
    {
      rating: 3,
      text: 'Haircut was fine but felt a bit rushed at the end. Would try a different barber here next time.',
      tags: [],
    },
  ],
  hair: [
    {
      rating: 5,
      text: 'My balayage grew out beautifully — no harsh lines even after eight weeks. Truly an artist.',
      tags: ['Skilled'],
    },
    {
      rating: 5,
      text: 'She looked at old photos with me and nailed the cut first time. The blow-dry lasted three days.',
      tags: ['Skilled', 'Friendly'],
    },
    {
      rating: 4,
      text: 'Gorgeous colour. Took longer than quoted, so do not book anything right after.',
      tags: ['Skilled'],
    },
    {
      rating: 5,
      text: 'Calm, beautiful space and a stylist who actually asks about your routine. I will not go anywhere else.',
      tags: ['Relaxing', 'Clean'],
    },
    {
      rating: 5,
      text: 'The keratin treatment changed my mornings. Frizz gone even in Baku wind.',
      tags: ['Great value'],
    },
    { rating: 4, text: 'Lovely result, a little pricey, but you get what you pay for.', tags: ['Skilled'] },
  ],
  nails: [
    {
      rating: 5,
      text: 'Three weeks in and my gel has not chipped once. The lines are so precise.',
      tags: ['Skilled', 'Clean'],
    },
    {
      rating: 5,
      text: 'Everything sterilised and sealed in front of you. Spotless, and the nail art is tiny perfection.',
      tags: ['Clean'],
    },
    {
      rating: 4,
      text: 'Lovely manicure, slightly long wait at the start. Pedicure massage was heaven.',
      tags: ['Relaxing'],
    },
    {
      rating: 5,
      text: 'Fast, friendly and fairly priced. Exactly what a weekday lunch break needs.',
      tags: ['Punctual', 'Great value'],
    },
    {
      rating: 4,
      text: 'Good shape and finish. Colour choice is huge, maybe too huge — I could not decide.',
      tags: ['Friendly'],
    },
  ],
  brows: [
    {
      rating: 5,
      text: 'She mapped my brows to my face and they finally look like a pair. Life-changing, honestly.',
      tags: ['Skilled'],
    },
    {
      rating: 5,
      text: 'Lash lift looks completely natural. People keep asking if I am wearing mascara.',
      tags: ['Skilled', 'Friendly'],
    },
    {
      rating: 4,
      text: 'Lamination looks great, though it stung a little. Would still go back.',
      tags: ['Great value'],
    },
    {
      rating: 5,
      text: 'Quick, precise and no redness afterwards. The best brow appointment in town.',
      tags: ['Punctual', 'Clean'],
    },
  ],
  spa: [
    {
      rating: 5,
      text: 'The kese scrub is intense in the best way. I left feeling like a new person.',
      tags: ['Relaxing'],
    },
    {
      rating: 5,
      text: 'Deep tissue that actually goes deep. Knew exactly where the tension was without asking.',
      tags: ['Skilled', 'Relaxing'],
    },
    {
      rating: 4,
      text: 'Beautiful marble rooms. A bit busy on Friday evening, go earlier in the week.',
      tags: ['Clean'],
    },
    {
      rating: 5,
      text: 'The facial was calm and thorough, and my skin glowed for days.',
      tags: ['Relaxing', 'Skilled'],
    },
  ],
  makeup: [
    {
      rating: 5,
      text: 'Did my wedding makeup — it lasted fourteen hours, through tears and dancing.',
      tags: ['Skilled'],
    },
    {
      rating: 5,
      text: 'Soft, glowing and still me. Exactly the evening look I asked for.',
      tags: ['Skilled', 'Friendly'],
    },
    { rating: 4, text: 'Lovely work and great products. Running a little late but worth it.', tags: ['Skilled'] },
  ],
};

/** A few visible reviews per venue. Dates are relative to now, so the app never feels stale. */
function buildSeedReviews(): Review[] {
  const now = Date.now();
  const out: Review[] = [];
  for (const salon of salons) {
    const rand = seeded(`reviews:${salon.id}`);
    const pool = salon.categories.flatMap((c) => byCategory[c]);
    const count = 5 + Math.floor(rand() * 3);
    const used = new Set<number>();
    let daysAgo = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < count && used.size < pool.length; i++) {
      let idx = Math.floor(rand() * pool.length);
      while (used.has(idx)) idx = (idx + 1) % pool.length;
      used.add(idx);
      const snip = pool[idx];
      // Strong venues skew towards their best reviews.
      const rating = salon.rating >= 4.8 && snip.rating < 4 && rand() > 0.3 ? 4 : snip.rating;
      const master = salon.masters[Math.floor(rand() * salon.masters.length)];
      const service = salon.services.filter((s) => master.serviceIds.includes(s.id))[Math.floor(rand() * 3)];
      out.push({
        id: `${salon.id}.r${i}`,
        salonId: salon.id,
        masterId: master.id,
        author: authors[Math.floor(rand() * authors.length)],
        rating,
        text: snip.text,
        date: new Date(now - daysAgo * 86_400_000).toISOString(),
        serviceName: service?.name,
        tags: snip.tags,
      });
      daysAgo += 2 + Math.floor(rand() * 9);
    }
  }
  return out;
}

export const seedReviews: Review[] = buildSeedReviews();

export const reviewTags = ['Skilled', 'Punctual', 'Friendly', 'Clean', 'Great value', 'Relaxing'];
