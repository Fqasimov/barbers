import type { Coords } from '@/data/types';

/** Fountain Square — the default origin when location is unavailable. */
export const BAKU_CENTER: Coords = { latitude: 40.3719, longitude: 49.8372 };

const R = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in kilometres. */
export function distanceKm(a: Coords, b: Coords): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function fmtDistance(km: number): string {
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Rough walking time at ~4.8 km/h. */
export function walkMinutes(km: number): number {
  return Math.max(1, Math.round((km / 4.8) * 60));
}

export function boundsOf(points: Coords[]) {
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };
}
