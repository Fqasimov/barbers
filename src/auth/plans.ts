import type { Loc } from '@/i18n/types';

import type { PlanId } from './types';

export const TRIAL_DAYS = 30;

const L = (az: string, ru: string, en: string): Loc => ({ az, ru, en });

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
    blurb: L('Tək usta və ya kiçik studiya', 'Один мастер или маленькая студия', 'A single master or a small studio'),
    features: [
      L('2 usta', '2 мастера', '2 masters'),
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
      L('8 usta', '8 мастеров', '8 masters'),
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
      L('Limitsiz usta və filial', 'Без ограничений мастеров и филиалов', 'Unlimited masters and branches'),
      L('Pro planındakı hər şey', 'Всё из тарифа Pro', 'Everything in Pro'),
      L('Axtarışda önə çıxma', 'Продвижение в поиске', 'Featured placement in search'),
      L('Şəxsi menecer', 'Персональный менеджер', 'Dedicated account manager'),
    ],
  },
];

export const planById = (id: PlanId) => plans.find((p) => p.id === id)!;
