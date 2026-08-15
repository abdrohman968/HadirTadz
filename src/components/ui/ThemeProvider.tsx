'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'hadirtadz-theme';

interface ThemeCtx {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: 'system',
  resolved: 'light',
  setTheme: () => {},
  toggle: () => {},
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const resolve = () => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', theme === 'dark' || (theme === 'system' && dark));
  };
  resolve();
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', resolve);
  return () => mq.removeEventListener('change', resolve);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('light');
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
    setThemeState(saved);
    cleanupRef.current = applyTheme(saved);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const updateResolved = () => setResolved(mq.matches ? 'dark' : 'light');
    updateResolved();
    mq.addEventListener('change', updateResolved);
    return () => {
      cleanupRef.current?.();
      mq.removeEventListener('change', updateResolved);
    };
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = applyTheme(t);
    setResolved(word(t));
  };

  const toggle = () => setTheme(resolved === 'dark' ? 'light' : 'dark');

  return <Ctx.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</Ctx.Provider>;
}

function word(t: Theme): 'light' | 'dark' {
  if (t === 'light') return 'light';
  if (t === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useTheme() {
  return useContext(Ctx);
}

// Non-hook access untuk permukaan non-React / helper
export const themeStorageKey = STORAGE_KEY;