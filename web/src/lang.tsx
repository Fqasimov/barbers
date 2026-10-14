import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { dict, LANGS, type Key, type Lang, type Loc } from './i18n';

const STORAGE = 'usta-lang';

function initialLang(): Lang {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (fromUrl && (LANGS as readonly string[]).includes(fromUrl)) return fromUrl as Lang;
  try {
    const saved = localStorage.getItem(STORAGE);
    if (saved && (LANGS as readonly string[]).includes(saved)) return saved as Lang;
  } catch {
    // Storage can be blocked; fall through to the browser language.
  }
  const nav = (navigator.language || 'az').slice(0, 2);
  return nav === 'ru' || nav === 'en' ? nav : 'az';
}

type Vars = Record<string, string | number>;
const fill = (s: string, vars?: Vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`)) : s);

type I18n = {
  lang: Lang;
  /** BCP 47 locale for Intl formatting. */
  locale: string;
  setLang: (l: Lang) => void;
  t: (key: Key, vars?: Vars) => string;
  tx: (loc: Partial<Loc> | null | undefined) => string;
  num: (n: number, digits?: number) => string;
};

const Ctx = createContext<I18n | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE, l);
    } catch {
      // Not remembered; fine.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = dict.metaTitle[lang];
    document.querySelector('meta[name="description"]')?.setAttribute('content', dict.metaDesc[lang]);
  }, [lang]);

  const value = useMemo<I18n>(() => {
    const locale = lang === 'az' ? 'az-Latn-AZ' : lang === 'ru' ? 'ru-RU' : 'en-GB';
    return {
      lang,
      locale,
      setLang,
      t: (key, vars) => fill(dict[key][lang], vars),
      tx: (loc) => (loc ? (loc[lang] ?? loc.az ?? loc.en ?? '') : ''),
      num: (n, digits = 0) =>
        new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n),
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside LangProvider');
  return v;
}
