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

export interface Student {
  id: number;
  user_id: number;
  class_id: number | null;
  full_name: string;
  nisn: string;
  gender: string;
  parent_name: string | null;
  parent_phone: string | null;
  class_name?: string | null;
  major?: string | null;
}

export interface ClassRow {
  id: number;
  class_name: string;
  major: string;
}

interface Props {
  initialStudents: Student[];
  classes: ClassRow[];
  filterClass: string;
  search: string;
  user: { school_id: number };
}

export default function StudentManager({ initialStudents, classes, filterClass, search }: Props) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>(initialStudents);

  useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { sortKey, sortDir, toggle } = useSortable();
  const { pageData, safePage, totalPages, totalItems } = usePagination<Student>({
    data: students,
    page,
    pageSize,
    sortKey,
    sortDir,
  });

  const [form, setForm] = useState({
    full_name: '',
    nisn: '',
    class_id: '',
    gender: 'L',
    parent_name: '',
    parent_phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rules: Rule<typeof form>[] = [
    { field: 'full_name', label: 'Nama Lengkap', required: true, min: 3 },
    {
      field: 'nisn',
      label: 'NISN / ID Siswa',
      required: true,
      min: 4,
      max: 20,
      numeric: true,
      duplicate: (v) =>
        !!students.find((s) => s.nisn === v && s.id !== editing?.id),
      msg: 'NISN wajib diisi',
    },
    { field: 'class_id', label: 'Kelas', required: true },
    { field: 'parent_name', label: 'Nama Orang Tua', min: 3 },
    { field: 'parent_phone', label: 'No. WhatsApp Orang Tua', phone: true },
  ];

  function setField<K extends keyof typeof form>(key: K, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    setErrors((prev) => ({ ...prev, [key]: validateField(next, key, rules) }));
  }

  function openAdd() {
    setEditing(null);
    setForm({ full_name: '', nisn: '', class_id: '', gender: 'L', parent_name: '', parent_phone: '' });
    setErrors({});
    setOpen(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      full_name: s.full_name,
      nisn: s.nisn,
      class_id: s.class_id ? String(s.class_id) : '',
      gender: s.gender,
      parent_name: s.parent_name || '',
      parent_phone: s.parent_phone || '',
    });
    setErrors({});
    setOpen(true);
  }

  const studentExportColumns: ExportColumn[] = [
    { header: 'Nama Lengkap', get: (s) => s.full_name, width: 140 },
    { header: 'NISN', get: (s) => s.nisn, width: 90 },
    { header: 'Kelas', get: (s) => s.class_name || '-', width: 80 },
    { header: 'Jurusan', get: (s) => s.major || '-', width: 100 },
    { header: 'Gender', get: (s) => (s.gender === 'L' ? 'Laki-laki' : 'Perempuan'), width: 60 },
    { header: 'Orang Tua', get: (s) => s.parent_name || '-', width: 100 },
    { header: 'No. WA Ortu', get: (s) => s.parent_phone || '-', width: 90 },
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
    const res = await fetchAPI('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify({ action: 'save_student', student_id: editing?.id ?? '', ...form }),
    });
    setBusy(false);
    if (res.success) {
      const pw = res.temp_password ? ` Kata sandi sementara: ${res.temp_password}` : '';
      setMsg({ type: 'success', text: (res.message || 'Berhasil') + pw });
      toastSuccess((res.message || 'Berhasil') + pw);
      setOpen(false);
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menyimpan' });
    }
  }

  async function handleDelete(s: Student) {
    if (!confirm(`Yakin ingin menghapus siswa ini? Seluruh data akun & absensi juga akan terhapus.`)) return;
    setMsg(null);
    const res = await fetchAPI('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete_student', student_id: s.id }),
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Data Siswa</h1>
          <p className="text-xs sm:text-sm text-slate-500">Kelola informasi peserta didik, NISN, dan generate kartu pelajar digital.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={openAdd} className={btnPrimary}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Tambah Siswa</span>
          </button>
          <a href="/admin/cards" className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h2m-2 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span>Cetak Kartu Pelajar</span>
          </a>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <form method="GET" action="/admin/students" className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Filter Kelas</label>
            <select name="class_id" defaultValue={filterClass} className={inputCls}>
              <option value="">-- Semua Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cari Nama / NISN</label>
            <input type="text" name="search" defaultValue={search} placeholder="Ketik nama atau NISN..." className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 px-4 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold text-xs transition">
              Terapkan
            </button>
            <a href="/admin/students" className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition" title="Reset">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </a>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Siswa: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{students.length}</strong> Orang
          </span>
          <ExportButtons
            filename={`data-siswa-${todayStamp()}.xls`}
            title="Data Siswa"
            subtitle={`Total ${students.length} siswa`}
            columns={studentExportColumns}
            rows={students}
            compact
          />
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <SortableTh label="Nama Lengkap" sortKey="full_name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="NISN" sortKey="nisn" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Kelas &amp; Jurusan" sortKey="class_name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Gender" sortKey="gender" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Orang Tua / Wali" sortKey="parent_name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 dark:text-slate-500">
                    Belum ada data siswa yang ditemukan.
                  </td>
                </tr>
              ) : (
                pageData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">{s.full_name}</div>
                          <div className="text-[10px] text-slate-400">{s.nisn}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">{s.nisn}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{s.class_name || 'Belum Ditentukan'}</span>
                      <span className="block text-[10px] text-slate-400">{s.major || ''}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.gender === 'L' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                        {s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{s.parent_name || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition" title="Edit Data">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition" title="Hapus">
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

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit Siswa: ${editing.full_name}` : 'Tambah Siswa Baru'}>
        <form onSubmit={handleSave} noValidate className="space-y-4">
          <Field label="Nama Lengkap Siswa">
            <input type="text" placeholder="Contoh: Ahmad Maulana" className={inputFieldCls(errors.full_name)} value={form.full_name} onChange={(e) => setField('full_name', e.target.value)} />
            <FieldError error={errors.full_name} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="NISN / ID Siswa">
              <input type="text" placeholder="Contoh: 12009105" className={`${inputFieldCls(errors.nisn)} font-mono`} value={form.nisn} onChange={(e) => setField('nisn', e.target.value)} />
              <FieldError error={errors.nisn} />
            </Field>
            <Field label="Jenis Kelamin">
              <select className={inputCls} value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>
          </div>
          <Field label="Kelas">
            <select className={inputFieldCls(errors.class_id)} value={form.class_id} onChange={(e) => setField('class_id', e.target.value)}>
              <option value="">-- Pilih Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name} ({c.major})
                </option>
              ))}
            </select>
            <FieldError error={errors.class_id} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nama Orang Tua / Wali">
              <input type="text" placeholder="Nama ayah/ibu" className={inputFieldCls(errors.parent_name)} value={form.parent_name} onChange={(e) => setField('parent_name', e.target.value)} />
              <FieldError error={errors.parent_name} />
            </Field>
            <Field label="No. WhatsApp Orang Tua">
              <input type="text" placeholder="08xxxxxxxx" className={`${inputFieldCls(errors.parent_phone)} font-mono`} value={form.parent_phone} onChange={(e) => setField('parent_phone', e.target.value)} />
              <FieldError error={errors.parent_phone} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
              Batal
            </button>
            <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-50`}>
              {busy ? 'Menyimpan...' : 'Simpan Data Siswa'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
