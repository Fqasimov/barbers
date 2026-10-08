import type { Loc } from '@/i18n/types';

import type { PlanId } from './types';

export const TRIAL_DAYS = 30;

const L = (az: string, ru: string, en: string): Loc => ({ az, ru, en });

/** Every plan includes every master: adding staff never changes the price. */
const unlimitedMasters = L(
  'Limitsiz usta, əlavə ödəniş yoxdur',
  'Мастера без ограничений и доплат',
  'Unlimited masters, no per-seat fees',
);

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in AZN after the trial. */
  price: number;
  blurb: Loc;
  features: Loc[];
  recommended?: boolean;
};

export const plans: Plan[] = [
  {
    id: 'start',
    name: 'Start',
    price: 29,
    blurb: L('Kiçik salon və studiyalar', 'Небольшие салоны и студии', 'Small salons and studios'),
    features: [
      unlimitedMasters,
      L('Onlayn növbə və təqvim', 'Онлайн-запись и календарь', 'Online booking and calendar'),
      L('WhatsApp ilə təsdiq', 'Подтверждение в WhatsApp', 'WhatsApp confirmations'),
      L('Rəylərə cavab', 'Ответы на отзывы', 'Reply to reviews'),
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    recommended: true,
    blurb: L('Böyüyən salonlar üçün', 'Для растущих салонов', 'For growing salons'),
    features: [
      unlimitedMasters,
      L('Start planındakı hər şey', 'Всё из тарифа Start', 'Everything in Start'),
      L('Gəlməmə qorunması və depozit', 'Защита от неявок и депозит', 'No-show protection and deposits'),
      L('Xatırlatmalar və gözləmə siyahısı', 'Напоминания и лист ожидания', 'Reminders and waitlist'),
      L('Statistika', 'Статистика', 'Insights'),
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    price: 99,
    blurb: L(
      'Bir neçə filial və böyük komandalar',
      'Несколько филиалов и большие команды',
      'Several branches and large teams',
    ),
    features: [
      unlimitedMasters,
      L('Pro planındakı hər şey', 'Всё из тарифа Pro', 'Everything in Pro'),
      L('Limitsiz filial', 'Филиалы без ограничений', 'Unlimited branches'),
      L('Axtarışda önə çıxma', 'Продвижение в поиске', 'Featured placement in search'),
      L('Şəxsi menecer', 'Персональный менеджер', 'Dedicated account manager'),
    ],
  },
];

export const planById = (id: PlanId) => plans.find((p) => p.id === id)!;
