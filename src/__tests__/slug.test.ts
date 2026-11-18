import { cleanSlugInput, isValidSlug, slugify } from '@/lib/slug';

describe('page addresses', () => {
  it('turns names into addresses', () => {
    expect(slugify('Elvin Bərbər')).toBe('elvin-berber');
    expect(slugify('Leyla Məmmədova')).toBe('leyla-memmedova');
    expect(slugify('İlqar Şükürov')).toBe('ilqar-sukurov');
    expect(slugify('Салон Анна')).toBe('salon-anna');
    expect(slugify('  Nails & Brows!! ')).toBe('nails-brows');
  });

  it('keeps what can be typed', () => {
    expect(cleanSlugInput('Elvin ')).toBe('elvin-');
    expect(cleanSlugInput('ELVIN_barber')).toBe('elvin-barber');
  });

  it('validates', () => {
    expect(isValidSlug('elvin-berber')).toBe(true);
    expect(isValidSlug('el')).toBe(false);
    expect(isValidSlug('elvin-')).toBe(false);
    expect(isValidSlug('a'.repeat(31))).toBe(false);
  });
});
