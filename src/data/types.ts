import type { ToneName } from '@/theme/tokens';

export type CategoryId = 'barber' | 'hair' | 'nails' | 'brows' | 'spa' | 'makeup';

export type Coords = { latitude: number; longitude: number };

export type PriceLevel = 1 | 2 | 3;

export type Motif = 'stripes' | 'arcs' | 'grid' | 'waves' | 'rays' | 'dots';

export type Service = {
  id: string;
  name: string;
  category: CategoryId;
  durationMin: number;
  price: number;
  description?: string;
};

export type Master = {
  id: string;
  name: string;
  role: string;
  years: number;
  rating: number;
  reviewCount: number;
  /** Service ids this master performs. */
  serviceIds: string[];
  /** 0 = Sunday … 6 = Saturday. */
  workDays: number[];
  shift: { start: string; end: string };
  tone: ToneName;
};

export type Salon = {
  id: string;
  name: string;
  kind: string;
  categories: CategoryId[];
  tagline: string;
  about: string;
  address: string;
  district: string;
  coords: Coords;
  priceLevel: PriceLevel;
  tone: ToneName;
  motif: Motif;
  /** Aggregate from the platform before this device's reviews. */
  rating: number;
  reviewCount: number;
  /** Rating distribution (5★ → 1★) as fractions that sum to 1. */
  distribution: [number, number, number, number, number];
  hours: { open: string; close: string };
  closedDays: number[];
  phone: string;
  amenities: string[];
  services: Service[];
  masters: Master[];
  /** Optional remote photo — covers fall back to generated art. */
  imageUrl?: string;
};

export type Review = {
  id: string;
  salonId: string;
  masterId?: string;
  author: string;
  rating: number;
  text: string;
  /** ISO date. */
  date: string;
  serviceName?: string;
  tags?: string[];
  mine?: boolean;
};

export type BookingStatus = 'upcoming' | 'cancelled';

export type Booking = {
  id: string;
  salonId: string;
  masterId: string;
  serviceIds: string[];
  /** ISO datetime of the start. */
  start: string;
  durationMin: number;
  total: number;
  note?: string;
  status: BookingStatus;
  createdAt: string;
  reviewed?: boolean;
};
