'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavGroup } from '@/lib/nav';

interface BottomItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  /** true = item "Lainnya" yang membuka popup menu lengkap. */
  more?: boolean;
}

export default function MobileBottomNav({
  items,
  moreGroups = [],
}: {
  items: BottomItem[];
  moreGroups?: NavGroup[];
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const allItems = moreGroups.flatMap((g) => g.items);

  return (
    <>
      {/* Popup "Lainnya" — daftar menu utama + ikon */}
      {moreOpen && allItems.length > 0 && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setMoreOpen(false)} aria-hidden />
          <div className="fixed inset-x-0 bottom-[4.5rem] z-50 mx-auto max-w-md px-3 lg:hidden" role="dialog" aria-label="Semua menu">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Semua Menu
                </span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  aria-label="Tutup menu"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {allItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-[10px] font-bold text-center transition ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className={`text-xl leading-none [&_svg]:w-6 [&_svg]:h-6 ${isActive ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {item.icon}
                      </span>
                      <span className="leading-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[60] bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 h-16">
          {items.map((item) => {
            const isActive = !item.more && !!item.href && (pathname === item.href || pathname.startsWith(item.href + '/'));
            const Comp: any = item.more ? 'button' : Link;
            const props = item.more
              ? { onClick: () => setMoreOpen((v) => !v), type: 'button', 'aria-haspopup': 'dialog' as const, 'aria-expanded': moreOpen }
              : { href: item.href };
            return (
              <Comp
                key={item.label}
                {...props}
                className={`relative flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-bold transition ${
                  isActive ? 'text-emerald-700' : 'text-slate-400 hover:text-emerald-700'
                }`}
              >
                {isActive && <span className="absolute top-0 w-8 h-0.5 rounded-b bg-emerald-700" />}
                <span className={`text-xl leading-none ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="leading-none">{item.label}</span>
              </Comp>
            );
          })}
        </div>
        {/* Safe-area untuk iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white lg:hidden" />
      </nav>
    </>
  );
}

// Ikon inline konsisten (tema stroke, bezel 2)
const S = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
  viewBox: '0 0 24 24',
};

export const bottomIcons = {
  home: (
    <svg className="w-6 h-6" {...S}>
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
    </svg>
  ),
  clipboard: (
    <svg className="w-6 h-6" {...S}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  envelope: (
    <svg className="w-6 h-6" {...S}>
      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  report: (
    <svg className="w-6 h-6" {...S}>
      <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  grid: (
    <svg className="w-6 h-6" {...S}>
      <path d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  card: (
    <svg className="w-6 h-6" {...S}>
      <path d="M3 10h18M7 15h2m-2 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  camera: (
    <svg className="w-6 h-6" {...S}>
      <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  history: (
    <svg className="w-6 h-6" {...S}>
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  plus: (
    <svg className="w-6 h-6" {...S}>
      <path d="M12 4v16m8-8H4" />
    </svg>
  ),
  book: (
    <svg className="w-6 h-6" {...S}>
      <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
};