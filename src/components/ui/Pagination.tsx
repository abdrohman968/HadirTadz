'use client';

import { useMemo, useState } from 'react';

export const PAGE_SIZES = [10, 25, 50, 100];

export type SortDir = 'asc' | 'desc';

interface PaginationOptions<T> {
  data: T[];
  pageSize: number;
  page: number;
  sortKey?: keyof T | string | null;
  sortDir?: SortDir;
}

/** Bandingkan dua nilai untuk pengurutan (tanggal string, angka, teks). */
export function compareValues(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const aStr = String(a ?? '');
  const bStr = String(b ?? '');
  const aNum = Number(aStr);
  const bNum = Number(bStr);
  const isNum = aStr !== '' && bStr !== '' && !Number.isNaN(aNum) && !Number.isNaN(bNum);
  if (isNum) return aNum - bNum;
  return aStr.localeCompare(bStr, 'id', { numeric: true, sensitivity: 'base' });
}

export function usePagination<T>({ data, pageSize, page, sortKey, sortDir }: PaginationOptions<T>) {
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    const dir = sortDir === 'desc' ? -1 : 1;
    return [...data].sort((a, b) => compareValues(a[sortKey as keyof T], b[sortKey as keyof T]) * dir);
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  return { pageData, safePage, totalPages, totalItems: sorted.length, sorted };
}

/**
 * Kolom tabel yang bisa diklik untuk mengurutkan (asc/desc) — DEVELOPMENT_RULES #7.
 * State sortKey/sortDir dipegang pemanggil & diteruskan ke usePagination.
 */
export function SortableTh({
  label,
  sortKey,
  activeKey,
  dir,
  onSort,
  className = '',
}: {
  label: string;
  sortKey: string;
  activeKey: string | null;
  dir: SortDir;
  onSort: (key: string) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  return (
    <th className={`py-3 px-4 ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-400 transition group"
        aria-label={`Urutkan ${label}`}
      >
        <span>{label}</span>
        <span className={`text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
          {active ? (dir === 'asc' ? '\u2191' : '\u2193') : '\u2195'}
        </span>
      </button>
    </th>
  );
}

/** Hook kecil untuk mengelola sortKey + sortDir di sisi pemanggil. */
export function useSortable() {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function toggle(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  return { sortKey, sortDir, toggle };
}

export default function Pagination({
  page,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const range = Math.min(totalPages, 5);
  const start = Math.min(Math.max(page - Math.floor(range / 2), 0), Math.max(totalPages - range, 0));
  const visible = pages.slice(start, start + range);
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 no-print">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <span>
          Menampilkan <b className="text-slate-700 dark:text-slate-200">{from}</b>–<b className="text-slate-700 dark:text-slate-200">{to}</b> dari{' '}
          <b className="text-slate-700 dark:text-slate-200">{totalItems}</b>
        </span>
        <span className="text-slate-300 dark:text-slate-600">|</span>
        <label className="flex items-center gap-1.5">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-1.5 py-1 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s} baris
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          &larr; Sebelum
        </button>
        {visible.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
              p === page
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          Berikut &rarr;
        </button>
      </div>
    </div>
  );
}