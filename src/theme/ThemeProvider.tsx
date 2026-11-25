import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { useStore } from '@/store/useStore';

import { palettes, type Palette, type Scheme } from './tokens';

type ThemeValue = { c: Palette; scheme: Scheme };

const ThemeContext = createContext<ThemeValue>({ c: palettes.light, scheme: 'light' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const appearance = useStore((s) => s.appearance);
  // In a browser (the salon panel on the website) "system" follows the website, which is always
  // light; picking Dark in settings still works. Phones follow the system.
  const followSystem = Platform.OS !== 'web' && system === 'dark';
  const scheme: Scheme = appearance === 'system' ? (followSystem ? 'dark' : 'light') : appearance;
  const value = useMemo(() => ({ c: palettes[scheme], scheme }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
