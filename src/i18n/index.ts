import { getLocales } from 'expo-localization';
import { useMemo } from 'react';

import { useStore } from '@/store/useStore';

import { cal, plural } from './calendar';
import { forms, strings, type FormKey, type StringKey } from './strings';
import type { Loc, Locale } from './types';

export type { Loc, Locale } from './types';
export { LOCALES, localeNames } from './types';

/** Device language if we support it; Azerbaijani otherwise (Baku-first). */
export function deviceLocale(): Locale {
  try {
    const code = getLocales()[0]?.languageCode;
    if (code === 'ru' || code === 'en' || code === 'az') return code;
  } catch {
    // Fall through to the default.
  }
  return 'az';
}

const DAY = 86_400_000;
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export function makeI18n(locale: Locale) {
  const t = (key: StringKey, vars?: Record<string, string | number>) => {
    let s: string = strings[key][locale];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const tx = (loc: Loc | undefined) => (loc ? (loc[locale] ?? loc.en) : '');
  const n = (count: number, form: FormKey) => plural(locale, count, forms[form][locale] as unknown as string[]);
  const decimal = (x: number, digits = 1) =>
    locale === 'en' ? x.toFixed(digits) : x.toFixed(digits).replace('.', ',');

  /** Manat after the amount in az/ru ("30 ₼"), before it in English ("₼30"). */
  const price = (amount: number) => (locale === 'en' ? `₼${Math.round(amount)}` : `${Math.round(amount)} ₼`);
  const fromPrice = (amount: number) =>
    ({ az: `${Math.round(amount)} ₼-dan`, ru: `от ${Math.round(amount)} ₼`, en: `from ₼${Math.round(amount)}` })[
      locale
    ];
  /** Rounded down — a 4.95 never reads as a perfect 5.0. */
  const rating = (r: number) => decimal(Math.floor(r * 10 + 1e-6) / 10);
  const distance = (km: number) => {
    const m = locale === 'ru' ? 'м' : 'm';
    const k = locale === 'ru' ? 'км' : 'km';
    if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} ${m}`;
    return `${km < 10 ? decimal(km) : Math.round(km)} ${k}`;
  };
  const duration = (min: number) => {
    const ms = strings.minShort[locale];
    const hs = strings.hourShort[locale];
    if (min < 60) return `${min} ${ms}`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} ${hs} ${m} ${ms}` : `${h} ${hs}`;
  };
  const relativeDay = (d: Date, now = new Date()) => {
    const diff = Math.round((startOfDay(d).getTime() - startOfDay(now).getTime()) / DAY);
    if (diff === 0) return t('today');
    if (diff === 1) return t('tomorrow');
    if (diff === -1) return t('yesterday');
    return cal.shortDate(locale, d);
  };
  const timeAgo = (iso: string, now = new Date()) => {
    const days = Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
    const ago = (count: number, unit: 'd' | 'w' | 'm') => {
      const f = {
        d: { az: ['gün'], ru: ['день', 'дня', 'дней'], en: ['day', 'days'] },
        w: { az: ['həftə'], ru: ['неделю', 'недели', 'недель'], en: ['week', 'weeks'] },
        m: { az: ['ay'], ru: ['месяц', 'месяца', 'месяцев'], en: ['month', 'months'] },
      }[unit][locale];
      const p = plural(locale, count, f);
      return locale === 'az' ? `${p} əvvəl` : locale === 'ru' ? `${p} назад` : `${p} ago`;
    };
    if (days <= 0) return t('today');
    if (days === 1) return t('yesterday');
    if (days < 7) return ago(days, 'd');
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return ago(weeks, 'w');
    return ago(Math.max(1, Math.floor(days / 30)), 'm');
  };
  const greeting = (now = new Date()) => {
    const h = now.getHours();
    if (h < 5) return t('goodNight');
    if (h < 12) return t('goodMorning');
    if (h < 18) return t('goodAfternoon');
    return t('goodEvening');
  };
  const ratingWord = (r: number) =>
    t(r >= 5 ? 'rating5' : r >= 4 ? 'rating4' : r >= 3 ? 'rating3' : r >= 2 ? 'rating2' : 'rating1');

  return {
    locale,
    t,
    tx,
    n,
    decimal,
    price,
    fromPrice,
    rating,
    distance,
    duration,
    relativeDay,
    timeAgo,
    greeting,
    ratingWord,
    weekdayShort: (d: Date) => cal.weekdayShort(locale, d),
    weekdayLong: (d: Date) => cal.weekdayLong(locale, d),
    monthShort: (d: Date) => cal.monthShort(locale, d),
    fullDate: (d: Date) => cal.fullDate(locale, d),
    shortDate: (d: Date) => cal.shortDate(locale, d),
  };
}

export type I18n = ReturnType<typeof makeI18n>;

export function useLocale(): Locale {
  const preferred = useStore((s) => s.locale);
  return preferred ?? deviceLocale();
}

export function useI18n(): I18n {
  const locale = useLocale();
  return useMemo(() => makeI18n(locale), [locale]);
}
