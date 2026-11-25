import type { Loc } from '@/i18n/types';

import type { Business, Feature as FeatureId, Market, PlanId, Subscription } from './types';

export const TRIAL_DAYS = 30;

/** After an unpaid trial or paid period the salon stays listed this long (server: usta.grace_days). */
export const GRACE_DAYS = 7;

/** Reminders to add a payment start this many days before the trial ends. */
export const REMIND_DAYS = 3;

const DAY = 86_400_000;

const L = (az: string, ru: string, en: string): Loc => ({ az, ru, en });

/** A plan line. `soon`: promised, not built yet; the plans screen labels it so nobody pays for it unknowingly. */
export type Feature = Loc & { soon?: true };

export type BillingPeriod = 'month' | 'year';

/** A year costs this many months (12 months for the price of 10). */
export const YEAR_MONTHS_PAID = 10;

/** Pro: locations (the main salon + branches) in the price, then this much a month for each further one. */
export const BRANCHES_INCLUDED = 3;
export const BRANCH_PRICE = 15;

/** WhatsApp add-on for Start and Pro. */
export const WHATSAPP_PACK = { price: 10, messages: 300, days: 30 };

/** Deposit rules (server: usta.deposits). */
export const DEPOSIT_HOLD_MIN = 15;
export const NO_SHOW_LIMIT = 2;
export const DEFAULT_DEPOSIT = { percent: 20, min: 5 };

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in AZN after the trial. */
  price: number;
  /** Yearly price in AZN. */
  priceYear: number;
  blurb: Loc;
  features: Feature[];
  /** What the plan unlocks; the server's list wins when it sends one. */
  unlocks: FeatureId[];
  recommended?: boolean;
  /** Salons pick beauty plans; couture brands their own. */
  market: Market;
  /** Most masters the plan allows (Fərdi: one person). */
  masters?: number;
};

const base: FeatureId[] = [
  'listing',
  'qr_reviews',
  'replies',
  'gallery',
  'booking_link',
  'click_report',
  'stats',
  'staff',
];
const startUnlocks: FeatureId[] = [...base, 'booking', 'whatsapp_addon'];
const withPage: FeatureId[] = [...startUnlocks, 'personal_page'];

export const plans: Plan[] = [
  {
    id: 'sade',
    market: 'beauty',
    name: 'Sadə',
    price: 10,
    priceYear: 10 * YEAR_MONTHS_PAID,
    blurb: L('Xəritədə yer və rəylər', 'Место на карте и отзывы', 'On the map, with reviews'),
    unlocks: base,
    features: [
      L('Xəritədə və axtarışda yer', 'Место на карте и в поиске', 'A place on the map and in search'),
      L('QR ilə rəylər və rəylərə cavab', 'Отзывы по QR и ответы на них', 'QR reviews and replies'),
      L('Foto qalereya', 'Фотогалерея', 'Photo gallery'),
      L(
        '«Bron et» düyməsi öz səhifənizə (DIKIDI, WhatsApp, telefon)',
        'Кнопка «Записаться» на вашу страницу (DIKIDI, WhatsApp, телефон)',
        '"Book" button to your own page (DIKIDI, WhatsApp, phone)',
      ),
      L('Aylıq klik hesabatı', 'Ежемесячный отчёт по кликам', 'Monthly click report'),
      L(
        'Statistika: gəlir, müştərilər, kanallar',
        'Статистика: доход, клиенты, каналы',
        'Statistics: earnings, clients, channels',
      ),
      L(
        'Ustalar üçün kabinet: gəliş-gediş qeydi',
        'Кабинет мастера: отметка прихода и ухода',
        'Staff cabinet: check-in and check-out',
      ),
    ],
  },
  {
    id: 'ferdi',
    market: 'beauty',
    name: 'Fərdi',
    price: 10,
    priceYear: 10 * YEAR_MONTHS_PAID,
    blurb: L('Tək işləyən usta üçün', 'Для мастера, работающего один', 'For one master working solo'),
    unlocks: [...startUnlocks, 'personal_page'],
    masters: 1,
    features: [
      L(
        'Start planındakı hər şey, bir nəfər üçün',
        'Всё из тарифа Start для одного человека',
        'Everything in Start, for one person',
      ),
      L(
        'Instagram bio üçün bron linki: yazilnow.az/u/adınız',
        'Ссылка для записи в био Instagram: yazilnow.az/u/имя',
        'A booking link for your Instagram bio: yazilnow.az/u/yourname',
      ),
      L(
        'Onlayn bron, təqvim və xatırlatmalar',
        'Онлайн-запись, календарь и напоминания',
        'Online booking, calendar and reminders',
      ),
      L(
        'Salonda işləyirsinizsə də, öz səhifəniz olur',
        'Подходит и мастеру внутри салона',
        'Also for a master working inside a salon',
      ),
    ],
  },
  {
    id: 'start',
    market: 'beauty',
    name: 'Start',
    price: 29,
    priceYear: 29 * YEAR_MONTHS_PAID,
    recommended: true,
    blurb: L('Tək salon üçün', 'Для одного салона', 'For a single salon'),
    unlocks: withPage,
    features: [
      L('Xəritədə yer, QR rəylər və foto qalereya', 'Место на карте, отзывы по QR и фотогалерея', 'On the map, with QR reviews and a photo gallery'),
      L('Onlayn bron və təqvim', 'Онлайн-запись и календарь', 'Online booking and calendar'),
      L(
        'Instagram bio üçün bron linki: ustalar, saatlar, boş vaxtlar',
        'Ссылка для записи в био Instagram: мастера, часы, свободное время',
        'A booking link for your Instagram bio: masters, hours, free times',
      ),
      L(
        'Limitsiz usta, əlavə ödəniş yoxdur',
        'Мастера без ограничений и доплат',
        'Unlimited masters, no per-seat fees',
      ),
      L('Müştərilərə xatırlatmalar', 'Напоминания клиентам', 'Reminders for clients'),
      L(
        'WhatsApp təsdiqləri: əlavə paket, 10 ₼ / 300 mesaj',
        'Подтверждения в WhatsApp: пакет 10 ₼ / 300 сообщений',
        'WhatsApp confirmations: add-on, 10 ₼ / 300 messages',
      ),
    ],
  },
  {
    id: 'pro',
    market: 'beauty',
    name: 'Pro',
    price: 49,
    priceYear: 49 * YEAR_MONTHS_PAID,
    blurb: L('Böyüyən salonlar üçün', 'Для растущих салонов', 'For growing salons'),
    unlocks: [...withPage, 'branches', 'managers', 'deposits', 'waitlist', 'priority_support'],
    features: [
      L('Start planındakı hər şey', 'Всё из тарифа Start', 'Everything in Start'),
      L(
        '3 filial daxildir (hər əlavə filial +15 ₼)',
        '3 филиала включены (+15 ₼ за каждый следующий)',
        'Up to 3 branches included (+15 ₼ per extra branch)',
      ),
      L(
        'Bir bron linki: müştəri əvvəlcə filialı seçir',
        'Одна ссылка для записи: клиент сначала выбирает филиал',
        'One booking link: clients pick a branch first',
      ),
      L('Filiallar üzrə ümumi hesabat', 'Сводные отчёты по филиалам', 'Combined reports across branches'),
      L('Filial menecerləri', 'Роли менеджеров филиалов', 'Branch manager roles'),
      L('Gəlməmə qorunması və depozit', 'Защита от неявок и депозиты', 'No-show protection and deposits'),
      L('Gözləmə siyahısı', 'Лист ожидания', 'Waitlist'),
      L('Prioritet dəstək və telefon xətti', 'Приоритетная поддержка и телефон', 'Priority support and a phone line'),
    ],
  },
  {
    id: 'couture',
    market: 'couture',
    name: 'Couture',
    price: 39,
    priceYear: 39 * YEAR_MONTHS_PAID,
    recommended: true,
    blurb: L('Bir showroom üçün', 'Для одного шоурума', 'For one showroom'),
    unlocks: [...withPage, 'managers', 'deposits', 'waitlist', 'priority_support'],
    features: [
      L(
        'Showroom ziyarəti və geyinib baxmaq üçün onlayn qeyd',
        'Онлайн-запись на визит в шоурум и примерку',
        'Online appointments to visit the showroom and try pieces on',
      ),
      L('1 showroom', '1 шоурум', '1 showroom'),
      L('Stilistlər və menecerlər', 'Стилисты и менеджеры', 'Stylists and managers'),
      L('Depozit və gəlməmə qorunması', 'Депозит и защита от неявок', 'Deposits and no-show protection'),
      L('Gözləmə siyahısı və statistika', 'Лист ожидания и статистика', 'Waitlist and statistics'),
      L('Instagram bio üçün qeyd linki', 'Ссылка для записи в био Instagram', 'A booking link for your Instagram bio'),
    ],
  },
  {
    id: 'couture_plus',
    market: 'couture',
    name: 'Couture Plus',
    price: 59,
    priceYear: 59 * YEAR_MONTHS_PAID,
    blurb: L('3 showroomadək', 'До 3 шоурумов', 'Up to 3 showrooms'),
    unlocks: [...withPage, 'branches', 'managers', 'deposits', 'waitlist', 'priority_support'],
    features: [
      L('Couture planındakı hər şey', 'Всё из тарифа Couture', 'Everything in Couture'),
      L(
        '3 showroom daxildir (hər əlavəsi +15 ₼)',
        '3 шоурума включены (+15 ₼ за каждый следующий)',
        'Up to 3 showrooms included (+15 ₼ per extra one)',
      ),
      L(
        'Bir qeyd linki: müştəri əvvəlcə showroomu seçir',
        'Одна ссылка для записи: клиент сначала выбирает шоурум',
        'One booking link: clients pick a showroom first',
      ),
      L('Showroomlar üzrə ümumi hesabat', 'Сводные отчёты по шоурумам', 'Combined reports across showrooms'),
    ],
  },
];


/** Unknown ids (a retired plan cached on the device) read as Pro, as the server migrated them. */
export const planById = (id: PlanId | string) => plans.find((p) => p.id === id) ?? plans.find((p) => p.id === 'pro')!;

/** How many masters the salon's plan allows, or null for no limit. */
export const masterLimit = (business: Business | null | undefined): number | null =>
  business?.subscription ? (planById(business.subscription.plan).masters ?? null) : null;

/** Does the salon's plan include this? The server's list, else the bundled plan. */
export function hasFeature(business: Business | null | undefined, feature: FeatureId): boolean {
  if (!business?.subscription) return false;
  return (business.features ?? planById(business.subscription.plan).unlocks).includes(feature);
}

/** Pro's monthly price for this many locations. */
export const proPrice = (locations: number, base = 49) =>
  base + Math.max(0, locations - BRANCHES_INCLUDED) * BRANCH_PRICE;

/**
 * The status the dates imply, as the server's scheduled job sets it:
 * trial or paid period over → past_due (still listed for GRACE_DAYS) → expired.
 * Used by the on-device demo backend; the live API sends the stored status.
 */
export function settle(sub: Subscription, now = Date.now()): Subscription {
  const end = new Date(sub.currentPeriodEnd ?? sub.trialEndsAt).getTime();
  const graceEnd = end + GRACE_DAYS * DAY;
  let status = sub.status;
  if (status !== 'expired') {
    if (now >= graceEnd) status = 'expired';
    else if (now >= end) status = 'past_due';
  }
  return { ...sub, status, graceEndsAt: new Date(graceEnd).toISOString() };
}

/** The market a set of categories belongs to: a couture showroom, or a beauty business. */
export const marketOf = (categories: readonly string[] | undefined): Market =>
  categories?.length && categories.every((c) => c === 'couture') ? 'couture' : 'beauty';

/** The plans a business may pick: its own market's. */
/** Plans not offered to new businesses for now (still valid for those already on them). */
const PAUSED: PlanId[] = ['sade'];
export const plansFor = (market: Market) => plans.filter((p) => p.market === market && !PAUSED.includes(p.id));
