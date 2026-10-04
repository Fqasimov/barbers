import type { Loc } from '@/i18n/types';
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
  'Dmitri K.',
  'Olga P.',
  'James W.',
  'Sophie L.',
];

export type TagId = 'skilled' | 'punctual' | 'friendly' | 'clean' | 'value' | 'relaxing';

export const reviewTags: { id: TagId; label: Loc }[] = [
  { id: 'skilled', label: { az: 'Peşəkar', ru: 'Профессионально', en: 'Skilled' } },
  { id: 'punctual', label: { az: 'Vaxtında', ru: 'Без опозданий', en: 'Punctual' } },
  { id: 'friendly', label: { az: 'Mehriban', ru: 'Приветливо', en: 'Friendly' } },
  { id: 'clean', label: { az: 'Təmiz', ru: 'Чисто', en: 'Clean' } },
  { id: 'value', label: { az: 'Qiymətinə dəyər', ru: 'Стоит своих денег', en: 'Great value' } },
  { id: 'relaxing', label: { az: 'Rahat', ru: 'Расслабляюще', en: 'Relaxing' } },
];

type Snippet = { rating: number; text: string; tags: TagId[] };

/** Written the way people in Baku actually write reviews: in Azerbaijani, Russian or English. */
const byCategory: Record<CategoryId, Snippet[]> = {
  barber: [
    {
      rating: 5,
      text: 'Bakıda gördüyüm ən yaxşı fade. Boyun xəttinə vaxt ayırdı, ülgüclə işi qüsursuz idi.',
      tags: ['skilled', 'punctual'],
    },
    {
      rating: 5,
      text: 'Лучший барбер в центре. Выслушал, предложил форму под мои волосы, а не просто постриг.',
      tags: ['skilled', 'friendly'],
    },
    { rating: 4, text: 'Kəsim əla idi, amma 10 dəqiqə gözlədim. Kofe bunu kompensasiya etdi.', tags: ['value'] },
    {
      rating: 5,
      text: 'Walked in with a mess, walked out looking like I had somewhere important to be. The hot towel was a nice touch.',
      tags: ['skilled', 'friendly'],
    },
    {
      rating: 5,
      text: 'Təmiz bərbərxana, iti alətlər, ondan da iti saqqal xətti. Növbəti ziyarəti elə çıxmamış yazdırdım.',
      tags: ['clean', 'skilled'],
    },
    {
      rating: 4,
      text: 'Хорошая стрижка за нормальные деньги. В субботу людно — лучше записываться заранее.',
      tags: ['value'],
    },
    {
      rating: 5,
      text: 'Təraş əsl ritualdır. Üç isti dəsmal və bir dənə də kəsik yox. Hər manatına dəyər.',
      tags: ['relaxing', 'skilled'],
    },
    {
      rating: 3,
      text: 'Стрижка нормальная, но в конце чувствовалась спешка. В следующий раз попробую другого мастера.',
      tags: [],
    },
  ],
  hair: [
    {
      rating: 5,
      text: 'Balayajım səkkiz həftədən sonra da gözəl görünür — heç bir kəskin keçid yoxdur. Əsl rəssamdır.',
      tags: ['skilled'],
    },
    {
      rating: 5,
      text: 'Посмотрела со мной старые фото и попала в форму с первого раза. Укладка держалась три дня.',
      tags: ['skilled', 'friendly'],
    },
    {
      rating: 4,
      text: 'Rəng çox gözəl alındı. Deyiləndən uzun çəkdi, ona görə sonrasına iş planlamayın.',
      tags: ['skilled'],
    },
    {
      rating: 5,
      text: 'Calm, beautiful space and a stylist who actually asks about your routine. I won’t go anywhere else.',
      tags: ['relaxing', 'clean'],
    },
    { rating: 5, text: 'После кератина утро стало проще. Никакого пушения даже в бакинский ветер.', tags: ['value'] },
    { rating: 4, text: 'Nəticə gözəldir, qiyməti bir az bahadır, amma keyfiyyətə görədir.', tags: ['skilled'] },
  ],
  nails: [
    { rating: 5, text: 'Üç həftədir gel-lak bir dəfə də qopmayıb. Xətlər çox dəqiqdir.', tags: ['skilled', 'clean'] },
    {
      rating: 5,
      text: 'Все инструменты стерилизуются и вскрываются при тебе. Идеально чисто, а дизайн — ювелирная работа.',
      tags: ['clean'],
    },
    { rating: 4, text: 'Manikür gözəl idi, əvvəldə bir az gözlədim. Pedikür masajı isə möhtəşəm.', tags: ['relaxing'] },
    {
      rating: 5,
      text: 'Fast, friendly and fairly priced. Exactly what a weekday lunch break needs.',
      tags: ['punctual', 'value'],
    },
    {
      rating: 4,
      text: 'Хорошая форма и покрытие. Палитра огромная — даже слишком, долго выбирала.',
      tags: ['friendly'],
    },
  ],
  brows: [
    {
      rating: 5,
      text: 'Qaşlarımı üzümə görə eskizlədi — nəhayət ki, cüt kimi görünürlər. Həyatımı dəyişdi, səmimi deyirəm.',
      tags: ['skilled'],
    },
    {
      rating: 5,
      text: 'Ламинирование ресниц выглядит совершенно естественно. Все спрашивают, накрашены ли они.',
      tags: ['skilled', 'friendly'],
    },
    { rating: 4, text: 'Laminasiya gözəl alınıb, bir az göynətdi. Yenə də gələcəyəm.', tags: ['value'] },
    {
      rating: 5,
      text: 'Quick, precise and no redness afterwards. The best brow appointment in town.',
      tags: ['punctual', 'clean'],
    },
  ],
  spa: [
    { rating: 5, text: 'Kisə ən yaxşı mənada sərtdir. Çıxanda özümü yeni insan kimi hiss etdim.', tags: ['relaxing'] },
    {
      rating: 5,
      text: 'Глубокий массаж, который правда глубокий. Сам нашёл, где зажимы, без подсказок.',
      tags: ['skilled', 'relaxing'],
    },
    { rating: 4, text: 'Mərmər otaqlar çox gözəldir. Cümə axşamı adam çox olur, həftə əvvəli gəlin.', tags: ['clean'] },
    {
      rating: 5,
      text: 'The facial was calm and thorough, and my skin glowed for days.',
      tags: ['relaxing', 'skilled'],
    },
  ],
  makeup: [
    { rating: 5, text: 'Toy makiyajımı etdi — göz yaşı və rəqslə on dörd saat davam etdi.', tags: ['skilled'] },
    {
      rating: 5,
      text: 'Мягко, сияюще и при этом это всё ещё я. Ровно тот вечерний образ, который я просила.',
      tags: ['skilled', 'friendly'],
    },
    { rating: 4, text: 'Gözəl iş və keyfiyyətli məhsullar. Bir az gecikdi, amma dəydi.', tags: ['skilled'] },
  ],
};

/** A few visible reviews per venue, each from a verified visit. Dates are relative to now. */
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
