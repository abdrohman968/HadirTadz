'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess, toastError } from '@/components/ui/Toast';
import Modal, { Field, FieldError, inputCls, inputFieldCls, btnPrimary, btnSecondary } from '@/components/ui/Modal';
import Pagination, { usePagination, SortableTh, useSortable } from '@/components/ui/Pagination';
import ExportButtons from '@/components/ui/ExportButtons';
import type { ExportColumn } from '@/lib/export';
import { todayStamp } from '@/lib/export';
import { validateForm, validateField, hasErrors, type Rule } from '@/lib/validation';

export interface Teacher {
  id: number;
  user_id: number;
  full_name: string;
  nip: string;
  gender: string;
  subject_specialty: string | null;
  phone: string | null;
  email: string | null;
  last_login_at: string | null;
}

export default function TeacherManager({ initialTeachers, search }: { initialTeachers: Teacher[]; search: string }) {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);

  useEffect(() => {
    setTeachers(initialTeachers);
  }, [initialTeachers]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { sortKey, sortDir, toggle } = useSortable();
  const { pageData, safePage, totalPages, totalItems } = usePagination<Teacher>({
    data: teachers,
    page,
    pageSize,
    sortKey,
    sortDir,
  });

  const [form, setForm] = useState({ full_name: '', nip: '', gender: 'L', subject_specialty: '', email: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rules: Rule<typeof form>[] = [
    { field: 'full_name', label: 'Nama Lengkap', required: true, min: 3 },
    {
      field: 'nip',
      label: 'NIP / ID Guru',
      required: true,
      min: 4,
      max: 20,
      numeric: true,
      duplicate: (v) => !!teachers.find((t) => t.nip === v && t.id !== editing?.id),
      msg: 'NIP wajib diisi',
    },
    { field: 'subject_specialty', label: 'Mata Pelajaran', min: 3 },
    { field: 'email', label: 'Email', email: true },
    { field: 'phone', label: 'No. HP', phone: true },
  ];

  function setField<K extends keyof typeof form>(key: K, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    setErrors((prev) => ({ ...prev, [key]: validateField(next, key, rules) }));
  }

  function openAdd() {
    setEditing(null);
    setForm({ full_name: '', nip: '', gender: 'L', subject_specialty: '', email: '', phone: '' });
    setErrors({});
    setOpen(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({
      full_name: t.full_name,
      nip: t.nip,
      gender: t.gender,
      subject_specialty: t.subject_specialty || '',
      email: t.email || '',
      phone: t.phone || '',
    });
    setErrors({});
    setOpen(true);
  }

  const teacherExportColumns: ExportColumn[] = [
    { header: 'Nama Lengkap', get: (t) => t.full_name, width: 140 },
    { header: 'NIP', get: (t) => t.nip, width: 90 },
    { header: 'Mata Pelajaran', get: (t) => t.subject_specialty || 'Umum', width: 100 },
    { header: 'Gender', get: (t) => (t.gender === 'L' ? 'Laki-laki' : 'Perempuan'), width: 60 },
    { header: 'Email', get: (t) => t.email || '-', width: 120 },
    { header: 'No. HP', get: (t) => t.phone || '-', width: 90 },
  ];

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
    const res = await fetchAPI('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify({ action: 'save_teacher', teacher_id: editing?.id ?? '', ...form }),
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

  async function handleDelete(t: Teacher) {
    if (!confirm('Hapus data guru ini?')) return;
    setMsg(null);
    const res = await fetchAPI('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete_teacher', teacher_id: t.id }),
    });
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Guru Pengajar</h1>
          <p className="text-xs sm:text-sm text-slate-500">Kelola tenaga pendidik, NIP, mata pelajaran, dan kontak.</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Tambah Guru</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <form method="GET" action="/admin/teachers" className="flex gap-3">
          <div className="flex-1">
            <input type="text" name="search" defaultValue={search} placeholder="Cari nama guru, NIP, atau mata pelajaran..." className={inputCls} />
          </div>
          <button type="submit" className="py-2.5 px-5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold text-xs transition">
            Cari
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Guru: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{teachers.length}</strong> Orang
          </span>
          <ExportButtons
            filename={`data-guru-${todayStamp()}.xls`}
            title="Data Guru Pengajar"
            subtitle={`Total ${teachers.length} guru`}
            columns={teacherExportColumns}
            rows={teachers}
            compact
          />
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <SortableTh label="Nama Lengkap &amp; NIP" sortKey="full_name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Mata Pelajaran" sortKey="subject_specialty" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Gender" sortKey="gender" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Kontak" sortKey="email" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 dark:text-slate-500">
                    Belum ada data guru pengajar yang ditemukan.
                  </td>
                </tr>
              ) : (
                pageData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                          {t.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">{t.full_name}</div>
                          <div className="font-mono text-[10px] text-slate-400">NIP: {t.nip}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.subject_specialty || 'Umum'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                        {t.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{t.email || '-'}</div>
                      <div className="font-mono text-[10px] text-slate-400">{t.phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition" title="Edit">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition" title="Hapus">
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
        <Pagination
          page={safePage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit Guru: ${editing.full_name}` : 'Tambah Guru Pengajar'}>
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <Field label="Nama Lengkap & Gelar">
            <input type="text" placeholder="Contoh: Budi Santoso, S.Kom" className={inputFieldCls(errors.full_name)} value={form.full_name} onChange={(e) => setField('full_name', e.target.value)} />
            <FieldError error={errors.full_name} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="NIP / ID Guru">
              <input type="text" placeholder="19850315..." className={`${inputFieldCls(errors.nip)} font-mono`} value={form.nip} onChange={(e) => setField('nip', e.target.value)} />
              <FieldError error={errors.nip} />
            </Field>
            <Field label="Jenis Kelamin">
              <select className={inputCls} value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
          </div>
          <Field label="Mata Pelajaran yang Diampu">
            <input type="text" placeholder="Contoh: Informatika / Matematika" className={inputFieldCls(errors.subject_specialty)} value={form.subject_specialty} onChange={(e) => setField('subject_specialty', e.target.value)} />
            <FieldError error={errors.subject_specialty} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input type="text" placeholder="nama@sekolah.sch.id" className={inputFieldCls(errors.email)} value={form.email} onChange={(e) => setField('email', e.target.value)} />
              <FieldError error={errors.email} />
            </Field>
            <Field label="No. HP / WhatsApp">
              <input type="text" placeholder="08xxxxxxxx" className={`${inputFieldCls(errors.phone)} font-mono`} value={form.phone} onChange={(e) => setField('phone', e.target.value)} />
              <FieldError error={errors.phone} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
              Batal
            </button>
            <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-50`}>
              {busy ? 'Menyimpan...' : 'Simpan Data Guru'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}