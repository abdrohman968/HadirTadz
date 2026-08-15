'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchAPI } from '@/lib/api';

/**
 * Lonceng Notifikasi (Navbar).
 * Badge menampilkan jumlah pemberitahuan absen masuk hari ini
 * (dihitung dari statistik kehadiran /api/stats).
 */
export default function NotificationBell({ href = '/admin/attendance' }: { href?: string }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const res: any = await fetchAPI('/api/stats', { silent: true });
      if (!mounted || !Array.isArray(res?.series) || !res.series.length) return;
      const dataArr: any = res.series[0]?.data;
      const idx = Array.isArray(dataArr) ? dataArr.length - 1 : -1;
      if (idx < 0) return;
      const total = res.series
        .filter((s: any) => s?.name === 'Tepat Waktu' || s?.name === 'Terlambat')
        .reduce((acc: number, s: any) => acc + (Number(s?.data?.[idx]) || 0), 0);
      setCount(total);
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Pemberitahuan absen masuk${count > 0 ? ` (${count})` : ''}`}
        aria-expanded={open}
        className="relative p-2 rounded-lg text-emerald-100 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 text-slate-700 dark:text-slate-200">
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Pemberitahuan Absen Masuk</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {count > 0 ? `${count} kehadiran masuk tercatat hari ini.` : 'Belum ada kehadiran masuk hari ini.'}
              </p>
            </div>
            <Link
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 w-full text-left text-sm text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Lihat presensi hari ini</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}