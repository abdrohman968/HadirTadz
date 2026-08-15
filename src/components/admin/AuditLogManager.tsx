'use client';

import { useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { inputCls } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import ExportButtons from '@/components/ui/ExportButtons';
import type { ExportColumn } from '@/lib/export';
import { todayStamp } from '@/lib/export';

export interface AuditRow {
  id: number;
  school_id: number;
  actor_id: number | null;
  actor_identifier: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ACTION_GROUPS: { label: string; value: string }[] = [
  { label: 'Semua Aksi', value: '' },
  { label: 'Login / Logout', value: 'LOGIN,LOGOUT' },
  { label: 'Tambah / Edit Data', value: 'CREATE,UPDATE,SAVE' },
  { label: 'Hapus Data', value: 'DELETE,REMOVE' },
  { label: 'Persetujuan Izin', value: 'APPROVE,REJECT' },
  { label: 'Pembaruan Setelan', value: 'SETTINGS,UPDATE_SETTINGS' },
  { label: 'Reset / Keamanan', value: 'RESET_PASSWORD,UPDATE_USER_STATUS' },
];

function parseUA(ua: string): { browser: string; device: string } {
  if (!ua) return { browser: '-', device: '-' };
  const detect = (re: RegExp, name: string) => (re.test(ua) ? name : '');
  const browser =
    detect(/Chrome\//i, 'Chrome') ||
    detect(/Firefox\//i, 'Firefox') ||
    detect(/Edg\//i, 'Edge') ||
    detect(/SamsungBrowser/i, 'Samsung') ||
    detect(/OPR\//i, 'Opera') ||
    detect(/Safari\//i, 'Safari') ||
    'Lainnya';
  const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'Mobile' : 'Desktop';
  return { browser, device };
}

const actionBadge = (a: string) => {
  const cls =
    a.includes('LOGIN') || a.includes('LOGOUT')
      ? 'bg-blue-100 text-blue-800'
      : a.includes('DELETE') || a.includes('REJECT')
      ? 'bg-rose-100 text-rose-800'
      : a.includes('APPROVE') || a.includes('UPDATE_USER_STATUS')
      ? 'bg-emerald-100 text-emerald-800'
      : a.includes('RESET')
      ? 'bg-amber-100 text-amber-800'
      : 'bg-slate-100 text-slate-700';
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${cls}`}>{a}</span>;
};

function fmtDate(s: string) {
  if (!s) return '-';
  // Datetime dari MySQL disimpan dalam WIB (server local). Tampilkan apa adanya.
  const [datePart, timePart] = s.replace('T', ' ').split(' ');
  const [y, m, d] = (datePart || '').split('-');
  const [hh, mm, ss] = (timePart || '').split(':');
  if (!y || !m || !d) return String(s);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${String(d).padStart(2, '0')} ${months[Number(m) - 1] || m} ${y} ${hh || '00'}:${mm || '00'}:${ss || '00'} WIB`;
}

export default function AuditLogManager({
  initialLogs,
  initialTotal,
  schoolId,
}: {
  initialLogs: AuditRow[];
  initialTotal: number;
  schoolId: number;
}) {
  const [logs, setLogs] = useState<AuditRow[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  async function load(resetPage = false) {
    setLoading(true);
    const qs = new URLSearchParams();
    if (action) qs.set('action', action);
    if (search) qs.set('search', search);
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    if (resetPage) setPage(1);
    const p = resetPage ? 1 : page;
    qs.set('page', String(p));
    qs.set('pageSize', String(pageSize));
    const res = await fetchAPI(`/api/admin/audit?${qs.toString()}`, { silent: true });
    if (res.success && Array.isArray(res.data)) {
      setLogs(res.data);
      setTotal(Number(res.total) || 0);
      setPage(p);
    }
    setLoading(false);
  }

  useEffect(() => {
    // Muat ulang saat page/pageSize berubah (tanpa reset halaman)
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    load(true);
  };

  // Halaman sudah dipaging di server; hitung totalPages dari total server.
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageData = logs;

  const auditExportColumns: ExportColumn[] = [
    { header: 'Waktu', get: (l) => fmtDate(l.created_at), width: 100 },
    { header: 'Aktor', get: (l) => l.actor_identifier || 'SYSTEM', width: 90 },
    { header: 'Role', get: (l) => l.actor_role || '-', width: 60 },
    { header: 'Aksi', get: (l) => l.action, width: 80 },
    { header: 'Entitas', get: (l) => `#${l.entity_id || '-'}`, width: 50 },
    { header: 'Detail', get: (l) => l.details || '-', width: 170 },
    { header: 'IP', get: (l) => l.ip_address || '-', width: 60 },
    { header: 'Perangkat', get: (l) => `${parseUA(l.user_agent).browser} / ${parseUA(l.user_agent).device}`, width: 90 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Riwayat Audit Log</h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Seluruh aktivitas sistem (login, CRUD, persetujuan, pengaturan) tercatat di sini.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Filter Jenis Aksi</label>
            <select className={inputCls} value={action} onChange={(e) => setAction(e.target.value)}>
              {ACTION_GROUPS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cari</label>
            <input type="text" placeholder="Aktor, aksi, detail..." className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Dari</label>
            <input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Sampai</label>
            <input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="lg:col-span-5 flex gap-2">
            <button type="submit" className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-semibold text-xs transition">
              {loading ? 'Memuat...' : 'Terapkan Filter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAction('');
                setSearch('');
                setFrom('');
                setTo('');
                load(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Catatan: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{total}</strong> Baris
          </span>
          <div className="flex items-center gap-3">
            {loading && <span className="text-[10px] text-emerald-600 font-semibold">Memuat data...</span>}
            <ExportButtons
              filename={`audit-log-${todayStamp()}.xls`}
              title="Riwayat Audit Log"
              subtitle={`Total ${total} catatan filter aktif`}
              columns={auditExportColumns}
              rows={logs}
              compact
            />
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Aktor</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Entitas</th>
                <th className="py-3 px-4">Detail</th>
                <th className="py-3 px-4">IP</th>
                <th className="py-3 px-4">Perangkat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Belum ada catatan audit yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                pageData.map((l) => {
                  const { browser, device } = parseUA(l.user_agent);
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition align-top">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">{fmtDate(l.created_at)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{l.actor_identifier || 'SYSTEM'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">Role: {l.actor_role || '-'}</div>
                      </td>
                      <td className="py-3 px-4">{actionBadge(l.action)}</td>
                      <td className="py-3 px-4">
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase">{l.entity_type || '-'}</div>
                        <div className="font-mono text-[10px] text-slate-400">#{l.entity_id || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs">{l.details || '-'}</td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{l.ip_address || '-'}</td>
                      <td className="py-3 px-4 text-[10px] text-slate-500 dark:text-slate-400">
                        <div>{browser}</div>
                        <div className="text-slate-400 dark:text-slate-500">{device}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage}
          pageSize={pageSize}
          totalPages={totalPages}
          totalItems={total}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}