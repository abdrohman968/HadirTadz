'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import Modal, { Field, inputCls, btnPrimary, btnSecondary } from '@/components/ui/Modal';
import { formatTime } from '@/lib/format';

export interface Rule {
  id: number;
  rule_code: string;
  rule_name: string;
  role_code: string;
  check_in_start: string;
  work_start_time: string;
  late_threshold_time: string;
  early_leave_threshold: string;
  check_out_start: string;
  work_end_time: string;
  radius_limit: number;
}

const defaultForm = {
  rule_id: '',
  rule_name: '',
  role_code: 'siswa',
  check_in_start: '06:00',
  work_start_time: '07:00',
  late_threshold_time: '07:15',
  early_leave_threshold: '13:30',
  check_out_start: '14:00',
  work_end_time: '15:30',
  radius_limit: '150',
};

export default function RuleManager({ initialRules }: { initialRules: Rule[] }) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);

  useEffect(() => {
    setRules(initialRules);
  }, [initialRules]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [form, setForm] = useState(defaultForm);

  function openAdd() {
    setEditing(null);
    setForm(defaultForm);
    setOpen(true);
  }

  function openEdit(r: Rule) {
    setEditing(r);
    setForm({
      rule_id: String(r.id),
      rule_name: r.rule_name,
      role_code: r.role_code,
      check_in_start: r.check_in_start.slice(0, 5),
      work_start_time: r.work_start_time.slice(0, 5),
      late_threshold_time: r.late_threshold_time.slice(0, 5),
      early_leave_threshold: r.early_leave_threshold.slice(0, 5),
      check_out_start: r.check_out_start.slice(0, 5),
      work_end_time: r.work_end_time.slice(0, 5),
      radius_limit: String(r.radius_limit),
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/admin/rules', {
      method: 'POST',
      body: JSON.stringify({ action: 'save_rule', ...form }),
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

  const roleLabel = (code: string) =>
    code === 'siswa' ? 'Khusus Siswa' : code === 'guru' ? 'Khusus Guru' : 'Semua Pengguna';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Aturan Absensi &amp; Jam Kerja</h1>
          <p className="text-xs sm:text-sm text-slate-500">Konfigurasi batas jam masuk, toleransi keterlambatan, jam pulang, dan radius geofencing GPS.</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2 self-start">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span>Tambah Aturan</span>
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      {rules.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500">
          Belum ada aturan absensi. Tambahkan aturan pertama.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rules.map((r) => (
            <div key={r.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    Target: {r.role_code}
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{r.rule_name}</h3>
                </div>
                <button onClick={() => openEdit(r)} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition" title="Edit" aria-label="Edit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 dark:text-slate-400 block font-medium">Buka Presensi Masuk</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">{formatTime(r.check_in_start)} WIB</span>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <span className="text-amber-600 block font-medium">Batas Terlambat</span>
                  <span className="font-mono font-bold text-amber-700 text-sm">{formatTime(r.late_threshold_time)} WIB</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <span className="text-slate-400 block font-medium">Buka Presensi Pulang</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">{formatTime(r.check_out_start)} WIB</span>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <span className="text-emerald-600 block font-medium">Batas Radius GPS</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">{r.radius_limit} Meter</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit: ${editing.rule_name}` : 'Tambah Aturan Absensi'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama Aturan">
            <input type="text" required placeholder="Contoh: Aturan Jam Masuk Siswa" className={inputCls} value={form.rule_name} onChange={(e) => setForm({ ...form, rule_name: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Berlaku Untuk">
              <select className={inputCls} value={form.role_code} onChange={(e) => setForm({ ...form, role_code: e.target.value })}>
                <option value="siswa">Khusus Siswa</option>
                <option value="guru">Khusus Guru</option>
                <option value="all">Semua Pengguna</option>
              </select>
            </Field>
            <Field label="Radius GPS (Meter)">
              <input type="number" required className={inputCls} value={form.radius_limit} onChange={(e) => setForm({ ...form, radius_limit: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Mulai Buka">
              <input type="time" className={inputCls} value={form.check_in_start} onChange={(e) => setForm({ ...form, check_in_start: e.target.value })} />
            </Field>
            <Field label="Jam Masuk">
              <input type="time" className={inputCls} value={form.work_start_time} onChange={(e) => setForm({ ...form, work_start_time: e.target.value })} />
            </Field>
            <Field label="Toleransi / Batas">
              <input type="time" className={inputCls} value={form.late_threshold_time} onChange={(e) => setForm({ ...form, late_threshold_time: e.target.value })} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Mulai Pulang">
              <input type="time" className={inputCls} value={form.check_out_start} onChange={(e) => setForm({ ...form, check_out_start: e.target.value })} />
            </Field>
            <Field label="Pulang Cepat">
              <input type="time" className={inputCls} value={form.early_leave_threshold} onChange={(e) => setForm({ ...form, early_leave_threshold: e.target.value })} />
            </Field>
            <Field label="Selesai Jam Kerja">
              <input type="time" className={inputCls} value={form.work_end_time} onChange={(e) => setForm({ ...form, work_end_time: e.target.value })} />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
              Batal
            </button>
            <button type="submit" disabled={busy} className={`${btnPrimary} disabled:opacity-50`}>
              {busy ? 'Menyimpan...' : 'Simpan Aturan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}