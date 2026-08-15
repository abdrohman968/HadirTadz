'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import Modal, { Field, inputCls, btnPrimary, btnSecondary } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { statusBadge, formatDateIndo, formatTime } from '@/lib/format';

export interface AttendanceRow {
  id: number;
  user_id: number;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  method: string;
  notes: string | null;
  full_name: string;
  identifier: string;
  role_name: string;
  class_name?: string | null;
}

export interface ClassRow {
  id: number;
  class_name: string;
}
export interface UserRow {
  id: number;
  identifier: string;
  full_name: string;
  role_name: string;
  class_name?: string | null;
}

export default function AttendanceManager({
  initialRecords,
  classes,
  usersList,
  filterDate,
  filterClass,
  filterStatus,
  search,
}: {
  initialRecords: AttendanceRow[];
  classes: ClassRow[];
  usersList: UserRow[];
  filterDate: string;
  filterClass: string;
  filterStatus: string;
  search: string;
}) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [records, setRecords] = useState<AttendanceRow[]>(initialRecords);

  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);

  const [form, setForm] = useState({
    attendance_id: '',
    user_id: '',
    date: filterDate,
    status: 'HADIR',
    time_in: '07:00',
    time_out: '',
    notes: '',
  });

  function openAdd() {
    setEditing(null);
    setForm({ attendance_id: '', user_id: '', date: filterDate, status: 'HADIR', time_in: '07:00', time_out: '', notes: '' });
    setOpen(true);
  }

  function openEdit(r: AttendanceRow) {
    setEditing(r);
    setForm({
      attendance_id: String(r.id),
      user_id: String(r.user_id),
      date: r.date,
      status: r.status,
      time_in: r.time_in ? r.time_in.slice(0, 5) : '',
      time_out: r.time_out ? r.time_out.slice(0, 5) : '',
      notes: r.notes || '',
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/admin/attendance', {
      method: 'POST',
      body: JSON.stringify({ action: 'save_attendance', ...form, time_in: form.time_in || null, time_out: form.time_out || null }),
    });
    setBusy(false);
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Berhasil' });
      toastSuccess(res.message || 'Presensi berhasil disimpan');
      setOpen(false);
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menyimpan' });
      toastError(res.message || 'Gagal menyimpan');
    }
  }

  async function handleDelete(r: AttendanceRow) {
    if (!confirm('Hapus rekaman presensi ini?')) return;
    setMsg(null);
    const res = await fetchAPI('/api/admin/attendance', {
      method: 'POST',
      body: JSON.stringify({ action: 'delete_attendance', attendance_id: r.id }),
    });
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Berhasil' });
      toastSuccess(res.message || 'Rekaman presensi dihapus');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal menghapus' });
      toastError(res.message || 'Gagal menghapus');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Presensi Harian</h1>
          <p className="text-xs sm:text-sm text-slate-500">Monitor dan kelola kehadiran siswa serta guru secara realtime.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={openAdd} className={btnPrimary}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>Tambah Presensi Manual</span>
          </button>
          <Link
            href={`/admin/reports?date=${filterDate}`}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>Ekspor</span>
          </Link>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <form method="GET" action="/admin/attendance" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tanggal</label>
            <input type="date" name="date" defaultValue={filterDate} className={inputCls} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas</label>
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
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select name="status" defaultValue={filterStatus} className={inputCls}>
              <option value="">-- Semua Status --</option>
              {['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cari Nama / ID</label>
            <input type="text" name="search" defaultValue={search} placeholder="Ketik nama atau NISN..." className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition">
              Filter
            </button>
            <a href="/admin/attendance" className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition">
              Reset
            </a>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total: <strong className="text-slate-800 font-extrabold">{records.length}</strong> Rekaman Presensi ({formatDateIndo(filterDate)})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Pengguna</th>
                <th className="py-3 px-4">Role &amp; Kelas</th>
                <th className="py-3 px-4">Masuk</th>
                <th className="py-3 px-4">Pulang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada data presensi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {r.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{r.full_name}</div>
                          <div className="font-mono text-[10px] text-slate-400">{r.identifier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700">{r.class_name || '-'}</span>
                      <span className="block text-[10px] text-slate-400 capitalize">{r.role_name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-700">{formatTime(r.time_in)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{formatTime(r.time_out)}</td>
                    <td className="py-3 px-4">{statusBadge(r.status)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {r.method || 'manual'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{r.notes || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition" title="Edit Presensi">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition" title="Hapus">
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

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit Presensi: ${editing.full_name}` : 'Tambah Presensi Manual'}>
        <form onSubmit={handleSave} className="space-y-4">
          {!editing && (
            <Field label="Pilih Siswa / Guru">
              <select required className={inputCls} value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
                <option value="">-- Pilih Pengguna --</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.identifier} - {u.class_name || u.role_name})
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal">
              <input type="date" required className={inputCls} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Status Kehadiran">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['HADIR', 'TERLAMBAT', 'IZIN', 'SAKIT', 'ALPHA'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Masuk (HH:mm)">
              <input type="time" className={inputCls} value={form.time_in} onChange={(e) => setForm({ ...form, time_in: e.target.value })} />
            </Field>
            <Field label="Jam Pulang (HH:mm)">
              <input type="time" className={inputCls} value={form.time_out} onChange={(e) => setForm({ ...form, time_out: e.target.value })} />
            </Field>
          </div>
          <Field label="Catatan / Keterangan">
            <textarea rows={2} placeholder="Contoh: Lupa bawa kartu / presensi manual" className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
              Batal
            </button>
            <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-50`}>
              {busy ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}