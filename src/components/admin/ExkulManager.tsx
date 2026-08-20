'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess, toastError } from '@/components/ui/Toast';
import Modal, { Field, FieldError, inputCls, inputFieldCls, btnPrimary, btnSecondary } from '@/components/ui/Modal';

export interface ExkulRow {
  id: number;
  name: string;
  coach_user_id: number | null;
  coach_name: string | null;
  day_of_week: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_active: number;
  school_id: number;
}

export interface TeacherRow {
  id: number;
  full_name: string;
  nip: string;
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function ExkulManager({ extracurriculars, teachers }: { extracurriculars: ExkulRow[]; teachers: TeacherRow[] }) {
  const router = useRouter();
  const [list, setList] = useState<ExkulRow[]>(extracurriculars);

  useEffect(() => {
    setList(extracurriculars);
  }, [extracurriculars]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ExkulRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    coach_user_id: '',
    day_of_week: 'Senin',
    start_time: '',
    end_time: '',
    location: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', coach_user_id: '', day_of_week: 'Senin', start_time: '', end_time: '', location: '' });
    setErrors({});
    setOpen(true);
  }

  function openEdit(e: ExkulRow) {
    setEditing(e);
    setForm({
      name: e.name,
      coach_user_id: e.coach_user_id ? String(e.coach_user_id) : '',
      day_of_week: e.day_of_week || 'Senin',
      start_time: e.start_time?.slice(0, 5) || '',
      end_time: e.end_time?.slice(0, 5) || '',
      location: e.location || '',
    });
    setErrors({});
    setOpen(true);
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Nama ekskul wajib diisi';
    if (!form.coach_user_id) errs.coach_user_id = 'Pilih pelatih/pembina';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toastError('Periksa kembali isian formulir yang salah.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/admin/extracurriculars', {
      method: 'POST',
      body: JSON.stringify({ action: 'save', exkul_id: editing?.id ?? '', ...form, coach_user_id: Number(form.coach_user_id) }),
    });
    setBusy(false);
    if (res.success) {
      toastSuccess(res.message || 'Berhasil');
      setOpen(false);
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menyimpan' });
    }
  }

  async function handleDelete(e: ExkulRow) {
    if (!confirm(`Hapus ekstrakurikuler "${e.name}"?`)) return;
    setMsg(null);
    const res = await fetchAPI('/api/admin/extracurriculars', { method: 'POST', body: JSON.stringify({ action: 'delete', exkul_id: e.id }) });
    if (res.success) {
      toastSuccess(res.message || 'Berhasil');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menghapus' });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Kelola Ekstrakurikuler</h1>
          <p className="text-xs sm:text-sm text-slate-500">Daftar seluruh kegiatan ekstrakurikuler, pelatih, dan jadwal.</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Tambah Ekskul</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Ekskul</th>
                <th className="py-3 px-4">Pelatih / Pembina</th>
                <th className="py-3 px-4">Jadwal</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    Belum ada ekstrakurikuler yang terdaftar.
                  </td>
                </tr>
              ) : (
                list.map((e, i) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400">{i + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{e.name}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{e.coach_name || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {e.day_of_week || '-'}{e.start_time ? `, ${e.start_time.slice(0, 5)}` : ''}{e.end_time ? ` - ${e.end_time.slice(0, 5)}` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{e.location || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      {e.is_active ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">Aktif</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">Nonaktif</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(e)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition" title="Edit" aria-label="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(e)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/40 hover:text-rose-600 dark:hover:text-rose-300 transition" title="Hapus" aria-label="Hapus">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit: ${editing.name}` : 'Tambah Ekstrakurikuler Baru'} maxW="max-w-md">
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <Field label="Nama Ekstrakurikuler">
            <input type="text" placeholder="Contoh: Futsal, Basket, Qiroati" className={inputFieldCls(errors.name)} value={form.name} onChange={(e) => setField('name', e.target.value)} />
            <FieldError error={errors.name} />
          </Field>
          <Field label="Pelatih / Pembina">
            <select className={inputFieldCls(errors.coach_user_id)} value={form.coach_user_id} onChange={(e) => setField('coach_user_id', e.target.value)}>
              <option value="">-- Pilih Guru / Pelatih --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name} ({t.nip})</option>
              ))}
            </select>
            <FieldError error={errors.coach_user_id} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hari">
              <select className={inputCls} value={form.day_of_week} onChange={(e) => setField('day_of_week', e.target.value)}>
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>
            <Field label="Lokasi">
              <input type="text" placeholder="Contoh: Lapangan, Aula" className={inputCls} value={form.location} onChange={(e) => setField('location', e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Mulai">
              <input type="time" className={inputCls} value={form.start_time} onChange={(e) => setField('start_time', e.target.value)} />
            </Field>
            <Field label="Jam Selesai">
              <input type="time" className={inputCls} value={form.end_time} onChange={(e) => setField('end_time', e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
              Batal
            </button>
            <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-50`}>
              {busy ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
