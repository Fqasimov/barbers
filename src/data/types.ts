import type { Loc } from '@/i18n/types';
import type { ToneName } from '@/theme/tokens';

export type CategoryId = 'barber' | 'hair' | 'nails' | 'brows' | 'spa' | 'makeup';

export type Coords = { latitude: number; longitude: number };

export type PriceLevel = 1 | 2 | 3;

export type Language = 'az' | 'ru' | 'en' | 'tr';

export type Service = {
  id: string;
  /** Catalogue key shared across venues ("fade"), used by city-wide search. */
  key: string;
  name: Loc;
  category: CategoryId;
  durationMin: number;
  price: number;
  description?: Loc;
};

export type Master = {
  id: string;
  name: string;
  role: Loc;
  years: number;
  rating: number;
  reviewCount: number;
  /** Service ids this master performs. */
  serviceIds: string[];
  /** 0 = Sunday … 6 = Saturday. */
  workDays: number[];
  shift: { start: string; end: string };
  tone: ToneName;
  languages: Language[];
};

export type Salon = {
  id: string;
  name: string;
  kind: Loc;
  categories: CategoryId[];
  tagline: Loc;
  about: Loc;
  address: string;
  district: string;
  coords: Coords;
  priceLevel: PriceLevel;
  tone: ToneName;
  /** Aggregate from the platform before this device's reviews. */
  rating: number;
  reviewCount: number;
  /** Rating distribution (5★ → 1★) as fractions that sum to 1. */
  distribution: [number, number, number, number, number];
  hours: { open: string; close: string };
  closedDays: number[];
  phone: string;
  /** WhatsApp number in international format, digits only. */
  whatsapp: string;
  womenOnly?: boolean;
  amenities: Loc[];
  services: Service[];
  masters: Master[];
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
  serviceName?: Loc;
  tags?: string[];
  mine?: boolean;
  /** Every review is tied to a completed visit. */
  bookingId?: string;
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
