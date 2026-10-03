import type { CategoryId, PriceLevel } from './types';

export type Category = { id: CategoryId; label: string; plural: string };

export const categories: Category[] = [
  { id: 'barber', label: 'Barber', plural: 'Barbershops' },
  { id: 'hair', label: 'Hair', plural: 'Hair studios' },
  { id: 'nails', label: 'Nails', plural: 'Nail studios' },
  { id: 'brows', label: 'Brows & lashes', plural: 'Brow bars' },
  { id: 'spa', label: 'Spa', plural: 'Spas' },
  { id: 'makeup', label: 'Makeup', plural: 'Makeup artists' },
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategoryId, Category>;

export const priceLevels: { level: PriceLevel; label: string; hint: string }[] = [
  { level: 1, label: '₼', hint: 'Everyday' },
  { level: 2, label: '₼₼', hint: 'Mid-range' },
  { level: 3, label: '₼₼₼', hint: 'Premium' },
];

export const priceLabel = (level: PriceLevel) => '₼'.repeat(level);
