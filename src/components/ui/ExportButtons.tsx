'use client';

import { useState } from 'react';
import { exportXLS, exportPDF, type ExportColumn } from '@/lib/export';

/**
 * Tombol ekspor XLS / PDF untuk tabel CRUD & laporan (DEVELOPMENT_RULES #8).
 */
export default function ExportButtons({
  filename,
  title,
  subtitle,
  columns,
  rows,
  compact = false,
}: {
  filename: string;
  title: string;
  subtitle: string;
  columns: ExportColumn[];
  rows: any[];
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const btn = compact
    ? 'relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs transition'
    : 'relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs shadow-sm transition';

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={btn} title="Ekspor data">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Ekspor</span>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-50">
            <button
              type="button"
              onClick={() => {
                exportXLS(filename, title, columns, rows);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 w-full text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 12m4 4V4" />
              </svg>
              <span className="font-semibold">Excel (.xls)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                exportPDF(filename, title, subtitle, columns, rows);
                setOpen(false);
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 w-full text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 transition"
            >
              <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-semibold">PDF</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}