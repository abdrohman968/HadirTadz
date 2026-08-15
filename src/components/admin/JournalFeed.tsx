'use client';

import Link from 'next/link';
import { statusBadge } from '@/lib/format';

export interface Journal {
  id: number;
  teacher_user_id: number;
  class_id: number;
  date: string;
  time: string | null;
  subject: string;
  topic: string;
  present_count: number;
  absent_count: number;
  notes: string | null;
  created_at: string;
  teacher_name: string;
  teacher_nip: string;
  class_name: string;
}

export interface ClassRow {
  id: number;
  class_name: string;
}

export default function JournalFeed({
  journals,
  classes,
  filterClass,
  filterDate,
}: {
  journals: Journal[];
  classes: ClassRow[];
  filterClass: string;
  filterDate: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Jurnal Mengajar Guru</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Monitoring catatan kegiatan belajar mengajar, materi yang diajarkan, dan kehadiran siswa di kelas.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <form method="GET" action="/admin/journals" className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter Kelas</label>
            <select name="class_id" defaultValue={filterClass} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="">-- Semua Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal Kegiatan</label>
            <input type="date" name="date" defaultValue={filterDate} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition">
              Filter
            </button>
            <Link href="/admin/journals" className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition">
              Reset
            </Link>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {journals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400">
            Belum ada rekaman jurnal pembelajaran yang sesuai filter.
          </div>
        ) : (
          journals.map((j) => (
            <div key={j.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">{j.subject}</h3>
                    <p className="text-xs text-slate-500">
                      Oleh <strong className="text-slate-700">{j.teacher_name}</strong> &bull; Kelas {j.class_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {formatDateIndoShort(j.date)}
                  </span>
                  <span className="font-mono text-slate-500">{j.time || '-'}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">Materi Pokok / Bahasan:</span>
                  <p className="text-slate-800 text-sm font-medium mt-0.5 leading-relaxed whitespace-pre-line">{j.topic}</p>
                </div>

                {j.notes && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-600">
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">Catatan Kejadian di Kelas:</span>
                    <span className="whitespace-pre-line">{j.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {j.present_count} Siswa Hadir
                  </span>
                  {j.absent_count > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold">
                      {j.absent_count} Siswa Tidak Hadir
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">Dicatat: {formatDateTime(j.created_at)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatDateIndoShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr || '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateTime(v: string | null): string {
  if (!v) return '-';
  // Datetime MySQL disimpan dalam WIB (server local); tampilkan apa adanya.
  const [datePart, timePart] = v.replace('T', ' ').split(' ');
  const [y, m, d] = (datePart || '').split('-');
  const [hh, mm] = (timePart || '').split(':');
  if (!y || !m || !d) return String(v);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} ${hh || '00'}:${mm || '00'}`;
}