'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import { Field, inputCls } from '@/components/ui/Modal';
import { formatDateIndo } from '@/lib/format';

interface ClassRow {
  id: number;
  class_name: string;
}
interface JournalRow {
  id: number;
  class_id: number;
  date: string;
  time: string | null;
  subject: string;
  topic: string;
  present_count: number;
  absent_count: number;
  notes: string | null;
  created_at: string;
  class_name: string;
}

export default function JournalEditor({
  classes,
  myJournals,
  defaultSubject,
  today,
}: {
  classes: ClassRow[];
  myJournals: JournalRow[];
  defaultSubject: string;
  today: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [form, setForm] = useState({
    class_id: '',
    date: today,
    time: '07:30 - 09:00',
    subject: defaultSubject,
    topic: '',
    present_count: '30',
    absent_count: '0',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/guru/journals', {
      method: 'POST',
      body: JSON.stringify({ action: 'save_journal', ...form }),
    });
    setBusy(false);
    setMsg({ type: res.success ? 'success' : 'error', text: res.message || (res.success ? 'Berhasil' : 'Gagal') });
    if (res.success) {
      setForm({ ...form, class_id: '', topic: '', notes: '', present_count: '30', absent_count: '0' });
      router.refresh();
    }
  }

  function scrollToForm() {
    document.getElementById('form-jurnal-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Jurnal Pembelajaran Guru</h1>
          <p className="text-xs sm:text-sm text-slate-500">Catat agenda materi pembelajaran, capaian siswa, dan kehadiran per pertemuan.</p>
        </div>
        <button onClick={scrollToForm} className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2 self-start">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Tulis Jurnal Hari Ini</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div id="form-jurnal-card" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          <span>Formulir Jurnal Mengajar</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Kelas yang Diajar">
              <select required className={inputCls} value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
                <option value="">-- Pilih Kelas --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.class_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tanggal">
              <input type="date" required className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Jam Pelajaran / Waktu">
              <input type="text" placeholder="Contoh: 07:30 - 09:00" className={inputCls} value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </Field>
          </div>

          <Field label="Mata Pelajaran">
            <input type="text" required className={inputCls} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </Field>

          <Field label="Materi Pokok / Pembahasan Hari Ini">
            <textarea required rows={3} placeholder="Jelaskan pokok bahasan, kompetensi dasar, atau aktivitas praktik siswa..." className={inputCls} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Jumlah Siswa Hadir">
              <input type="number" min={0} className={`${inputCls} font-mono`} value={form.present_count} onChange={(e) => setForm({ ...form, present_count: e.target.value })} />
            </Field>
            <Field label="Jumlah Tidak Hadir (Izin/Sakit/Alpha)">
              <input type="number" min={0} className={`${inputCls} font-mono`} value={form.absent_count} onChange={(e) => setForm({ ...form, absent_count: e.target.value })} />
            </Field>
          </div>

          <Field label="Catatan Khusus / Kejadian di Kelas">
            <textarea rows={2} placeholder="Siswa antusias / tugas dikumpulkan tepat waktu / catatan remedial..." className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={busy} className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              <span>{busy ? 'Menyimpan...' : 'Simpan Jurnal'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Riwayat Jurnal yang Pernah Anda Buat</span>
        </h3>

        <div className="space-y-3">
          {myJournals.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">Belum ada jurnal pembelajaran yang tersimpan.</div>
          ) : (
            myJournals.map((j) => (
              <div key={j.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{j.subject} &bull; {j.class_name}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDateIndo(j.date, true)} ({j.time || '-'})</span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">{j.topic}</p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    Hadir: <strong className="text-emerald-700">{j.present_count}</strong> | Tidak Hadir: <strong className="text-rose-700">{j.absent_count}</strong>
                  </span>
                  <span>Dicatat: {formatDateTime(j.created_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(v: string | null): string {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}