import type { Loc } from '@/i18n/types';

import type { Business, Feature as FeatureId, PlanId, Subscription } from './types';

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
};

const base: FeatureId[] = ['listing', 'qr_reviews', 'replies', 'gallery', 'booking_link', 'click_report'];
const startUnlocks: FeatureId[] = [...base, 'booking', 'whatsapp_addon'];

export const plans: Plan[] = [
  {
    id: 'sade',
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
    ],
  },
  {
    id: 'start',
    name: 'Start',
    price: 29,
    priceYear: 29 * YEAR_MONTHS_PAID,
    blurb: L('Tək salon üçün', 'Для одного салона', 'For a single salon'),
    unlocks: startUnlocks,
    features: [
      L('Sadə planındakı hər şey', 'Всё из тарифа Sadə', 'Everything in Sadə'),
      L('Onlayn bron və təqvim', 'Онлайн-запись и календарь', 'Online booking and calendar'),
      L('Limitsiz usta, əlavə ödəniş yoxdur', 'Мастера без ограничений и доплат', 'Unlimited masters, no per-seat fees'),
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
    name: 'Pro',
    price: 49,
    priceYear: 49 * YEAR_MONTHS_PAID,
    recommended: true,
    blurb: L('Böyüyən salonlar üçün', 'Для растущих салонов', 'For growing salons'),
    unlocks: [...startUnlocks, 'branches', 'managers', 'deposits', 'waitlist', 'stats', 'priority_support'],
    features: [
      L('Start planındakı hər şey', 'Всё из тарифа Start', 'Everything in Start'),
      L(
        '3 filial daxildir (hər əlavə filial +15 ₼)',
        '3 филиала включены (+15 ₼ за каждый следующий)',
        'Up to 3 branches included (+15 ₼ per extra branch)',
      ),
      L('Filiallar üzrə ümumi hesabat', 'Сводные отчёты по филиалам', 'Combined reports across branches'),
      L('Filial menecerləri', 'Роли менеджеров филиалов', 'Branch manager roles'),
      L('Gəlməmə qorunması və depozit', 'Защита от неявок и депозиты', 'No-show protection and deposits'),
      L('Gözləmə siyahısı və statistika', 'Лист ожидания и статистика', 'Waitlist and statistics'),
      L('Prioritet dəstək və telefon xətti', 'Приоритетная поддержка и телефон', 'Priority support and a phone line'),
    ],
  },
];

/** Unknown ids (a retired plan cached on the device) read as Pro, as the server migrated them. */
export const planById = (id: PlanId | string) => plans.find((p) => p.id === id) ?? plans[2];

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
