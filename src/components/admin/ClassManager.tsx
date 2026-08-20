'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess, toastError } from '@/components/ui/Toast';
import Modal, { Field, FieldError, inputCls, inputFieldCls, btnPrimary, btnSecondary } from '@/components/ui/Modal';
import { validateForm, validateField, hasErrors, type Rule } from '@/lib/validation';

export interface ClassRow {
  id: number;
  class_code: string;
  class_name: string;
  grade: string;
  major: string;
  homeroom_teacher_id: number | null;
  academic_year: string;
  homeroom_name?: string | null;
  student_count?: number | string;
}

export interface TeacherRow {
  id: number;
  full_name: string;
  nip: string;
}

export default function ClassManager({ initialClasses, teachers }: { initialClasses: ClassRow[]; teachers: TeacherRow[] }) {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassRow[]>(initialClasses);

  useEffect(() => {
    setClasses(initialClasses);
  }, [initialClasses]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const [form, setForm] = useState({
    class_code: '',
    class_name: '',
    grade: 'X',
    major: '',
    homeroom_teacher_id: '',
    academic_year: '2025/2026',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rules: Rule<typeof form>[] = [
    { field: 'class_name', label: 'Nama Kelas', required: true, min: 3, duplicate: (v) => !!classes.find((c) => c.class_name === v && c.id !== editing?.id) },
    {
      field: 'class_code',
      label: 'Kode Kelas',
      required: true,
      min: 2,
      max: 10,
      pattern: /^[A-Za-z0-9-]+$/,
      patternMsg: 'Kode kelas hanya huruf, angka, dan dash (A-Z, 0-9, -)',
      duplicate: (v) => !!classes.find((c) => c.class_code === v && c.id !== editing?.id),
    },
    { field: 'major', label: 'Jurusan', required: true, min: 3 },
    { field: 'academic_year', label: 'Tahun Ajaran', required: true, pattern: /^\d{4}\/\d{4}$/, patternMsg: 'Format tahun ajaran: 2025/2026' },
  ];

  function setField<K extends keyof typeof form>(key: K, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    setErrors((prev) => ({ ...prev, [key]: validateField(next, key, rules) }));
  }

  function openAdd() {
    setEditing(null);
    setForm({ class_code: '', class_name: '', grade: 'X', major: '', homeroom_teacher_id: '', academic_year: '2025/2026' });
    setErrors({});
    setOpen(true);
  }

  function openEdit(c: ClassRow) {
    setEditing(c);
    setForm({
      class_code: c.class_code,
      class_name: c.class_name,
      grade: c.grade,
      major: c.major,
      homeroom_teacher_id: c.homeroom_teacher_id ? String(c.homeroom_teacher_id) : '',
      academic_year: c.academic_year || '2025/2026',
    });
    setErrors({});
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form, rules);
    if (hasErrors(errs)) {
      setErrors(errs);
      toastError('Periksa kembali isian formulir yang salah.');
      return;
    }
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/admin/classes', {
      method: 'POST',
      body: JSON.stringify({ action: 'save_class', class_id: editing?.id ?? '', ...form }),
    });
    setBusy(false);
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Berhasil' });
      toastSuccess(res.message || 'Berhasil');
      setOpen(false);
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menyimpan' });
    }
  }

  async function handleDelete(c: ClassRow) {
    if (!confirm('Hapus kelas ini?')) return;
    setMsg(null);
    const res = await fetchAPI('/api/admin/classes', { method: 'POST', body: JSON.stringify({ action: 'delete_class', class_id: c.id }) });
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Berhasil' });
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Kelas &amp; Wali Kelas</h1>
          <p className="text-xs sm:text-sm text-slate-500">Kelola rombongan belajar, tingkatan kelas, jurusan, dan penugasan wali kelas.</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Tambah Kelas</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
            Belum ada kelas yang terdaftar.
          </div>
        ) : (
          classes.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Tingkat {c.grade}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500">{c.class_code}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{c.class_name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.major}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Wali Kelas:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-right truncate max-w-[150px]">{c.homeroom_name || 'Belum Ditentukan'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Jumlah Siswa:</span>
                    <span className="font-bold text-emerald-700">{c.student_count} Siswa</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">Tahun Ajaran:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">{c.academic_year}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Link href={`/admin/students?class_id=${c.id}`} className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                  <span>Lihat Siswa</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-700 dark:hover:text-emerald-300 transition" title="Edit" aria-label="Edit">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/40 hover:text-rose-600 dark:hover:text-rose-300 transition" title="Hapus" aria-label="Hapus">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit Kelas: ${editing.class_name}` : 'Tambah Kelas Baru'} maxW="max-w-md">
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kode Kelas">
              <input type="text" placeholder="X-IPA-1" className={`${inputFieldCls(errors.class_code)} font-mono`} value={form.class_code} onChange={(e) => setField('class_code', e.target.value)} />
              <FieldError error={errors.class_code} />
            </Field>
            <Field label="Tingkatan">
              <select className={inputCls} value={form.grade} onChange={(e) => setField('grade', e.target.value)}>
                <option value="X">Kelas X (Sepuluh)</option>
                <option value="XI">Kelas XI (Sebelas)</option>
                <option value="XII">Kelas XII (Duabelas)</option>
              </select>
            </Field>
          </div>
          <Field label="Nama Kelas">
            <input type="text" placeholder="Contoh: Kelas X - MIPA 1" className={inputFieldCls(errors.class_name)} value={form.class_name} onChange={(e) => setField('class_name', e.target.value)} />
            <FieldError error={errors.class_name} />
          </Field>
          <Field label="Jurusan / Peminatan">
            <input type="text" placeholder="Contoh: Matematika dan Ilmu Pengetahuan Alam" className={inputFieldCls(errors.major)} value={form.major} onChange={(e) => setField('major', e.target.value)} />
            <FieldError error={errors.major} />
          </Field>
          <Field label="Wali Kelas">
            <select className={inputCls} value={form.homeroom_teacher_id} onChange={(e) => setField('homeroom_teacher_id', e.target.value)}>
              <option value="">-- Pilih Guru Wali Kelas --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.nip})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tahun Ajaran">
            <input type="text" placeholder="2025/2026" className={inputFieldCls(errors.academic_year)} value={form.academic_year} onChange={(e) => setField('academic_year', e.target.value)} />
            <FieldError error={errors.academic_year} />
          </Field>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
              Batal
            </button>
            <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-50`}>
              {busy ? 'Menyimpan...' : 'Simpan Kelas'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}