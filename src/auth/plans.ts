import type { Loc } from '@/i18n/types';

import type { PlanId, Subscription } from './types';

export const TRIAL_DAYS = 30;

/** After an unpaid trial or paid period the salon stays listed this long (server: usta.grace_days). */
export const GRACE_DAYS = 7;

/** Reminders to add a payment start this many days before the trial ends. */
export const REMIND_DAYS = 3;

const DAY = 86_400_000;

const L = (az: string, ru: string, en: string): Loc => ({ az, ru, en });

/** A plan line. `soon`: promised, not built yet; the plans screen labels it so nobody pays for it unknowingly. */
export type Feature = Loc & { soon?: true };
const soon = (f: Loc): Feature => ({ ...f, soon: true });

/** Every plan includes every master: adding staff never changes the price. */
const unlimitedMasters = L(
  'Limitsiz usta, əlavə ödəniş yoxdur',
  'Мастера без ограничений и доплат',
  'Unlimited masters, no per-seat fees',
);

export type BillingPeriod = 'month' | 'year';

/** A year costs this many months (12 months for the price of 10). */
export const YEAR_MONTHS_PAID = 10;

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in AZN after the trial. */
  price: number;
  /** Yearly price in AZN. */
  priceYear: number;
  blurb: Loc;
  features: Feature[];
  recommended?: boolean;
};

export const plans: Plan[] = [
  {
    id: 'start',
    name: 'Start',
    price: 29,
    priceYear: 29 * YEAR_MONTHS_PAID,
    blurb: L('Tək salon üçün', 'Для одного салона', 'For a single salon'),
    features: [
      L('Onlayn bron və təqvim', 'Онлайн-запись и календарь', 'Online booking and calendar'),
      unlimitedMasters,
      soon(L('WhatsApp ilə təsdiq', 'Подтверждения в WhatsApp', 'WhatsApp confirmations')),
      L('Rəylərə cavab', 'Ответы на отзывы', 'Replies to reviews'),
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    priceYear: 49 * YEAR_MONTHS_PAID,
    recommended: true,
    blurb: L('Böyüyən salonlar üçün', 'Для растущих салонов', 'For growing salons'),
    features: [
      L('Start planındakı hər şey', 'Всё из тарифа Start', 'Everything in Start'),
      soon(L('Gəlməmə qorunması və depozit', 'Защита от неявок и депозиты', 'No-show protection and deposits')),
      L('Müştərilərə xatırlatmalar', 'Напоминания клиентам', 'Reminders for clients'),
      soon(L('Gözləmə siyahısı', 'Лист ожидания', 'Waitlist')),
      soon(L('Statistika', 'Статистика', 'Statistics')),
    ],
  },
];

/** Unknown ids (a retired plan cached on the device) read as Pro, as the server migrated them. */
export const planById = (id: PlanId | string) => plans.find((p) => p.id === id) ?? plans[1];

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
