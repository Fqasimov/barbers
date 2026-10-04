import type { Loc } from '@/i18n/types';

import type { CategoryId, PriceLevel } from './types';

export type Category = { id: CategoryId; label: Loc; plural: Loc };

export const categories: Category[] = [
  {
    id: 'barber',
    label: { az: 'Bərbər', ru: 'Барбер', en: 'Barber' },
    plural: { az: 'Bərbərxanalar', ru: 'Барбершопы', en: 'Barbershops' },
  },
  {
    id: 'hair',
    label: { az: 'Saç', ru: 'Волосы', en: 'Hair' },
    plural: { az: 'Saç studiyaları', ru: 'Парикмахерские', en: 'Hair studios' },
  },
  {
    id: 'nails',
    label: { az: 'Dırnaq', ru: 'Ногти', en: 'Nails' },
    plural: { az: 'Dırnaq studiyaları', ru: 'Ногтевые студии', en: 'Nail studios' },
  },
  {
    id: 'brows',
    label: { az: 'Qaş və kirpik', ru: 'Брови и ресницы', en: 'Brows & lashes' },
    plural: { az: 'Qaş studiyaları', ru: 'Студии бровей', en: 'Brow bars' },
  },
  {
    id: 'spa',
    label: { az: 'Spa', ru: 'Спа', en: 'Spa' },
    plural: { az: 'Spa mərkəzləri', ru: 'Спа-центры', en: 'Spas' },
  },
  {
    id: 'makeup',
    label: { az: 'Makiyaj', ru: 'Макияж', en: 'Makeup' },
    plural: { az: 'Makiyaj ustaları', ru: 'Визажисты', en: 'Makeup artists' },
  },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategoryId, Category>;

export const priceLevels: { level: PriceLevel; hint: Loc }[] = [
  { level: 1, hint: { az: 'Sərfəli', ru: 'Недорого', en: 'Everyday' } },
  { level: 2, hint: { az: 'Orta', ru: 'Средний', en: 'Mid-range' } },
  { level: 3, hint: { az: 'Premium', ru: 'Премиум', en: 'Premium' } },
];

export const priceLabel = (level: PriceLevel) => '₼'.repeat(level);
