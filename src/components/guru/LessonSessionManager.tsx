'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import { inputCls } from '@/components/ui/Modal';

interface ClassRow {
  id: number;
  class_name: string;
  major: string | null;
}
interface TeacherRow {
  id: number;
  user_id: number;
  full_name: string;
  subject_specialty: string | null;
}
interface SessionRow {
  id: number;
  class_id: number;
  subject: string;
  topic: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  class_name: string;
}
interface StudentRow {
  id: number;
  user_id: number;
  full_name: string;
  nisn: string;
  gender: string;
  identifier: string;
}

const STATUSES = [
  { code: 'HADIR', label: 'Hadir', on: 'peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:border-emerald-600' },
  { code: 'TERLAMBAT', label: 'Terlambat', on: 'peer-checked:bg-amber-500 peer-checked:text-white peer-checked:border-amber-500' },
  { code: 'IZIN', label: 'Izin', on: 'peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600' },
  { code: 'SAKIT', label: 'Sakit', on: 'peer-checked:bg-purple-600 peer-checked:text-white peer-checked:border-purple-600' },
  { code: 'ALPHA', label: 'Alpha', on: 'peer-checked:bg-rose-600 peer-checked:text-white peer-checked:border-rose-600' },
];

export default function LessonSessionManager({
  classes,
  teacher,
  sessions,
  studentsByClass,
  schoolId,
  today,
}: {
  classes: ClassRow[];
  teacher: TeacherRow | null;
  sessions: SessionRow[];
  studentsByClass: Record<number, StudentRow[]>;
  schoolId: number;
  today: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [activeSession, setActiveSession] = useState<SessionRow | null>(null);
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    class_id: classes[0]?.id ? String(classes[0].id) : '',
    subject: teacher?.subject_specialty || '',
    topic: '',
    start_time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
  });

  function setAll(status: string) {
    if (!activeSession) return;
    const students = studentsByClass[activeSession.class_id] || [];
    const next: Record<string, string> = {};
    students.forEach((s) => {
      next[String(s.user_id)] = status;
    });
    setStatuses(next);
  }

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/guru/lesson-sessions', {
      method: 'POST',
      body: JSON.stringify({ ...form, class_id: Number(form.class_id), date: today }),
    });
    setBusy(false);
    if (res.success) {
      toastSuccess(res.message || 'Sesi berhasil dibuka');
      setShowForm(false);
      setForm((f) => ({ ...f, topic: '' }));
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal membuka sesi' });
    }
  }

  async function handleSaveAttendance() {
    if (!activeSession) return;
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/guru/lesson-attendance', {
      method: 'POST',
      body: JSON.stringify({ session_id: activeSession.id, statuses }),
    });
    setBusy(false);
    if (res.success) {
      toastSuccess(res.message || 'Presensi tersimpan');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menyimpan presensi' });
    }
  }

  async function handleCloseSession(sessionId: number) {
    if (!confirm('Tutup sesi ini?')) return;
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/guru/lesson-sessions', {
      method: 'POST',
      body: JSON.stringify({ action: 'close', session_id: sessionId }),
    });
    setBusy(false);
    if (res.success) {
      toastSuccess(res.message || 'Sesi ditutup');
      setActiveSession(null);
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menutup sesi' });
    }
  }

  function handleSelectSession(session: SessionRow) {
    setActiveSession(session);
    setMsg(null);
    void loadStatuses(session);
  }

  /** Ambil status presensi yang sudah tersimpan untuk sesi, fallback 'HADIR'.
   *  Mencegah guru menimpa data lama akibat status direset ke 'HADIR'. */
  async function loadStatuses(session: SessionRow) {
    const students = studentsByClass[session.class_id] || [];
    const base: Record<string, string> = {};
    students.forEach((s) => {
      base[String(s.user_id)] = 'HADIR';
    });
    try {
      const res = await fetchAPI(
        `/api/guru/lesson-attendance?session_id=${session.id}`,
        { silent: true }
      );
      if (res.success && Array.isArray(res.data)) {
        res.data.forEach((r: any) => {
          if (r.student_user_id && r.status) {
            base[String(r.student_user_id)] = r.status;
          }
        });
      }
    } catch (e) {
      // gagal memuat status lama — tetap pakai default HADIR
    }
    setStatuses(base);
  }

  const openSessions = sessions.filter((s) => s.status === 'open');
  const closedSessions = sessions.filter((s) => s.status === 'closed');
  const activeStudents = activeSession ? studentsByClass[activeSession.class_id] || [] : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Presensi Jam Pelajaran</h1>
          <p className="text-xs sm:text-sm text-slate-500">Buka sesi pelajaran dan catat kehadiran siswa per pertemuan.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Buka Sesi Baru</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Sesi Pelajaran Baru</h2>
          <form onSubmit={handleCreateSession} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Kelas</label>
              <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} className={inputCls}>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.class_name} ({c.major})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Mata Pelajaran</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} placeholder="Contoh: Informatika" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Topik / Materi</label>
              <textarea value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} className={inputCls} rows={2} placeholder="Topik pelajaran hari ini..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Jam Mulai</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className={inputCls} required />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition">
                Batal
              </button>
              <button type="submit" disabled={busy} className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50">
                {busy ? 'Menyimpan...' : 'Buka Sesi'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Sesi Hari Ini: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{sessions.length}</strong>
          </span>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Klik sesi untuk mengisi presensi siswa</p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <svg className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-bold">Belum ada sesi pelajaran hari ini.</p>
            <p className="text-[11px] mt-1">Klik &quot;Buka Sesi Baru&quot; untuk memulai.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {openSessions.map((s) => (
              <div
                key={s.id}
                onClick={() => handleSelectSession(s)}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer transition hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 ${activeSession?.id === s.id ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-600' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.subject}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">Aktif</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.class_name} &bull; Mulai {s.start_time?.slice(0, 5)} WIB
                      {s.topic && <span> &bull; {s.topic}</span>}
                    </p>
                  </div>
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            ))}

            {closedSessions.map((s) => (
              <div key={s.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 opacity-60">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.subject}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">Selesai</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {s.class_name} &bull; {s.start_time?.slice(0, 5)} &ndash; {s.end_time?.slice(0, 5) || '-'} WIB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeSession && (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveAttendance(); }} className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Presensi: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{activeSession.subject}</strong>
                  {' '}&mdash; {activeSession.class_name}
                </span>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Total siswa: {activeStudents.length} orang</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setAll('HADIR')} className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs transition">
                  Semua Hadir
                </button>
                <button type="button" onClick={() => handleCloseSession(activeSession.id)} disabled={busy} className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition disabled:opacity-50">
                  Tutup Sesi
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
                  {activeStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-400 dark:text-slate-500">
                        Tidak ada data siswa dalam kelas ini.
                      </td>
                    </tr>
                  ) : (
                    activeStudents.map((s, i) => (
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

            {activeStudents.length > 0 && (
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button type="submit" disabled={busy} className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition flex items-center gap-2 disabled:opacity-50">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  <span>{busy ? 'Menyimpan...' : 'Simpan Presensi'}</span>
                </button>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
