'use client';

import { useState } from 'react';
import { useTheme } from './ThemeProvider';

const ICONS = {
  light: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  dark: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  system: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
};

export default function ThemeToggle() {
  const { theme, setTheme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Ganti Tema Tampilan"
        aria-label="Ganti Tema Tampilan"
        className="hidden sm:flex items-center gap-1.5 p-2 rounded-lg text-emerald-100 hover:bg-emerald-700 focus:outline-none transition"
      >
        {ICONS[theme]}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
            {(
              [
                ['light', 'Terang', ICONS.light],
                ['dark', 'Gelap', ICONS.dark],
                ['system', 'Ikut Sistem', ICONS.system],
              ] as const
            ).map(([key, label, icon]) => (
              <button
                key={key}
                onClick={() => {
                  setTheme(key);
                  setOpen(false);
                }}
                className={`flex items-center gap-2.5 px-4 py-2 w-full text-left text-sm transition ${
                  theme === key ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={theme === key ? 'text-emerald-600' : 'text-slate-400'}>{icon}</span>
                {label}
                {theme === key && (
                  <svg className="w-3.5 h-3.5 ml-auto text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function MobileThemeToggle() {
  const { resolved, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      title="Ganti Tema"
      aria-label="Ganti Tema"
      className="lg:hidden p-2 rounded-lg text-emerald-100 hover:bg-emerald-700 focus:outline-none transition"
    >
      {resolved === 'dark' ? ICONS.dark : ICONS.light}
    </button>
  );
}