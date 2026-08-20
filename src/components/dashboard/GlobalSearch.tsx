'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

interface SearchHit {
  id: number;
  full_name: string;
  identifier: string;
  class_name?: string;
  subject_specialty?: string;
}

/**
 * Search Bar global di header — mencari siswa & guru secara realtime.
 * Hanya tersedia untuk admin: hasil pencarian (siswa/guru) diarahkan ke
 * halaman kelola yang memang khusus admin.
 */
export default function GlobalSearch({ role = 'admin' }: { role?: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<SearchHit[]>([]);
  const [teachers, setTeachers] = useState<SearchHit[]>([]);
  const elRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      reqId.current++;
      setStudents([]);
      setTeachers([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    const id = ++reqId.current;
    setLoading(true);
    clearTimeout(timer.current!);
    timer.current = setTimeout(async () => {
      try {
        const res: any = await fetchAPI(`/api/search?q=${encodeURIComponent(term)}`, { silent: true });
        if (id !== reqId.current) return;
        if (!res?.success) {
          setStudents([]);
          setTeachers([]);
          setLoading(false);
          return;
        }
        setStudents(Array.isArray(res.students) ? res.students : []);
        setTeachers(Array.isArray(res.teachers) ? res.teachers : []);
        setOpen(true);
        setLoading(false);
      } catch (e) {
        if (id !== reqId.current) return;
        setStudents([]);
        setTeachers([]);
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer.current!);
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (elRef.current && !elRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Pencarian hanya diarahkan ke halaman admin; selain admin disembunyikan.
  if (role !== 'admin') return null;

  const submit = (href: string) => {
    setOpen(false);
    setQ(href.split('=')[1] || '');
    router.push(href);
  };

  const Row = ({ hit, kind }: { hit: SearchHit; kind: 'siswa' | 'guru' }) => (
    <button
      type="button"
      onClick={() => submit(kind === 'siswa' ? `/admin/students?search=${encodeURIComponent(hit.full_name)}` : `/admin/teachers?search=${encodeURIComponent(hit.full_name)}`)}
      className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-emerald-50 dark:hover:bg-slate-700 transition"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${kind === 'siswa' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
        {(hit.full_name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{hit.full_name}</p>
        <p className="text-[11px] text-slate-400 truncate">
          <span className="font-mono">{hit.identifier}</span>
          {hit.class_name || hit.subject_specialty ? ` • ${hit.class_name || hit.subject_specialty}` : ''}
        </p>
      </div>
      <span className="ml-auto text-[10px] font-bold uppercase text-slate-300 dark:text-slate-500 shrink-0">{kind}</span>
    </button>
  );

  return (
    <div ref={elRef} className="relative">
      <div className="flex items-center gap-2 bg-white/95 dark:bg-slate-800 border border-white/30 dark:border-slate-600 focus-within:ring-2 ring-emerald-300 px-3 py-1.5 rounded-lg h-9 w-44 sm:w-56 lg:w-64 xl:w-72 transition">
        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q.trim().length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && q.trim().length >= 2) {
              submit(`/admin/students?search=${encodeURIComponent(q.trim())}`);
            }
          }}
          placeholder="Cari siswa / guru..."
          aria-label="Pencarian global siswa dan guru"
          className="bg-transparent outline-none w-full text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
        {loading && (
          <svg className="w-4 h-4 text-emerald-500 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50">
          {students.length === 0 && teachers.length === 0 ? (
            <div className="px-4 py-4 text-xs text-slate-400 text-center">
              {loading ? 'Mencari...' : 'Tidak ada hasil untuk pencarian ini.'}
            </div>
          ) : (
            <>
              {students.length > 0 && (
                <div>
                  <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase text-slate-400">Siswa</p>
                  <div className="space-y-0.5">{students.map((s) => <Row key={`s${s.id}`} hit={s} kind="siswa" />)}</div>
                </div>
              )}
              {teachers.length > 0 && (
                <div className="mt-1 border-t border-slate-100 dark:border-slate-700">
                  <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase text-slate-400">Guru</p>
                  <div className="space-y-0.5">{teachers.map((t) => <Row key={`t${t.id}`} hit={t} kind="guru" />)}</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}