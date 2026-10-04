export type Locale = 'az' | 'ru' | 'en';
export const LOCALES: Locale[] = ['az', 'ru', 'en'];

/** A string in every supported language. */
export type Loc = Record<Locale, string>;

export const localeNames: Record<Locale, string> = { az: 'Azərbaycanca', ru: 'Русский', en: 'English' };
