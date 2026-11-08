import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useStore } from '@/store/useStore';

import { isSite, palettes, type Palette, type Scheme } from './tokens';

type ThemeValue = { c: Palette; scheme: Scheme };

const ThemeContext = createContext<ThemeValue>({ c: palettes.light, scheme: 'light' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const appearance = useStore((s) => s.appearance);
  // The website has no dark mode, so the panel in a browser is always light.
  const scheme: Scheme = isSite ? 'light' : appearance === 'system' ? (system === 'dark' ? 'dark' : 'light') : appearance;
  const value = useMemo(() => ({ c: palettes[scheme], scheme }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
