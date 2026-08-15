'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Field, inputCls, inputFieldCls, FieldError } from '@/components/ui/Modal';
import { statusBadge, formatDateIndo, todayStrWIB, safeUrl } from '@/lib/format';
import { toastSuccess, toastError } from '@/components/ui/Toast';
import { validateForm, validateField, hasErrors, type Rule } from '@/lib/validation';

interface MyPermission {
  id: number;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  attachment_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export default function PermissionSubmit({ userId }: { userId: number }) {
  const [myPermissions, setMyPermissions] = useState<MyPermission[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [form, setForm] = useState({
    type: 'izin',
    start_date: todayStrWIB(),
    end_date: todayStrWIB(),
    reason: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const rules: Rule<typeof form>[] = [
    { field: 'type', label: 'Jenis Permohonan', required: true },
    { field: 'start_date', label: 'Tanggal Mulai', required: true },
    { field: 'end_date', label: 'Tanggal Selesai', required: true },
    { field: 'reason', label: 'Alasan', required: true, min: 10 },
  ];

  function setField<K extends keyof typeof form>(key: K, value: string) {
    const next = { ...form, [key]: value };
    setForm(next);
    setErrors((prev) => ({ ...prev, [key]: validateField(next, key, rules) }));
  }

  useEffect(() => {
    fetchAPI('/api/siswa/permissions', { silent: true })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setMyPermissions(res.data);
        }
      })
      .catch(() => {});
  }, []);

  async function readFileAsBase64(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm(form, rules);
    if (hasErrors(errs)) {
      setErrors(errs);
      toastError('Periksa kembali isian formulir yang salah.');
      return;
    }
    setBusy(true);
    setMsg(null);

    let attachment_base64 = '';
    let attachment_name = '';
    if (file) {
      try {
        attachment_base64 = await readFileAsBase64(file);
        attachment_name = file.name;
      } catch (e) {
        setMsg({ type: 'error', text: 'Gagal membaca berkas lampiran.' });
        setBusy(false);
        return;
      }
    }

    const res = await fetchAPI('/api/siswa/permissions', {
      method: 'POST',
      body: JSON.stringify({ ...form, attachment_base64, attachment_name }),
    });
    setBusy(false);
    setMsg({ type: res.success ? 'success' : 'error', text: res.message || (res.success ? 'Berhasil' : 'Gagal') });
    if (res.success) {
      toastSuccess(res.message || 'Permohonan izin berhasil diajukan');
      setForm({ ...form, reason: '' });
      setFile(null);
      const again = await fetchAPI('/api/siswa/permissions', { silent: true });
      if (again.success && Array.isArray(again.data)) setMyPermissions(again.data);
    }
  }

  const typeBadge = (t: string) => {
    const cls = t === 'sakit' ? 'bg-purple-100 text-purple-800' : t === 'dispensasi' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800';
    return <span className={`font-bold uppercase text-xs px-2.5 py-0.5 rounded-full ${cls}`}>{t}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Pengajuan Izin &amp; Sakit</h1>
        <p className="text-xs sm:text-sm text-slate-500">Ajukan permohonan ketidakhadiran dengan melampirkan surat dokter atau alasan resmi.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Formulir Pengajuan</span>
        </h3>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Jenis Permohonan">
              <select className={inputFieldCls(errors.type)} value={form.type} onChange={(e) => setField('type', e.target.value)}>
                <option value="izin">Izin (Ada Keperluan)</option>
                <option value="sakit">Sakit (Kondisi Kurang Sehat)</option>
                <option value="dispensasi">Dispensasi Kegiatan Sekolah</option>
              </select>
              <FieldError error={errors.type} />
            </Field>
            <Field label="Mulai Tanggal">
              <input type="date" className={inputFieldCls(errors.start_date)} value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} />
              <FieldError error={errors.start_date} />
            </Field>
            <Field label="Sampai Tanggal">
              <input type="date" className={inputFieldCls(errors.end_date)} value={form.end_date} onChange={(e) => setField('end_date', e.target.value)} />
              <FieldError error={errors.end_date} />
            </Field>
          </div>

          <Field label="Alasan / Penjelasan">
            <textarea rows={3} placeholder="Tuliskan keterangan lengkap alasan ketidakhadiran..." className={inputFieldCls(errors.reason)} value={form.reason} onChange={(e) => setField('reason', e.target.value)} />
            <FieldError error={errors.reason} />
          </Field>

          <Field label="Unggah Surat / Bukti (Foto Surat Dokter / Surat Ortu)">
            <input
              type="file"
              accept="image/*,.pdf"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <p className="text-[10px] text-slate-400 mt-1">Format didukung: JPG, PNG, PDF (Maksimal 2MB)</p>
          </Field>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={busy} className="px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-lg shadow-emerald-900/20 transition flex items-center gap-2 disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              <span>{busy ? 'Mengirim...' : 'Kirim Permohonan'}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <span>Status Riwayat Pengajuan Anda</span>
        </h3>

        <div className="space-y-3">
          {myPermissions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">Belum ada permohonan izin yang pernah diajukan.</div>
          ) : (
            myPermissions.map((mp) => (
              <div key={mp.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {typeBadge(mp.type)}
                    <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">
                      {formatDateIndo(mp.start_date, false)} s/d {formatDateIndo(mp.end_date, false)}
                    </span>
                  </div>
                  <div>{statusBadge(mp.status)}</div>
                </div>

                <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line">{mp.reason}</p>

                {mp.rejection_reason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                    <strong>Catatan Penolakan:</strong> {mp.rejection_reason}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Diajukan pada: {formatDateTime(mp.created_at)}</span>
                  {safeUrl(mp.attachment_url) && (
                    <a href={safeUrl(mp.attachment_url)} target="_blank" rel="noreferrer" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                      Lihat Lampiran
                    </a>
                  )}
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