/** Prices are whole manat. Always render in the serif — Geist has no ₼ glyph. */
export const fmtPrice = (amount: number) => `₼${Math.round(amount)}`;

/** Rounded down — a 4.95 never reads as a perfect 5.0. */
export const fmtRating = (rating: number) => (Math.floor(rating * 10 + 1e-6) / 10).toFixed(1);

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0];

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

export function ratingWord(rating: number): string {
  if (rating >= 5) return 'Exceptional';
  if (rating >= 4) return 'Very good';
  if (rating >= 3) return 'Good';
  if (rating >= 2) return 'Disappointing';
  return 'Poor';
}
