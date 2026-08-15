'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';
import { toastSuccess } from '@/components/ui/Toast';
import { inputCls } from '@/components/ui/Modal';
import Pagination, { usePagination, SortableTh, useSortable } from '@/components/ui/Pagination';
import ExportButtons from '@/components/ui/ExportButtons';
import type { ExportColumn } from '@/lib/export';
import { todayStamp } from '@/lib/export';
import { generateTempPassword } from '@/lib/password';

export interface User {
  id: number;
  identifier: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  last_login_at: string | null;
  role_name: string;
  role_code: string;
}

export interface RoleRow {
  id: number;
  role_name: string;
}

export default function UserManager({
  initialUsers,
  roles,
  roleFilter,
  search,
}: {
  initialUsers: User[];
  roles: RoleRow[];
  roleFilter: string;
  search: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);
  const [msg, setMsg] = useState<{ type: string; text: string } | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { sortKey, sortDir, toggle } = useSortable();
  const { pageData, safePage, totalPages, totalItems } = usePagination<User>({
    data: users,
    page,
    pageSize,
    sortKey,
    sortDir,
  });

  async function handleReset(u: User) {
    const generated = generateTempPassword();
    if (!confirm(`Reset kata sandi pengguna ini menjadi kata sandi sementara acak?`)) return;
    setMsg(null);
    const res = await fetchAPI('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'reset_password', user_id: u.id, new_password: generated }),
    });
    if (res.success) {
      const pw = res.temp_password || generated;
      setMsg({ type: 'success', text: `Password berhasil direset. Kata sandi sementara: ${pw}` });
      toastSuccess(`Password berhasil direset. Kata sandi sementara: ${pw}`);
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal' });
    }
  }

  async function handleToggle(u: User) {
    setMsg(null);
    const next = u.status === 'active' ? 'inactive' : 'active';
    const res = await fetchAPI('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle_status', user_id: u.id, status: next }),
    });
    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'Berhasil' });
      toastSuccess(res.message || 'Berhasil');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.message || 'Gagal' });
    }
  }

  const roleBadge = (code: string, name: string) => {
    const cls =
      code === 'admin' ? 'bg-purple-100 text-purple-800' : code === 'guru' ? 'bg-teal-100 text-teal-800' : 'bg-blue-100 text-blue-800';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${cls}`}>{name}</span>;
  };

  const userExportColumns: ExportColumn[] = [
    { header: 'Nama Lengkap', get: (u) => u.full_name, width: 140 },
    { header: 'ID Pengguna', get: (u) => u.identifier, width: 90 },
    { header: 'Peran', get: (u) => u.role_name, width: 80 },
    { header: 'Email', get: (u) => u.email || '-', width: 120 },
    { header: 'No. HP', get: (u) => u.phone || '-', width: 90 },
    { header: 'Status', get: (u) => (u.status === 'active' ? 'Aktif' : 'Nonaktif'), width: 60 },
    { header: 'Login Terakhir', get: (u) => u.last_login_at || '-', width: 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Kelola Akun Pengguna</h1>
        <p className="text-xs sm:text-sm text-slate-500">Manajemen akun masuk sistem, hak akses, dan reset kata sandi.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl border text-xs ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <form method="GET" action="/admin/users" className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Filter Peran (Role)</label>
            <select name="role_id" defaultValue={roleFilter} className={inputCls}>
              <option value="">-- Semua Role --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cari Pengguna</label>
            <input type="text" name="search" defaultValue={search} placeholder="Nama, ID, atau Email..." className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 px-4 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-semibold text-xs transition">
              Filter
            </button>
            <a href="/admin/users" className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition">
              Reset
            </a>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Pengguna: <strong className="text-slate-800 dark:text-slate-200 font-extrabold">{users.length}</strong> Akun
          </span>
          <ExportButtons
            filename={`data-pengguna-${todayStamp()}.xls`}
            title="Data Pengguna"
            subtitle={`Total ${users.length} akun`}
            columns={userExportColumns}
            rows={users}
            compact
          />
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <SortableTh label="Nama &amp; ID" sortKey="full_name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Peran (Role)" sortKey="role_name" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Kontak (Email / HP)" sortKey="email" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <SortableTh label="Status Akun" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggle} />
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 dark:text-slate-500">
                    Tidak ada pengguna yang ditemukan.
                  </td>
                </tr>
              ) : (
                pageData.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-100">{u.full_name}</div>
                          <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{u.identifier}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{roleBadge(u.role_code, u.role_name)}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <div>{u.email || '-'}</div>
                      <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{u.phone || '-'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleReset(u)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] transition"
                        >
                          Reset Sandi
                        </button>
                        <button
                          onClick={() => handleToggle(u)}
                          className={`p-1.5 rounded-lg transition ${u.status === 'active' ? 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}
                          title={u.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {u.status === 'active' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          )}
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
    </div>
  );
}