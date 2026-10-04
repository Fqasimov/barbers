import type { Locale } from './types';

/**
 * Calendar words and grammar per language. Azerbaijani nouns stay singular
 * after numbers ("5 rəy"); Russian uses one / few / many.
 */
const weekdayShort: Record<Locale, string[]> = {
  az: ['B.', 'B.e.', 'Ç.a.', 'Ç.', 'C.a.', 'C.', 'Ş.'],
  ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
const weekdayLong: Record<Locale, string[]> = {
  az: ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'],
  ru: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const monthShort: Record<Locale, string[]> = {
  az: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avq', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};
/** Used after a day number: "5 oktyabr", "5 октября", "5 October". */
const monthLong: Record<Locale, string[]> = {
  az: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'],
  ru: [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

export const cal = {
  weekdayShort: (l: Locale, d: Date) => weekdayShort[l][d.getDay()],
  weekdayLong: (l: Locale, d: Date) => weekdayLong[l][d.getDay()],
  monthShort: (l: Locale, d: Date) => monthShort[l][d.getMonth()],
  /** "Monday, 5 October" / "Bazar ertəsi, 5 oktyabr" / "Понедельник, 5 октября". */
  fullDate: (l: Locale, d: Date) => `${weekdayLong[l][d.getDay()]}, ${d.getDate()} ${monthLong[l][d.getMonth()]}`,
  /** "Mon 5 Oct". */
  shortDate: (l: Locale, d: Date) => `${weekdayShort[l][d.getDay()]} ${d.getDate()} ${monthShort[l][d.getMonth()]}`,
};

/**
 * Plural forms: en [one, other]; ru [one, few, many]; az [form] (no agreement).
 * Returns "5 reviews" / "5 отзывов" / "5 rəy".
 */
export function plural(l: Locale, n: number, forms: string[]): string {
  let form = forms[0];
  if (l === 'en') form = n === 1 ? forms[0] : (forms[1] ?? forms[0]);
  if (l === 'ru') {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11) form = forms[0];
    else if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) form = forms[1] ?? forms[0];
    else form = forms[2] ?? forms[1] ?? forms[0];
  }
  return `${n} ${form}`;
}
