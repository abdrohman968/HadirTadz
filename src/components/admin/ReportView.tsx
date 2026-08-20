'use client';

import { statusBadge, formatTime, formatDateIndo } from '@/lib/format';
import ExportButtons from '@/components/ui/ExportButtons';
import type { ExportColumn } from '@/lib/export';

export interface AttendanceRow {
  id: number;
  date: string;
  identifier: string;
  full_name: string;
  role_name: string;
  class_name?: string | null;
  time_in: string | null;
  time_out: string | null;
  status: string;
  method: string;
  notes: string | null;
}

export interface ClassRow {
  id: number;
  class_name: string;
}

interface Operator {
  full_name: string;
  identifier: string;
}

export default function ReportView({
  records,
  classes,
  operator,
  schoolName,
  address,
  principalName,
  principalNip,
  startDate,
  endDate,
  filterClass,
  filterRole,
  totals,
  printDate,
}: {
  records: AttendanceRow[];
  classes: ClassRow[];
  operator: Operator;
  schoolName: string;
  address: string;
  principalName?: string;
  principalNip?: string;
  startDate: string;
  endDate: string;
  filterClass: string;
  filterRole: string;
  totals: Record<string, number>;
  printDate: string;
}) {
  const csvUrl = `/api/admin/reports?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&class_id=${encodeURIComponent(filterClass)}&role_code=${encodeURIComponent(filterRole)}`;

  const exportColumns: ExportColumn[] = [
    { header: 'No', get: (r) => (r.__i ?? 0) + 1, width: 30 },
    { header: 'Tanggal', get: (r) => formatDateIndo(r.date, false), width: 70 },
    { header: 'ID / NISN', get: (r) => r.identifier, width: 80 },
    { header: 'Nama Lengkap', get: (r) => r.full_name, width: 140 },
    { header: 'Kelas / Peran', get: (r) => r.class_name || r.role_name, width: 100 },
    { header: 'Masuk', get: (r) => formatTime(r.time_in), width: 40 },
    { header: 'Pulang', get: (r) => formatTime(r.time_out), width: 40 },
    { header: 'Status', get: (r) => r.status, width: 50 },
    { header: 'Keterangan', get: (r) => r.notes || '-', width: 110 },
  ];

  const exportRows = records.map((r, i) => ({ ...r, __i: i }));

  const summaryCards = [
    { label: 'Hadir Tepat Waktu', value: totals.HADIR, cls: 'bg-emerald-50 border-emerald-200 text-emerald-600', num: 'text-emerald-800' },
    { label: 'Terlambat', value: totals.TERLAMBAT, cls: 'bg-amber-50 border-amber-200 text-amber-600', num: 'text-amber-800' },
    { label: 'Izin', value: totals.IZIN, cls: 'bg-blue-50 border-blue-200 text-blue-600', num: 'text-blue-800' },
    { label: 'Sakit', value: totals.SAKIT, cls: 'bg-purple-50 border-purple-200 text-purple-600', num: 'text-purple-800' },
    { label: 'Alpha', value: totals.ALPHA, cls: 'bg-rose-50 border-rose-200 text-rose-600', num: 'text-rose-800' },
  ];

  const town = address.split(',').pop()?.trim() || 'Bandung';

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Rekapitulasi Laporan Kehadiran</h1>
          <p className="text-xs sm:text-sm text-slate-500">Filter, cetak laporan resmi, dan ekspor data presensi ke format Excel/CSV.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span>Cetak Laporan</span>
          </button>
          <a
            href={csvUrl}
            className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs shadow-sm transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>Ekspor CSV</span>
          </a>
          <ExportButtons
            filename={`laporan-presensi-${startDate}-${endDate}.xls`}
            title={`Laporan Presensi ${schoolName}`}
            subtitle={`Periode: ${formatDateIndo(startDate, false)} s/d ${formatDateIndo(endDate, false)}`}
            columns={exportColumns}
            rows={exportRows}
          />
        </div>
      </div>

      <div className="no-print bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <form method="GET" action="/admin/reports" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Dari Tanggal</label>
            <input type="date" name="start_date" defaultValue={startDate} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Sampai Tanggal</label>
            <input type="date" name="end_date" defaultValue={endDate} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Kelas</label>
            <select name="class_id" defaultValue={filterClass} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="">-- Semua Kelas --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.class_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Peran</label>
            <select name="role_code" defaultValue={filterRole} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
              <option value="">-- Semua Peran --</option>
              <option value="siswa">Siswa</option>
              <option value="guru">Guru</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition">
              Tampilkan
            </button>
            <a href="/admin/reports" className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition">
              Reset
            </a>
          </div>
        </form>
      </div>

      <div className="no-print grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className={`border p-3.5 rounded-2xl text-center ${c.cls}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">{c.label}</span>
            <p className={`text-2xl font-extrabold mt-1 ${c.num}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="print-page bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">{schoolName}</h2>
          <p className="text-xs text-slate-600 mt-1">{address}</p>
          <div className="mt-3 py-1 bg-slate-100 rounded-lg inline-block px-6">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              LAPORAN REKAPITULASI PRESENSI KEHADIRAN
            </h3>
            <p className="text-[11px] text-slate-500">
              Periode: {formatDateIndo(startDate, false)} s/d {formatDateIndo(endDate, false)}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border border-slate-300">
                <th className="py-2.5 px-3 border border-slate-300 text-center w-10">No</th>
                <th className="py-2.5 px-3 border border-slate-300">Tanggal</th>
                <th className="py-2.5 px-3 border border-slate-300">ID / NISN</th>
                <th className="py-2.5 px-3 border border-slate-300">Nama Lengkap</th>
                <th className="py-2.5 px-3 border border-slate-300">Kelas / Peran</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">Masuk</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">Pulang</th>
                <th className="py-2.5 px-3 border border-slate-300 text-center">Status</th>
                <th className="py-2.5 px-3 border border-slate-300">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-400 border border-slate-300">
                    Tidak ada data presensi pada rentang waktu ini.
                  </td>
                </tr>
              ) : (
                records.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 border border-slate-300 text-center font-mono">{i + 1}</td>
                    <td className="py-2 px-3 border border-slate-300 font-mono text-[11px] whitespace-nowrap">{formatDateIndo(item.date, false)}</td>
                    <td className="py-2 px-3 border border-slate-300 font-mono font-bold text-slate-700">{item.identifier}</td>
                    <td className="py-2 px-3 border border-slate-300 font-bold text-slate-800">{item.full_name}</td>
                    <td className="py-2 px-3 border border-slate-300 text-slate-600">{item.class_name || item.role_name}</td>
                    <td className="py-2 px-3 border border-slate-300 text-center font-mono font-bold text-emerald-700">{formatTime(item.time_in)}</td>
                    <td className="py-2 px-3 border border-slate-300 text-center font-mono font-bold text-slate-700">{formatTime(item.time_out)}</td>
                    <td className="py-2 px-3 border border-slate-300 text-center font-bold">{statusBadge(item.status)}</td>
                    <td className="py-2 px-3 border border-slate-300 text-slate-500 text-[11px]">{item.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-12 pt-6 flex justify-between text-xs text-slate-700">
          <div className="text-center">
            <p>Mengetahui,</p>
            <p className="font-bold mt-1">Kepala Sekolah</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{principalName || '-'}</p>
            <p className="text-[10px] text-slate-500">NIP. {principalNip || '-'}</p>
          </div>
          <div className="text-center">
            <p>
              {town}, {formatDateIndo(printDate, false)}
            </p>
            <p className="font-bold mt-1">Petugas / Operator Presensi</p>
            <div className="h-20"></div>
            <p className="font-bold underline">{operator.full_name}</p>
            <p className="text-[10px] text-slate-500">NIP/ID. {operator.identifier}</p>
          </div>
        </div>
      </div>
    </div>
  );
}