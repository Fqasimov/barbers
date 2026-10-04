import type { Loc } from '@/i18n/types';
import type { ToneName } from '@/theme/tokens';

import type { CategoryId, Language, Master, PriceLevel, Salon, Service } from './types';

/**
 * Seed catalogue — fictional venues placed across Baku.
 * Prices are in Azerbaijani manat (AZN); base values are mid-range (₼₼).
 */

type ServiceTemplate = {
  key: string;
  name: Loc;
  description: Loc;
  category: CategoryId;
  durationMin: number;
  base: number;
};

const L = (az: string, ru: string, en: string): Loc => ({ az, ru, en });

const catalogue: Record<CategoryId, ServiceTemplate[]> = {
  barber: [
    {
      key: 'cut',
      category: 'barber',
      durationMin: 45,
      base: 30,
      name: L('Klassik kəsim', 'Фирменная стрижка', 'Signature cut'),
      description: L(
        'Məsləhət, yuma, qayçı və maşınla kəsim, ukladka.',
        'Консультация, мытьё, стрижка ножницами и машинкой, укладка.',
        'Consultation, wash, scissor and clipper cut, styled finish.',
      ),
    },
    {
      key: 'fade',
      category: 'barber',
      durationMin: 45,
      base: 35,
      name: L('Skin fade', 'Скин фейд', 'Skin fade'),
      description: L(
        'Dəriyə qədər hamar keçid, ülgüclə detallar.',
        'Плавный переход до кожи, детали опасной бритвой.',
        'Seamless fade down to the skin, detailed with a straight razor.',
      ),
    },
    {
      key: 'beard',
      category: 'barber',
      durationMin: 30,
      base: 20,
      name: L('Saqqal düzəlişi', 'Оформление бороды', 'Beard sculpt'),
      description: L(
        'Forma, kontur, isti dəsmal və yağ.',
        'Форма, контур, горячее полотенце и масло.',
        'Shape, line-up and hot towel, finished with oil.',
      ),
    },
    {
      key: 'shave',
      category: 'barber',
      durationMin: 45,
      base: 30,
      name: L('İsti dəsmalla təraş', 'Бритьё с горячим полотенцем', 'Hot towel shave'),
      description: L(
        'Üç isti dəsmal ilə klassik ülgüc təraşı.',
        'Классическое бритьё опасной бритвой с тремя горячими полотенцами.',
        'Traditional straight-razor shave with three hot towels.',
      ),
    },
    {
      key: 'combo',
      category: 'barber',
      durationMin: 75,
      base: 45,
      name: L('Kəsim + saqqal', 'Стрижка + борода', 'Cut & beard'),
      description: L(
        'Tam xidmət — kəsim və saqqal düzəlişi.',
        'Полный сервис — стрижка и оформление бороды.',
        'The full service — signature cut and beard sculpt.',
      ),
    },
    {
      key: 'kids',
      category: 'barber',
      durationMin: 30,
      base: 20,
      name: L('Uşaq kəsimi', 'Детская стрижка', 'Kids cut'),
      description: L('12 yaşa qədər. Səbir daxildir.', 'До 12 лет. С терпением.', 'For under 12s. Patience included.'),
    },
  ],
  hair: [
    {
      key: 'wcut',
      category: 'hair',
      durationMin: 60,
      base: 50,
      name: L('Kəsim və ukladka', 'Стрижка и укладка', 'Cut & style'),
      description: L(
        'Yuma, dəqiq kəsim və fen ukladkası.',
        'Мытьё, точная стрижка и укладка феном.',
        'Wash, precision cut and blow-dry finish.',
      ),
    },
    {
      key: 'blow',
      category: 'hair',
      durationMin: 45,
      base: 35,
      name: L('Fen ukladkası', 'Укладка феном', 'Blow-dry'),
      description: L(
        'Hamar, həcmli və ya dalğalı — seçim sizindir.',
        'Гладко, объём или волны — на ваш выбор.',
        'Smooth, volume or waves — your call.',
      ),
    },
    {
      key: 'colour',
      category: 'hair',
      durationMin: 120,
      base: 120,
      name: L('Tam boyama', 'Окрашивание', 'Full colour'),
      description: L(
        'Bir tonda boyama, parlaqlıq və ukladka.',
        'Окрашивание в один тон, глосс и укладка.',
        'Single-process colour, gloss and style.',
      ),
    },
    {
      key: 'balayage',
      category: 'hair',
      durationMin: 180,
      base: 220,
      name: L('Balayaj', 'Балаяж', 'Balayage'),
      description: L(
        'Əl ilə açıltma, tonlama və ukladka.',
        'Ручное осветление, тонирование и укладка.',
        'Hand-painted lightening, toned and styled.',
      ),
    },
    {
      key: 'keratin',
      category: 'hair',
      durationMin: 150,
      base: 180,
      name: L('Keratin baxımı', 'Кератиновое выпрямление', 'Keratin treatment'),
      description: L(
        'Üç aya qədər hamar, qabarmayan saç.',
        'Гладкие волосы без пушения до трёх месяцев.',
        'Frizz-free smoothing that lasts up to three months.',
      ),
    },
  ],
  nails: [
    {
      key: 'mani',
      category: 'nails',
      durationMin: 45,
      base: 25,
      name: L('Klassik manikür', 'Классический маникюр', 'Classic manicure'),
      description: L(
        'Forma, kutikula baxımı və lak.',
        'Форма, уход за кутикулой и покрытие.',
        'Shape, cuticle care and polish.',
      ),
    },
    {
      key: 'gel',
      category: 'nails',
      durationMin: 60,
      base: 40,
      name: L('Gel-lak manikür', 'Маникюр с гель-лаком', 'Gel manicure'),
      description: L(
        'Üç həftəyə qədər davamlı gel-lak.',
        'Стойкое покрытие гель-лаком до трёх недель.',
        'Long-wear gel colour, up to three weeks.',
      ),
    },
    {
      key: 'pedi',
      category: 'nails',
      durationMin: 60,
      base: 45,
      name: L('Spa pedikür', 'Спа-педикюр', 'Spa pedicure'),
      description: L(
        'Vanna, skrab, masaj və lak.',
        'Ванночка, скраб, массаж и покрытие.',
        'Soak, scrub, massage and polish.',
      ),
    },
    {
      key: 'art',
      category: 'nails',
      durationMin: 30,
      base: 20,
      name: L('Dırnaq dizaynı', 'Дизайн ногтей', 'Nail art'),
      description: L(
        'Əl ilə rəsm, bütün dırnaqlar üçün qiymət.',
        'Ручная роспись, цена за комплект.',
        'Hand-painted detail, priced per set.',
      ),
    },
  ],
  brows: [
    {
      key: 'brow',
      category: 'brows',
      durationMin: 30,
      base: 20,
      name: L('Qaş korreksiyası', 'Коррекция бровей', 'Brow shaping'),
      description: L('Eskiz, mum və cımbız.', 'Разметка, воск и пинцет.', 'Mapping, wax and tweeze.'),
    },
    {
      key: 'lami',
      category: 'brows',
      durationMin: 45,
      base: 45,
      name: L('Qaş laminasiyası', 'Ламинирование бровей', 'Brow lamination'),
      description: L(
        'Altı həftəlik daha dolğun qaşlar.',
        'Более густые брови на шесть недель.',
        'Brushed-up, fuller brows for six weeks.',
      ),
    },
    {
      key: 'lash',
      category: 'brows',
      durationMin: 60,
      base: 60,
      name: L('Kirpik liftinqi', 'Ламинирование ресниц', 'Lash lift & tint'),
      description: L(
        'Təbii qıvrım və tünd rəng, uzatma olmadan.',
        'Естественный изгиб и цвет без наращивания.',
        'Natural curl and depth, no extensions.',
      ),
    },
  ],
  spa: [
    {
      key: 'hammam',
      category: 'spa',
      durationMin: 75,
      base: 90,
      name: L('Hamam ritualı', 'Хаммам-ритуал', 'Hammam ritual'),
      description: L(
        'Buxar, kisə və köpük masajı.',
        'Пар, пилинг кесе и пенный массаж.',
        'Steam, kese scrub and foam massage.',
      ),
    },
    {
      key: 'massage',
      category: 'spa',
      durationMin: 60,
      base: 100,
      name: L('Dərin masaj', 'Глубокий массаж', 'Deep tissue massage'),
      description: L(
        'Gərginlik üçün yavaş, güclü təzyiq.',
        'Медленное сильное давление против напряжения.',
        'Slow, firm pressure for real tension.',
      ),
    },
    {
      key: 'facial',
      category: 'spa',
      durationMin: 60,
      base: 85,
      name: L('Üz baxımı', 'Уход за лицом', 'Signature facial'),
      description: L(
        'Təmizləmə, pilinq, maska və masaj.',
        'Очищение, пилинг, маска и массаж.',
        'Cleanse, exfoliate, mask and massage.',
      ),
    },
  ],
  makeup: [
    {
      key: 'evening',
      category: 'makeup',
      durationMin: 60,
      base: 80,
      name: L('Axşam makiyajı', 'Вечерний макияж', 'Evening makeup'),
      description: L(
        'Tədbir üçün tam makiyaj, kirpiklər daxil.',
        'Полный макияж к событию, ресницы включены.',
        'Full face for an event, lashes included.',
      ),
    },
    {
      key: 'bridal',
      category: 'makeup',
      durationMin: 120,
      base: 220,
      name: L('Gəlin makiyajı', 'Свадебный макияж', 'Bridal makeup'),
      description: L(
        'Sınaq məsləhəti və toy günü obrazı.',
        'Пробный образ и макияж в день свадьбы.',
        'Trial consultation and wedding-day look.',
      ),
    },
  ],
};

/** Every service key with its display name — the menu for city-wide search. */
export const serviceCatalogue = (Object.values(catalogue).flat() as ServiceTemplate[]).map(
  ({ key, name, category, durationMin }) => ({
    key,
    name,
    category,
    durationMin,
  }),
);

const multiplier: Record<PriceLevel, number> = { 1: 0.65, 2: 1, 3: 1.6 };

function buildServices(salonId: string, cats: CategoryId[], level: PriceLevel): Service[] {
  return cats.flatMap((cat) =>
    catalogue[cat].map(({ key, base, ...rest }) => ({
      ...rest,
      key,
      id: `${salonId}.${key}`,
      price: Math.max(5, Math.round((base * multiplier[level]) / 5) * 5),
    })),
  );
}

type MasterSeed = {
  name: string;
  role: Loc;
  years: number;
  rating: number;
  reviewCount: number;
  covers: CategoryId[];
  workDays: number[];
  shift: [string, string];
  tone: ToneName;
  languages?: Language[];
};

type SalonSeed = Omit<Salon, 'services' | 'masters' | 'distribution'> & { team: MasterSeed[] };

const TUE_SAT = [2, 3, 4, 5, 6];
const MON_SAT = [1, 2, 3, 4, 5, 6];
const WED_SUN = [0, 3, 4, 5, 6];
const THU_MON = [0, 1, 4, 5, 6];
const ALL_WEEK = [0, 1, 2, 3, 4, 5, 6];

const R = {
  masterBarber: L('Usta bərbər', 'Мастер-барбер', 'Master barber'),
  seniorBarber: L('Baş bərbər', 'Старший барбер', 'Senior barber'),
  barber: L('Bərbər', 'Барбер', 'Barber'),
  juniorBarber: L('Gənc bərbər', 'Младший барбер', 'Junior barber'),
  stylist: L('Stilist', 'Стилист', 'Stylist'),
  colourist: L('Kolorist', 'Колорист', 'Colourist'),
  nailArtist: L('Dırnaq ustası', 'Мастер маникюра', 'Nail artist'),
  nailTech: L('Manikür ustası', 'Мастер ногтевого сервиса', 'Nail technician'),
};

const seeds: SalonSeed[] = [
  {
    id: 'old-town-barbers',
    name: 'Old Town Barbers',
    kind: L('Bərbərxana', 'Барбершоп', 'Barbershop'),
    categories: ['barber'],
    tagline: L(
      'Qala divarları içində ülgüc ustaları.',
      'Опасные бритвы в стенах старого города.',
      'Straight razors inside the old city walls.',
    ),
    about: L(
      'Bərpa olunmuş karvansara zirzəmisində altı kreslo. Tağlı kərpic, dəri kreslolar və on ildən çoxdur İçərişəhərdə çalışan bərbərlər. Günortaya qədər növbəsiz də qəbul edilir.',
      'Шесть кресел в отреставрированном подвале караван-сарая. Кирпичные своды, кожаные кресла и барберы, которые стригут в Ичеришехер больше десяти лет. До полудня — без записи.',
      'A six-chair shop in a restored caravanserai cellar. Vaulted brick, leather chairs and barbers who have been cutting in İçərişəhər for over a decade. Walk-ins welcome before noon.',
    ),
    address: 'Kiçik Qala küç. 34',
    district: 'İçərişəhər',
    coords: { latitude: 40.3661, longitude: 49.8366 },
    priceLevel: 2,
    tone: 'oxblood',
    rating: 4.9,
    reviewCount: 412,
    hours: { open: '09:00', close: '21:00' },
    closedDays: [],
    phone: '+994 12 555 01 34',
    whatsapp: '994505550134',
    amenities: [
      L('Espresso bar', 'Эспрессо-бар', 'Espresso bar'),
      L('Kart və nağd', 'Карта и наличные', 'Card & cash'),
      L('Günortayadək növbəsiz', 'Без записи до 12:00', 'Walk-ins before noon'),
    ],
    team: [
      {
        name: 'Rauf Məmmədov',
        role: R.masterBarber,
        years: 14,
        rating: 4.95,
        reviewCount: 188,
        covers: ['barber'],
        workDays: TUE_SAT,
        shift: ['10:00', '20:00'],
        tone: 'oxblood',
        languages: ['az', 'ru', 'en'],
      },
      {
        name: 'Elvin Quliyev',
        role: R.seniorBarber,
        years: 8,
        rating: 4.9,
        reviewCount: 126,
        covers: ['barber'],
        workDays: MON_SAT,
        shift: ['09:00', '18:00'],
        tone: 'ink',
      },
      {
        name: 'Tural Həsənli',
        role: R.barber,
        years: 4,
        rating: 4.8,
        reviewCount: 74,
        covers: ['barber'],
        workDays: WED_SUN,
        shift: ['12:00', '21:00'],
        tone: 'slate',
        languages: ['az', 'tr'],
      },
    ],
  },
  {
    id: 'maison-leyla',
    name: 'Maison Leyla',
    kind: L('Gözəllik salonu', 'Салон красоты', 'Beauty salon'),
    categories: ['hair', 'makeup', 'brows'],
    tagline: L(
      'Nizamidə rəng, kəsim və sakit lüks.',
      'Цвет, стрижка и тихая роскошь на Низами.',
      'Colour, cut and quiet luxury on Nizami.',
    ),
    about: L(
      'Nizami küçəsində işıqlı, birinci mərtəbədə salon. Yumşaq, təbii rəng və toy makiyajı ilə tanınır. Hər görüş çay və ətraflı məsləhətlə başlayır.',
      'Светлый салон на втором этаже над улицей Низами. Известен мягким натуральным цветом и свадебным макияжем. Каждый визит начинается с чая и консультации.',
      'A light-filled first-floor salon above Nizami street. Known for soft, lived-in colour and wedding-day makeup. Every appointment starts with tea and a proper consultation.',
    ),
    address: 'Nizami küç. 87, 1-ci mərtəbə',
    district: 'Nizami',
    coords: { latitude: 40.3719, longitude: 49.8445 },
    priceLevel: 3,
    tone: 'sand',
    rating: 4.8,
    reviewCount: 287,
    hours: { open: '10:00', close: '20:00' },
    closedDays: [1],
    phone: '+994 12 555 01 87',
    whatsapp: '994505550187',
    womenOnly: true,
    amenities: [
      L('Çay servisi', 'Чайный сервис', 'Tea service'),
      L('Gəlin otağı', 'Свадебная комната', 'Bridal suite'),
      L('Yalnız kart', 'Только карта', 'Card only'),
    ],
    team: [
      {
        name: 'Leyla Əliyeva',
        role: L('Kreativ direktor', 'Креативный директор', 'Creative director'),
        years: 16,
        rating: 4.95,
        reviewCount: 141,
        covers: ['hair', 'makeup'],
        workDays: TUE_SAT,
        shift: ['10:00', '19:00'],
        tone: 'sand',
        languages: ['az', 'ru', 'en'],
      },
      {
        name: 'Aysel Kərimova',
        role: R.colourist,
        years: 9,
        rating: 4.85,
        reviewCount: 98,
        covers: ['hair'],
        workDays: TUE_SAT,
        shift: ['11:00', '20:00'],
        tone: 'rose',
      },
      {
        name: 'Nərmin Rzayeva',
        role: L('Qaş və makiyaj ustası', 'Бровист и визажист', 'Brow & makeup artist'),
        years: 6,
        rating: 4.8,
        reviewCount: 67,
        covers: ['brows', 'makeup'],
        workDays: WED_SUN,
        shift: ['10:00', '19:00'],
        tone: 'clay',
      },
    ],
  },
  {
    id: 'kesim-studio',
    name: 'Kəsim Studio',
    kind: L('Bərbərxana', 'Барбершоп', 'Barbershop'),
    categories: ['barber'],
    tagline: L('Dəqiq fade. Artıq heç nə.', 'Точный фейд. Ничего лишнего.', 'Precision fades. Nothing extra.'),
    about: L(
      'Beton, palıd və dörd kreslo. Kəsim müasir kəsimlərə — fade, crop və teksturalı üst hissəyə — fokuslanır və vaxtında işləyir. Yalnız onlayn növbə.',
      'Бетон, дуб и четыре кресла. Kəsim делает современные стрижки — фейды, кропы, текстуру — и делает их вовремя. Только онлайн-запись.',
      'Concrete, oak and four chairs. Kəsim does modern cuts — fades, crops and textured tops — and does them on time. Online booking only.',
    ),
    address: 'Hüseyn Cavid pr. 21',
    district: 'Yasamal',
    coords: { latitude: 40.3936, longitude: 49.814 },
    priceLevel: 2,
    tone: 'navy',
    rating: 4.8,
    reviewCount: 236,
    hours: { open: '10:00', close: '21:00' },
    closedDays: [0],
    phone: '+994 12 555 01 21',
    whatsapp: '994505550121',
    amenities: [
      L('Yalnız onlayn növbə', 'Только онлайн-запись', 'Online booking only'),
      L('Kart və nağd', 'Карта и наличные', 'Card & cash'),
    ],
    team: [
      {
        name: 'Kamran Əsgərov',
        role: L('Sahibi, usta bərbər', 'Владелец, мастер-барбер', 'Owner, master barber'),
        years: 11,
        rating: 4.9,
        reviewCount: 131,
        covers: ['barber'],
        workDays: MON_SAT,
        shift: ['10:00', '19:00'],
        tone: 'navy',
        languages: ['az', 'ru', 'en'],
      },
      {
        name: 'Orxan Süleymanov',
        role: L('Fade ustası', 'Специалист по фейдам', 'Fade specialist'),
        years: 5,
        rating: 4.75,
        reviewCount: 88,
        covers: ['barber'],
        workDays: TUE_SAT,
        shift: ['12:00', '21:00'],
        tone: 'slate',
      },
    ],
  },
  {
    id: 'narinci-nails',
    name: 'Narıncı Nails',
    kind: L('Dırnaq studiyası', 'Ногтевая студия', 'Nail studio'),
    categories: ['nails'],
    tagline: L('Təmiz xətlər, davamlı rəng.', 'Чистые линии, стойкий цвет.', 'Clean lines, long-wear colour.'),
    about: L(
      'Altı yerlik işıqlı künc studiyası və ciddi gigiyena qaydası — hər alət sterilizə olunur və paketdə açılır. Minimalist dizaynları ilə məşhurdur.',
      'Светлая угловая студия на шесть мест со строгой гигиеной — каждый инструмент стерилизуется и вскрывается при вас. Славится минималистичным дизайном.',
      'A bright corner studio with six stations and a strict hygiene routine — every tool is sterilised and sealed. Famous for minimalist nail art.',
    ),
    address: 'Səməd Vurğun küç. 46',
    district: 'Nəsimi',
    coords: { latitude: 40.3858, longitude: 49.8381 },
    priceLevel: 1,
    tone: 'clay',
    rating: 4.7,
    reviewCount: 198,
    hours: { open: '09:00', close: '20:00' },
    closedDays: [],
    phone: '+994 12 555 01 46',
    whatsapp: '994505550146',
    womenOnly: true,
    amenities: [
      L('Steril alətlər', 'Стерильные инструменты', 'Sterilised tools'),
      L('Kart və nağd', 'Карта и наличные', 'Card & cash'),
    ],
    team: [
      {
        name: 'Günay Abbasova',
        role: L('Baş dırnaq ustası', 'Старший мастер маникюра', 'Senior nail artist'),
        years: 7,
        rating: 4.85,
        reviewCount: 102,
        covers: ['nails'],
        workDays: MON_SAT,
        shift: ['09:00', '18:00'],
        tone: 'clay',
        languages: ['az', 'ru', 'en'],
      },
      {
        name: 'Fidan Hüseynova',
        role: R.nailTech,
        years: 3,
        rating: 4.65,
        reviewCount: 61,
        covers: ['nails'],
        workDays: WED_SUN,
        shift: ['11:00', '20:00'],
        tone: 'rose',
      },
      {
        name: 'Lalə Babayeva',
        role: R.nailTech,
        years: 2,
        rating: 4.6,
        reviewCount: 35,
        covers: ['nails'],
        workDays: THU_MON,
        shift: ['10:00', '19:00'],
        tone: 'sand',
      },
    ],
  },
  {
    id: 'fade-district',
    name: 'Fade District',
    kind: L('Bərbərxana', 'Барбершоп', 'Barbershop'),
    categories: ['barber'],
    tagline: L(
      'Gec saatlar, iti kəsim, yaxşı musiqi.',
      'Допоздна, чёткие стрижки, хорошая музыка.',
      'Late hours, sharp cuts, good music.',
    ),
    about: L(
      'Əksər gecələr 23:00-dək açıqdır. 28 May yaxınlığında səs-küylü, mehriban bərbərxana — bilyard masası və mərkəzin ən yaxşı skin fade-ləri.',
      'Почти каждый вечер до 23:00. Шумный и дружелюбный барбершоп у 28 Мая — бильярд и лучшие скин-фейды в центре.',
      'Open until 23:00 most nights. A loud, friendly shop near 28 May with a pool table and the best skin fades in the centre.',
    ),
    address: '28 May küç. 3',
    district: '28 May',
    coords: { latitude: 40.3793, longitude: 49.8488 },
    priceLevel: 1,
    tone: 'slate',
    rating: 4.6,
    reviewCount: 341,
    hours: { open: '11:00', close: '23:00' },
    closedDays: [],
    phone: '+994 12 555 01 03',
    whatsapp: '994505550103',
    amenities: [
      L('Gecəyədək açıq', 'Открыто допоздна', 'Open late'),
      L('Bilyard', 'Бильярд', 'Pool table'),
      L('Yalnız nağd', 'Только наличные', 'Cash only'),
    ],
    team: [
      {
        name: 'Nicat Vəliyev',
        role: R.seniorBarber,
        years: 7,
        rating: 4.7,
        reviewCount: 143,
        covers: ['barber'],
        workDays: ALL_WEEK.filter((d) => d !== 2),
        shift: ['14:00', '23:00'],
        tone: 'slate',
      },
      {
        name: 'Ramil Cəfərov',
        role: R.barber,
        years: 3,
        rating: 4.55,
        reviewCount: 97,
        covers: ['barber'],
        workDays: MON_SAT,
        shift: ['11:00', '20:00'],
        tone: 'ink',
      },
      {
        name: 'Samir Nəbiyev',
        role: R.juniorBarber,
        years: 1,
        rating: 4.4,
        reviewCount: 22,
        covers: ['barber'],
        workDays: WED_SUN,
        shift: ['13:00', '22:00'],
        tone: 'navy',
      },
    ],
  },
  {
    id: 'ag-seher-atelier',
    name: 'Ağ Şəhər Atelier',
    kind: L('Saç ateliesi', 'Ателье волос', 'Hair atelier'),
    categories: ['hair'],
    tagline: L(
      'Sahil kənarında memarlıq kəsimləri.',
      'Архитектурные стрижки у набережной.',
      'Architectural cuts by the waterfront.',
    ),
    about: L(
      'Ağ Şəhərdə bulvara açılan geniş pəncərəli, qalereyaya bənzər atelye. Qısa, strukturlu kəsimlər və sarışın tonlar üzrə ixtisaslaşıb.',
      'Ателье-галерея в Белом городе с панорамными окнами на бульвар. Специализация — короткие структурные стрижки и блонд.',
      'A gallery-like atelier in White City with floor-to-ceiling windows over the boulevard. Specialists in short, structural cuts and blonde work.',
    ),
    address: 'Ağ Şəhər bulv. 12',
    district: 'Ağ Şəhər',
    coords: { latitude: 40.381, longitude: 49.887 },
    priceLevel: 3,
    tone: 'olive',
    rating: 4.9,
    reviewCount: 154,
    hours: { open: '10:00', close: '19:00' },
    closedDays: [0, 1],
    phone: '+994 12 555 01 62',
    whatsapp: '994505550162',
    amenities: [
      L('Dəniz mənzərəsi', 'Вид на море', 'Sea view'),
      L('Parkinq', 'Парковка', 'Parking'),
      L('Yalnız kart', 'Только карта', 'Card only'),
    ],
    team: [
      {
        name: 'Səbinə Mirzəyeva',
        role: L('Təsisçi, stilist', 'Основатель, стилист', 'Founder, stylist'),
        years: 18,
        rating: 4.95,
        reviewCount: 79,
        covers: ['hair'],
        workDays: TUE_SAT,
        shift: ['10:00', '18:00'],
        tone: 'olive',
        languages: ['az', 'ru', 'en'],
      },
      {
        name: 'Aynur Qasımova',
        role: L('Blond ustası', 'Специалист по блонду', 'Blonde specialist'),
        years: 10,
        rating: 4.9,
        reviewCount: 64,
        covers: ['hair'],
        workDays: TUE_SAT,
        shift: ['11:00', '19:00'],
        tone: 'bone',
      },
    ],
  },
  {
    id: 'lumen-brow',
    name: 'Lumen Brow & Lash',
    kind: L('Qaş studiyası', 'Brow-бар', 'Brow bar'),
    categories: ['brows', 'makeup'],
    tagline: L(
      'Sizin qaşlarınız, sadəcə daha yaxşı.',
      'Ваши брови, только лучше.',
      'Brows that look like yours, only better.',
    ),
    about: L(
      'Port Baku daxilində kiçik, sakit qaş studiyası. Lumen hər qaşı üz quruluşunuza uyğun eskizləyir, sonra işə başlayır.',
      'Небольшая спокойная студия бровей в Port Baku. Lumen размечает каждую бровь по строению лица, прежде чем начать.',
      'A small, calm brow bar inside Port Baku. Lumen maps every brow to your bone structure before a single hair is touched.',
    ),
    address: 'Port Baku, Neftçilər pr. 153',
    district: 'Port Baku',
    coords: { latitude: 40.3746, longitude: 49.8605 },
    priceLevel: 2,
    tone: 'rose',
    rating: 4.8,
    reviewCount: 173,
    hours: { open: '10:00', close: '20:00' },
    closedDays: [],
    phone: '+994 12 555 01 75',
    whatsapp: '994505550175',
    womenOnly: true,
    amenities: [
      L('Mall parkinqi', 'Парковка ТЦ', 'Mall parking'),
      L('Kart və nağd', 'Карта и наличные', 'Card & cash'),
    ],
    team: [
      {
        name: 'Nigar İsmayılova',
        role: L('Qaş memarı', 'Архитектор бровей', 'Brow architect'),
        years: 8,
        rating: 4.9,
        reviewCount: 96,
        covers: ['brows'],
        workDays: MON_SAT,
        shift: ['10:00', '19:00'],
        tone: 'rose',
        languages: ['az', 'ru', 'en'],
      },
      {
        name: 'Ülviyyə Sadıqova',
        role: L('Kirpik və makiyaj ustası', 'Лэшмейкер и визажист', 'Lash & makeup artist'),
        years: 5,
        rating: 4.75,
        reviewCount: 57,
        covers: ['brows', 'makeup'],
        workDays: WED_SUN,
        shift: ['11:00', '20:00'],
        tone: 'clay',
      },
    ],
  },
  {
    id: 'hammam-no-9',
    name: 'Hammam No. 9',
    kind: L('Spa və hamam', 'Спа и хаммам', 'Spa & hammam'),
    categories: ['spa'],
    tagline: L('Buxar, daş və tələsməyən saatlar.', 'Пар, камень и неспешные часы.', 'Steam, stone and slow hours.'),
    about: L(
      'Bakı hamamının müasir versiyası, bulvardan bir neçə addım. Mərmər buxar otaqları, soyuq hovuz və ənənəvi kisəni bilən terapevtlər.',
      'Современный бакинский хаммам в паре шагов от бульвара. Мраморные парные, холодная купель и терапевты, владеющие традиционным кесе.',
      'A modern take on the Baku hammam, a few steps from the boulevard. Marble steam rooms, a cold plunge and therapists trained in traditional kese.',
    ),
    address: 'Bülbül pr. 9',
    district: 'Sahil',
    coords: { latitude: 40.3706, longitude: 49.849 },
    priceLevel: 3,
    tone: 'forest',
    rating: 4.7,
    reviewCount: 221,
    hours: { open: '09:00', close: '22:00' },
    closedDays: [],
    phone: '+994 12 555 01 09',
    whatsapp: '994505550109',
    amenities: [
      L('Buxar və hovuz', 'Пар и купель', 'Steam & plunge'),
      L('Dəsmal və xalat', 'Полотенца и халаты', 'Towels & robes'),
      L('Yalnız kart', 'Только карта', 'Card only'),
    ],
    team: [
      {
        name: 'Fuad Hacıyev',
        role: L('Hamam ustası', 'Мастер хаммама', 'Hammam master'),
        years: 15,
        rating: 4.8,
        reviewCount: 104,
        covers: ['spa'],
        workDays: TUE_SAT,
        shift: ['09:00', '18:00'],
        tone: 'forest',
      },
      {
        name: 'Aytən Əhmədova',
        role: L('Masaj terapevti', 'Массажист', 'Massage therapist'),
        years: 9,
        rating: 4.75,
        reviewCount: 88,
        covers: ['spa'],
        workDays: WED_SUN,
        shift: ['12:00', '22:00'],
        tone: 'olive',
        languages: ['az', 'ru', 'en'],
      },
    ],
  },
  {
    id: 'gentry-grooming',
    name: 'Gentry Grooming',
    kind: L('Bərbər və spa', 'Барбершоп и спа', 'Barber & spa'),
    categories: ['barber', 'spa'],
    tagline: L(
      'Klub ab-havası, üzvlük olmadan.',
      'Атмосфера клуба — без членства.',
      'A members-club feel, without the membership.',
    ),
    about: L(
      'Tünd ağac, rəfdə viski və üz baxımı ilə masaj üçün ayrıca otaq. Gənclikdə tam qulluq ritualı — əvvəldən axıradək.',
      'Тёмное дерево, виски на полке и отдельная комната для ухода и массажа. Полный груминг-ритуал в Гянджлике — от начала до конца.',
      'Dark wood, whisky on the shelf and a private treatment room for facials and massage. The full grooming ritual, start to finish, in Gənclik.',
    ),
    address: 'Atatürk pr. 44',
    district: 'Gənclik',
    coords: { latitude: 40.4006, longitude: 49.8516 },
    priceLevel: 3,
    tone: 'ink',
    rating: 4.85,
    reviewCount: 189,
    hours: { open: '10:00', close: '21:00' },
    closedDays: [],
    phone: '+994 12 555 01 44',
    whatsapp: '994505550144',
    amenities: [
      L('Ayrıca otaq', 'Отдельная комната', 'Private room'),
      L('Pulsuz içki', 'Напиток в подарок', 'Complimentary drink'),
      L('Parkinq', 'Парковка', 'Parking'),
    ],
    team: [
      {
        name: 'Ruslan Axundov',
        role: L('Baş bərbər', 'Шеф-барбер', 'Head barber'),
        years: 12,
        rating: 4.9,
        reviewCount: 97,
        covers: ['barber'],
        workDays: MON_SAT,
        shift: ['10:00', '19:00'],
        tone: 'ink',
        languages: ['az', 'ru', 'en'],
      },
      {
        name: 'Emil Zeynalov',
        role: L('Bərbər və qulluq ustası', 'Барбер и грумер', 'Barber & groomer'),
        years: 6,
        rating: 4.8,
        reviewCount: 58,
        covers: ['barber', 'spa'],
        workDays: WED_SUN,
        shift: ['12:00', '21:00'],
        tone: 'oxblood',
      },
    ],
  },
  {
    id: 'studio-sabina',
    name: 'Studio Səbinə',
    kind: L('Saç və makiyaj', 'Волосы и макияж', 'Hair & makeup'),
    categories: ['hair', 'makeup'],
    tagline: L(
      'Məhəllə salonu, jurnal səviyyəsi.',
      'Салон у дома с журнальным уровнем.',
      'Neighbourhood salon, editorial standards.',
    ),
    about: L(
      'Elmlər yaxınlığında iki kreslo, bir makiyaj masası və sadiq müştərilər. Sərfəli kəsim, gözəl ukladka və diqqətlə edilən tədbir makiyajı.',
      'Два кресла, один стол визажиста и преданные клиенты у Элмляр. Доступные стрижки, красивые укладки и бережный вечерний макияж.',
      'Two chairs, one makeup station and a loyal following near Elmlər. Affordable cuts, beautiful blow-dries and event makeup done with care.',
    ),
    address: 'Bəxtiyar Vahabzadə küç. 7',
    district: 'Elmlər',
    coords: { latitude: 40.3752, longitude: 49.8135 },
    priceLevel: 1,
    tone: 'rose',
    rating: 4.6,
    reviewCount: 117,
    hours: { open: '09:00', close: '19:00' },
    closedDays: [0],
    phone: '+994 12 555 01 58',
    whatsapp: '994505550158',
    amenities: [
      L('Kart və nağd', 'Карта и наличные', 'Card & cash'),
      L('Uşaqlarla gəlmək olar', 'Можно с детьми', 'Kids welcome'),
    ],
    team: [
      {
        name: 'Səbinə Orucova',
        role: L('Sahibi, stilist', 'Владелица, стилист', 'Owner, stylist'),
        years: 11,
        rating: 4.7,
        reviewCount: 66,
        covers: ['hair', 'makeup'],
        workDays: MON_SAT,
        shift: ['09:00', '18:00'],
        tone: 'rose',
      },
      {
        name: 'Könül Əlizadə',
        role: R.stylist,
        years: 4,
        rating: 4.5,
        reviewCount: 38,
        covers: ['hair'],
        workDays: TUE_SAT,
        shift: ['10:00', '19:00'],
        tone: 'sand',
      },
    ],
  },
  {
    id: 'bayil-barber-co',
    name: 'Bayıl Barber Co.',
    kind: L('Bərbərxana', 'Барбершоп', 'Barbershop'),
    categories: ['barber'],
    tagline: L('Dəniz havası və dürüst kəsim.', 'Морской воздух и честная стрижка.', 'Sea air and an honest haircut.'),
    about: L(
      'Bayıl təpəsində iki qardaşın işlətdiyi ailə bərbərxanası. Klassik kəsimlər, ədalətli qiymətlər və gözləmə skamyasından körfəz mənzərəsi.',
      'Семейный барбершоп на холме над Баилом, который держат два брата. Классика, честные цены и вид на бухту со скамейки ожидания.',
      'A family shop on the hill above Bayıl, run by two brothers. Classic cuts, fair prices and a view of the bay from the waiting bench.',
    ),
    address: 'Bayıl qəs., Z. Bünyadov küç. 18',
    district: 'Bayıl',
    coords: { latitude: 40.349, longitude: 49.836 },
    priceLevel: 1,
    tone: 'oxblood',
    rating: 4.7,
    reviewCount: 96,
    hours: { open: '09:00', close: '20:00' },
    closedDays: [1],
    phone: '+994 12 555 01 18',
    whatsapp: '994505550118',
    amenities: [
      L('Yalnız nağd', 'Только наличные', 'Cash only'),
      L('Növbəsiz qəbul', 'Без записи', 'Walk-ins welcome'),
    ],
    team: [
      {
        name: 'Vüqar Səfərov',
        role: R.masterBarber,
        years: 20,
        rating: 4.8,
        reviewCount: 59,
        covers: ['barber'],
        workDays: TUE_SAT,
        shift: ['09:00', '18:00'],
        tone: 'oxblood',
      },
      {
        name: 'Anar Səfərov',
        role: R.barber,
        years: 9,
        rating: 4.65,
        reviewCount: 37,
        covers: ['barber'],
        workDays: [0, 2, 3, 4, 5, 6],
        shift: ['11:00', '20:00'],
        tone: 'slate',
      },
    ],
  },
  {
    id: 'polish-room',
    name: 'The Polish Room',
    kind: L('Dırnaq studiyası', 'Ногтевая студия', 'Nail studio'),
    categories: ['nails', 'brows'],
    tagline: L(
      'Manikür, pedikür, qaş — bir saatdan az.',
      'Маникюр, педикюр, брови — меньше чем за час.',
      'Mani, pedi, brows — in under an hour.',
    ),
    about: L(
      'İş günləri üçün qurulub: iki usta eyni anda işləyir, buna görə manikür və pedikür iki yox, bir saat çəkir. İşıqlı, sürətli, tərtəmiz.',
      'Создана для будней: два мастера работают одновременно, поэтому маникюр и педикюр занимают час, а не два. Светло, быстро, безупречно чисто.',
      'Built for busy weekdays: two technicians can work at once, so a manicure and pedicure take one hour, not two. Bright, efficient, spotless.',
    ),
    address: 'Təbriz küç. 66',
    district: 'Nərimanov',
    coords: { latitude: 40.4027, longitude: 49.871 },
    priceLevel: 2,
    tone: 'sand',
    rating: 4.75,
    reviewCount: 142,
    hours: { open: '08:00', close: '20:00' },
    closedDays: [],
    phone: '+994 12 555 01 66',
    whatsapp: '994505550166',
    amenities: [
      L('Səhər tezdən açıq', 'Открыто с утра', 'Early opening'),
      L('Kart və nağd', 'Карта и наличные', 'Card & cash'),
    ],
    team: [
      {
        name: 'Aygün Məlikova',
        role: R.nailArtist,
        years: 6,
        rating: 4.8,
        reviewCount: 77,
        covers: ['nails'],
        workDays: MON_SAT,
        shift: ['08:00', '17:00'],
        tone: 'sand',
      },
      {
        name: 'Zəhra Novruzova',
        role: L('Qaş və dırnaq ustası', 'Мастер бровей и маникюра', 'Brow & nail technician'),
        years: 4,
        rating: 4.7,
        reviewCount: 49,
        covers: ['nails', 'brows'],
        workDays: WED_SUN,
        shift: ['11:00', '20:00'],
        tone: 'bone',
        languages: ['az', 'ru', 'en'],
      },
    ],
  },
  {
    id: 'shave-club',
    name: 'The Shave Club',
    kind: L('Bərbərxana', 'Барбершоп', 'Barbershop'),
    categories: ['barber'],
    tagline: L(
      'İsti dəsmalla təraş, mükəmməlliyə qədər.',
      'Бритьё горячим полотенцем — доведённое до идеала.',
      'The hot towel shave, perfected.',
    ),
    about: L(
      'Təraş üzrə ixtisaslaşmış, sadiq izləyiciləri olan bərbərxana. Üç dəsmal, təraşdan əvvəl yağ və soyuq finişlə 45 dəqiqəlik ritual. Kəsim də var.',
      'Барбершоп, специализирующийся на бритье, с культовой репутацией. 45-минутный ритуал: три полотенца, масло до бритья и холодный финиш. Стрижки тоже есть.',
      'A shaving specialist with a cult following. Expect a 45-minute ritual with three towels, pre-shave oil and a cold finish. Cuts too, if you must.',
    ),
    address: 'Xətai pr. 28',
    district: 'Xətai',
    coords: { latitude: 40.3834, longitude: 49.8718 },
    priceLevel: 2,
    tone: 'forest',
    rating: 4.9,
    reviewCount: 168,
    hours: { open: '10:00', close: '20:00' },
    closedDays: [0],
    phone: '+994 12 555 01 28',
    whatsapp: '994505550128',
    amenities: [
      L('Təraş ustaları', 'Мастера бритья', 'Shave specialists'),
      L('Kart və nağd', 'Карта и наличные', 'Card & cash'),
    ],
    team: [
      {
        name: 'İlqar Bağırov',
        role: L('Ülgüc ustası', 'Мастер опасной бритвы', 'Master of the razor'),
        years: 17,
        rating: 4.95,
        reviewCount: 102,
        covers: ['barber'],
        workDays: MON_SAT,
        shift: ['10:00', '19:00'],
        tone: 'forest',
      },
      {
        name: 'Cavid Hümbətov',
        role: R.barber,
        years: 5,
        rating: 4.8,
        reviewCount: 46,
        covers: ['barber'],
        workDays: TUE_SAT,
        shift: ['11:00', '20:00'],
        tone: 'olive',
        languages: ['az', 'ru', 'en'],
      },
    ],
  },
  {
    id: 'mira-beauty-lab',
    name: 'Mira Beauty Lab',
    kind: L('Gözəllik studiyası', 'Бьюти-студия', 'Beauty studio'),
    categories: ['makeup', 'brows', 'spa'],
    tagline: L(
      'Əvvəl dəri. Sonra qalan hər şey.',
      'Сначала кожа. Потом всё остальное.',
      'Skin first. Then everything else.',
    ),
    about: L(
      'Keçmiş kosmetik kimyaçının dəriyə fokuslanan studiyası. Üz baxımı, qaşlar və sizə uyğun dəri planı üzərində qurulan təbii makiyaj.',
      'Студия бывшего косметического химика с фокусом на коже. Уход за лицом, брови и естественный макияж на основе персонального плана ухода.',
      'A skin-focused studio by a former cosmetic chemist. Facials, brows and natural makeup built on a skin plan tailored to you.',
    ),
    address: 'Rəşid Behbudov küç. 10',
    district: 'Nizami',
    coords: { latitude: 40.3765, longitude: 49.8412 },
    priceLevel: 2,
    tone: 'clay',
    rating: 4.65,
    reviewCount: 88,
    hours: { open: '10:00', close: '20:00' },
    closedDays: [0],
    phone: '+994 12 555 01 91',
    whatsapp: '994505550191',
    womenOnly: true,
    amenities: [
      L('Dəri məsləhəti', 'Консультация по коже', 'Skin consultation'),
      L('Yalnız kart', 'Только карта', 'Card only'),
    ],
    team: [
      {
        name: 'Mira Hacıyeva',
        role: L('Təsisçi, dəri terapevti', 'Основатель, косметолог', 'Founder, skin therapist'),
        years: 12,
        rating: 4.8,
        reviewCount: 41,
        covers: ['spa', 'makeup'],
        workDays: TUE_SAT,
        shift: ['10:00', '19:00'],
        tone: 'clay',
        languages: ['az', 'ru', 'en'],
      },
      {
        name: 'Ləman Əsədova',
        role: L('Qaş və makiyaj ustası', 'Бровист и визажист', 'Brow & makeup artist'),
        years: 5,
        rating: 4.6,
        reviewCount: 33,
        covers: ['brows', 'makeup'],
        workDays: MON_SAT,
        shift: ['11:00', '20:00'],
        tone: 'rose',
      },
    ],
  },
  {
    id: 'crown-clipper',
    name: 'Crown & Clipper',
    kind: L('Bərbərxana', 'Барбершоп', 'Barbershop'),
    categories: ['barber'],
    tagline: L('Böyük bərbərxana, gözləmə yoxdur.', 'Большой барбершоп без очередей.', 'Big shop, no waiting.'),
    about: L(
      'Şərq tərəfdə on kreslo — keyfiyyətdən güzəşt etmədən sürət üçün qurulub. Gündəlik qiymətə etibarlı kəsim və demək olar ki, həmişə bu gün boş kreslo.',
      'Десять кресел на востоке города — скорость без потери качества. Надёжные стрижки по доступной цене и почти всегда свободное кресло сегодня.',
      'Ten chairs on the east side, built for speed without cutting corners. Reliable cuts at everyday prices, and almost always a free chair today.',
    ),
    address: 'Qara Qarayev pr. 112',
    district: '8-ci km',
    coords: { latitude: 40.399, longitude: 49.944 },
    priceLevel: 1,
    tone: 'navy',
    rating: 4.5,
    reviewCount: 263,
    hours: { open: '09:00', close: '22:00' },
    closedDays: [],
    phone: '+994 12 555 01 12',
    whatsapp: '994505550112',
    amenities: [
      L('On kreslo', 'Десять кресел', 'Ten chairs'),
      L('Parkinq', 'Парковка', 'Parking'),
      L('Kart və nağd', 'Карта и наличные', 'Card & cash'),
    ],
    team: [
      {
        name: 'Elşən Kazımov',
        role: R.seniorBarber,
        years: 9,
        rating: 4.6,
        reviewCount: 121,
        covers: ['barber'],
        workDays: MON_SAT,
        shift: ['09:00', '18:00'],
        tone: 'navy',
      },
      {
        name: 'Toğrul Məhərrəmov',
        role: R.barber,
        years: 3,
        rating: 4.45,
        reviewCount: 64,
        covers: ['barber'],
        workDays: WED_SUN,
        shift: ['13:00', '22:00'],
        tone: 'slate',
      },
    ],
  },
];

/** A distribution over 1–5★ whose mean matches the venue's rating. */
export function distributionFor(rating: number): Salon['distribution'] {
  const spread = 0.75;
  const shape = (center: number) => {
    const w = [5, 4, 3, 2, 1].map((k) => Math.exp(-((k - center) ** 2) / spread));
    const sum = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / sum);
  };
  const mean = (d: number[]) => d.reduce((acc, p, i) => acc + p * (5 - i), 0);
  let lo = 1;
  let hi = 9;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (mean(shape(mid)) < rating) lo = mid;
    else hi = mid;
  }
  return shape((lo + hi) / 2) as Salon['distribution'];
}

function buildMasters(salonId: string, team: MasterSeed[], services: Service[]): Master[] {
  return team.map((m, i) => ({
    id: `${salonId}.m${i + 1}`,
    name: m.name,
    role: m.role,
    years: m.years,
    rating: m.rating,
    reviewCount: m.reviewCount,
    serviceIds: services.filter((s) => m.covers.includes(s.category)).map((s) => s.id),
    workDays: m.workDays,
    shift: { start: m.shift[0], end: m.shift[1] },
    tone: m.tone,
    languages: m.languages ?? ['az', 'ru'],
  }));
}

export const salons: Salon[] = seeds.map(({ team, ...seed }) => {
  const services = buildServices(seed.id, seed.categories, seed.priceLevel);
  return {
    ...seed,
    services,
    masters: buildMasters(seed.id, team, services),
    distribution: distributionFor(seed.rating),
  };
});

export const salonById = (id: string | undefined) => salons.find((s) => s.id === id);

export const fromPrice = (salon: Salon) => Math.min(...salon.services.map((s) => s.price));

export const masterById = (id: string | undefined) => {
  for (const salon of salons) {
    const master = salon.masters.find((m) => m.id === id);
    if (master) return { salon, master };
  }
  return undefined;
};
