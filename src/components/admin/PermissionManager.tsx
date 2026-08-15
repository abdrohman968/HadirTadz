'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import Modal, { Field, inputCls, btnSecondary } from '@/components/ui/Modal';
import { statusBadge, formatDateIndo, safeUrl } from '@/lib/format';
import Pagination, { usePagination, SortableTh, useSortable } from '@/components/ui/Pagination';
import ExportButtons from '@/components/ui/ExportButtons';
import type { ExportColumn } from '@/lib/export';
import { todayStamp } from '@/lib/export';

export interface Permission {
  id: number;
  user_id: number;
  type: string;
  start_date: string;
  end_date: string;
  reason: string;
  attachment_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  full_name: string;
  identifier: string;
  role_name: string;
  class_name?: string | null;
  verifier_name?: string | null;
}

export default function PermissionManager({ initialPermissions }: { initialPermissions: Permission[] }) {
  const router = useRouter();
  const [permissions, setPermissions] = useState<Permission[]>(initialPermissions);

  useEffect(() => {
    setPermissions(initialPermissions);
  }, [initialPermissions]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { sortKey, sortDir, toggle } = useSortable();
  const { pageData, safePage, totalPages, totalItems } = usePagination<Permission>({
    data: permissions,
    page,
    pageSize,
    sortKey,
    sortDir,
  });

  async function handleApprove(p: Permission) {
    if (!confirm('Setujui pengajuan izin ini?')) return;
    if (busy) return;
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/admin/permissions', {
      method: 'POST',
      body: JSON.stringify({ action: 'approve', permission_id: p.id }),
    });
    setBusy(false);
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Berhasil' });
      toastSuccess(res.message || 'Berhasil');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal' });
    }
  }

  async function handleReject() {
    if (!rejectId) return;
    setBusy(true);
    setMsg(null);
    const res = await fetchAPI('/api/admin/permissions', {
      method: 'POST',
      body: JSON.stringify({ action: 'reject', permission_id: rejectId, rejection_reason: rejectReason }),
    });
    setBusy(false);
    setRejectId(null);
    setRejectReason('');
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Berhasil' });
      toastSuccess(res.message || 'Berhasil');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal' });
    }
  }

  const typeBadge = (t: string) => {
    const cls = t === 'sakit' ? 'bg-purple-100 text-purple-800' : t === 'dispensasi' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${cls}`}>{t}</span>;
  };

  const permissionExportColumns: ExportColumn[] = [
    { header: 'Nama Pemohon', get: (p) => p.full_name, width: 140 },
    { header: 'ID / NISN', get: (p) => p.identifier, width: 90 },
    { header: 'Kelas / Peran', get: (p) => p.class_name || p.role_name, width: 80 },
    { header: 'Tipe', get: (p) => p.type, width: 60 },
    { header: 'Mulai', get: (p) => formatDateIndo(p.start_date, false), width: 70 },
    { header: 'Sampai', get: (p) => formatDateIndo(p.end_date, false), width: 70 },
    { header: 'Status', get: (p) => p.status, width: 60 },
    { header: 'Alasan', get: (p) => p.reason, width: 140 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Verifikasi Izin &amp; Sakit</h1>
        <p className="text-xs sm:text-sm text-slate-500">Kelola dan setujui surat keterangan sakit atau permohonan izin siswa dan guru.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Pengajuan: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{permissions.length}</strong> Berkas
          </span>
          <ExportButtons
            filename={`permohonan-izin-${todayStamp()}.xls`}
            title="Permohonan Izin & Sakit"
            subtitle={`Total ${permissions.length} berkas`}
            columns={permissionExportColumns}
            rows={permissions}
            compact
          />
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <SortableTh label="Pemohon" sortKey="full_name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Tipe" sortKey="type" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Rentang Waktu" sortKey="start_date" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th className="py-3 px-4">Alasan / Catatan</th>
                <th className="py-3 px-4">Bukti / Lampiran</th>
                <SortableTh label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th className="py-3 px-4 text-center">Aksi / Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500">
                    Belum ada berkas pengajuan izin atau sakit.
                  </td>
                </tr>
              ) : (
                pageData.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{p.full_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {p.class_name || p.role_name} &bull; <span className="font-mono">{p.identifier}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{typeBadge(p.type)}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      <div>{formatDateIndo(p.start_date, false)}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[10px]">s/d {formatDateIndo(p.end_date, false)}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs">
                      {p.reason}
                      {p.rejection_reason && (
                        <div className="text-[10px] text-rose-600 mt-1">Alasan ditolak: {p.rejection_reason}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {safeUrl(p.attachment_url) ? (
                        <a href={safeUrl(p.attachment_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold text-[11px] transition">
                          Lihat Berkas
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{statusBadge(p.status)}</td>
                    <td className="py-3 px-4 text-center">
                      {p.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleApprove(p)} disabled={busy} className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm transition">
                            Setujui
                          </button>
                          <button onClick={() => setRejectId(p.id)} className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition">
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Oleh {p.verifier_name || 'Admin'}</span>
                      )}
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

      <Modal open={rejectId !== null} onClose={() => setRejectId(null)} title="Alasan Penolakan Izin" maxW="max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleReject();
          }}
          className="space-y-4"
        >
          <Field label="Alasan Penolakan">
            <textarea rows={3} required placeholder="Masukkan alasan penolakan..." className={inputCls} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRejectId(null)} className={btnSecondary}>
              Batal
            </button>
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50">
              {busy ? 'Memproses...' : 'Tolak Izin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}