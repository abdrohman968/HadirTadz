'use client';

import { statusBadge, formatDateIndo, formatTime } from '@/lib/format';

export interface HistoryRow {
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  method: string | null;
  notes: string | null;
}

export default function HistoryView({ history, month }: { history: HistoryRow[]; month: string }) {
  const summary = { HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 };
  for (const h of history) {
    if (h.status in summary) summary[h.status as keyof typeof summary]++;
  }

  const cards = [
    { label: 'Tepat Waktu', value: summary.HADIR, cls: 'text-emerald-600', num: 'text-emerald-800' },
    { label: 'Terlambat', value: summary.TERLAMBAT, cls: 'text-amber-600', num: 'text-amber-800' },
    { label: 'Izin / Sakit', value: summary.IZIN + summary.SAKIT, cls: 'text-blue-600', num: 'text-blue-800' },
    { label: 'Alpha', value: summary.ALPHA, cls: 'text-rose-600', num: 'text-rose-800' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Riwayat Kehadiran Saya</h1>
          <p className="text-xs sm:text-sm text-slate-500">Rekapitulasi log presensi masuk dan pulang pribadi.</p>
        </div>
        <form method="GET" action="" className="flex items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={month}
            onChange={(e) => {
              if (e.target.value) {
                const url = new URL(window.location.href);
                url.searchParams.set('month', e.target.value);
                window.location.href = url.toString();
              }
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
          />
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
            <span className={`text-[10px] font-bold uppercase ${c.cls}`}>{c.label}</span>
            <p className={`text-2xl font-extrabold mt-1 ${c.num}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-3 sm:p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Jam Masuk</th>
                <th className="py-3 px-4">Jam Pulang</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    Tidak ada rekaman presensi pada bulan ini.
                  </td>
                </tr>
              ) : (
                history.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">{formatDateIndo(item.date, true)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{formatTime(item.time_in)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">{formatTime(item.time_out)}</td>
                    <td className="py-3.5 px-4">{statusBadge(item.status)}</td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-slate-400 font-mono">{item.method || 'GPS'}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs italic">{item.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}