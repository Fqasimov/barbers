/** "Elvin Bərbər" → "elvin-berber": a page address from a name (Azerbaijani and Russian letters too). */
const MAP: Record<string, string> = {
  ə: 'e',
  ı: 'i',
  ş: 's',
  ç: 'c',
  ğ: 'g',
  ö: 'o',
  ü: 'u',
  і: 'i',
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

export const SLUG_MAX = 30;

export function slugify(name: string): string {
  return name
    .replace(/İ/g, 'i')
    .toLowerCase()
    .split('')
    .map((ch) => MAP[ch] ?? ch)
    .join('')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/, '');
}

/** What the person typed, kept to what an address may hold (they can still type a hyphen at the end). */
export function cleanSlugInput(v: string): string {
  return (
    slugify(v + 'x')
      .slice(0, -1)
      .replace(/-x$/, '-') || ''
  );
}

export const isValidSlug = (s: string) => s.length >= 3 && s.length <= SLUG_MAX && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);
