'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import { inputCls } from '@/components/ui/Modal';

interface ClassRow {
  id: number;
  class_name: string;
  major: string | null;
}
interface StudentRow {
  id: number;
  user_id: number;
  full_name: string;
  nisn: string;
  gender: string;
  identifier: string;
  attendance_id: number | null;
  attendance_status: string | null;
}

const STATUSES = [
  { code: 'HADIR', label: 'Hadir', on: 'peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600' },
  { code: 'TERLAMBAT', label: 'Terlambat', on: 'peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500' },
  { code: 'IZIN', label: 'Izin', on: 'peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600' },
  { code: 'SAKIT', label: 'Sakit', on: 'peer-checked:bg-purple-600 peer-checked:text-white peer-checked:border-purple-600' },
  { code: 'ALPHA', label: 'Alpha', on: 'peer-checked:bg-rose-600 peer-checked:text-white peer-checked:border-rose-600' },
];

export default function ClassAttendanceEditor({
  classes,
  students,
  filterClass,
  filterDate,
  defaultClass,
}: {
  classes: ClassRow[];
  students: StudentRow[];
  filterClass: string;
  filterDate: string;
  defaultClass: string;
}) {
  const router = useRouter();
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(
      students.map((s) => [String(s.user_id), s.attendance_status || 'HADIR'])
    )
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  function setAll(status: string) {
    const next: Record<string, string> = {};
    students.forEach((s) => {
      next[String(s.user_id)] = status;
    });
    setStatuses(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!defaultClass) return;
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/guru/class-attendance', {
      method: 'POST',
      body: JSON.stringify({ class_id: defaultClass, date: filterDate, statuses }),
    });
    setBusy(false);
    setMsg({ type: res.success ? 'success' : 'error', text: res.message || (res.success ? 'Berhasil' : 'Gagal') });
    if (res.success) {
      router.refresh();
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Presensi Siswa di Kelas</h1>
          <p className="text-xs sm:text-sm text-slate-500">Catat dan perbarui absensi kehadiran seluruh siswa dalam satu kelas per pertemuan.</p>
        </div>
        <Link href="/guru/jurnal" className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2 self-start">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <span>Tulis Jurnal Pembelajaran</span>
        </Link>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
        <form method="GET" action="/guru/kelas" className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Pilih Kelas</label>
            <select name="class_id" defaultValue={filterClass || defaultClass} className={inputCls}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name} ({c.major})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Tanggal Absensi</label>
            <input type="date" name="date" defaultValue={filterDate} className={inputCls} />
          </div>
          <div>
            <button type="submit" className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition">
              Buka Daftar Siswa
            </button>
          </div>
        </form>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Siswa: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{students.length}</strong> Orang
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">Pilih status kehadiran untuk setiap siswa di bawah</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setAll('HADIR')} className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition">
                Semua Hadir
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Lengkap Siswa</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4 text-center">Pilihan Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400 dark:text-slate-500">
                      Tidak ada data siswa dalam kelas ini.
                    </td>
                  </tr>
                ) : (
                  students.map((s, i) => (
                    <tr key={s.user_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">{i + 1}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{s.full_name}</div>
                        <div className="text-[10px] text-slate-400">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{s.nisn}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {STATUSES.map((st) => (
                            <label key={st.code} className="cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${s.user_id}`}
                                value={st.code}
                                checked={statuses[String(s.user_id)] === st.code}
                                onChange={() => setStatuses({ ...statuses, [String(s.user_id)]: st.code })}
                                className="peer sr-only"
                              />
                              <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${st.on} bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600`}>
                                {st.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {students.length > 0 && (
            <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button type="submit" disabled={busy} className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition flex items-center gap-2 disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                <span>{busy ? 'Menyimpan...' : 'Simpan Presensi Kelas'}</span>
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}