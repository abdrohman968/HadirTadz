import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import { todayStr } from '@/lib/queries';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { siswaNavGroups } from '@/lib/nav';
import {
  getStudentByUserId,
  statusBadge,
  formatDateIndo,
  formatTime,
} from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function SiswaDashboardPage() {
  const user = await requireRole(['siswa']);

  const today = todayStr();
  const curMonth = today.slice(0, 7);

  const student = await getStudentByUserId(user.id);

  const [[attRows]] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM attendance WHERE user_id = ? AND date = ? AND deleted_at IS NULL LIMIT 1`,
    [user.id, today]
  );
  const todayAtt = attRows || null;

  const [[summaryRows]] = await pool.query<RowDataPacket[]>(
    `SELECT
       SUM(CASE WHEN status = 'HADIR' THEN 1 ELSE 0 END) AS hadir,
       SUM(CASE WHEN status = 'TERLAMBAT' THEN 1 ELSE 0 END) AS terlambat,
       SUM(CASE WHEN status = 'IZIN' THEN 1 ELSE 0 END) AS izin,
       SUM(CASE WHEN status = 'SAKIT' THEN 1 ELSE 0 END) AS sakit,
       SUM(CASE WHEN status = 'ALPHA' THEN 1 ELSE 0 END) AS alpha,
       COUNT(*) AS total
     FROM attendance
     WHERE user_id = ? AND date LIKE ? AND deleted_at IS NULL`,
    [user.id, `${curMonth}%`]
  );
  const s = summaryRows || {};
  const hadirCount = Number(s.hadir) || 0;
  const terlambatCount = Number(s.terlambat) || 0;
  const izinSakitCount = (Number(s.izin) || 0) + (Number(s.sakit) || 0);
  const alphaCount = Number(s.alpha) || 0;
  const totalDays = Number(s.total) || 0;
  const persentase = totalDays > 0 ? Math.round(((hadirCount + terlambatCount) / totalDays) * 100) : 100;


  return (
    <DashboardShell user={user} navGroups={siswaNavGroups}>
      {/* Student Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 mb-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
              {student?.class_name || 'Siswa Aktif'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Hai, {user.full_name}!</h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1">
              NISN: <span className="font-mono font-bold">{student?.nisn || user.identifier}</span> &bull; Wali
              Kelas: {student?.homeroom_name || '-'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/siswa/absen"
              className="px-4 py-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-900/90 border border-emerald-500/40 text-white font-semibold text-xs transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              <span>Absen Mandiri</span>
            </a>
          </div>
        </div>
      </div>

      {/* Metrics & Today Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Today's Status */}
        <div className="md:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Kehadiran Hari Ini</span>
              <span className="text-xs font-mono text-slate-400">{formatDateIndo(today, false)}</span>
            </div>

            {todayAtt ? (
              <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium">Status:</span>
                  {statusBadge(todayAtt.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium">Jam Masuk:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{formatTime(todayAtt.time_in)} WIB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-medium">Jam Pulang:</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">{formatTime(todayAtt.time_out)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 text-[11px] text-emerald-700">
                  Metode: <strong className="uppercase">{todayAtt.method}</strong>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-3">
                <svg className="w-7 h-7 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs font-bold text-amber-800">Anda belum tercatat presensi hari ini.</p>
                <p className="text-[11px] text-amber-600">
                  Scan kartu Anda di scanner gerbang sekolah atau gunakan menu Absen Mandiri.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>
              Persentase Kehadiran: <strong className="text-emerald-700">{persentase}%</strong>
            </span>
            <a href="/siswa/riwayat" className="text-emerald-700 font-bold hover:underline">Riwayat &rarr;</a>
          </div>
        </div>

        {/* Digital ID Card Snapshot */}
        <div className="md:col-span-7 bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-6 shadow-lg border border-emerald-700 text-white flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 z-10 flex-1">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md uppercase tracking-wider text-emerald-200">
              Kartu Pelajar Digital
            </span>
            <h3 className="text-xl font-extrabold tracking-tight">{user.full_name}</h3>
            <p className="text-xs text-emerald-200 font-mono">NISN: {student?.nisn || user.identifier}</p>
            <p className="text-xs text-emerald-100">{student?.class_name || "SMA Terpadu Al-Mu'min"}</p>

            <div className="pt-3">
              <a
                href="/siswa/kartu"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow hover:bg-emerald-50 transition"
              >
                Buka Layar Penuh
              </a>
            </div>
          </div>

          <div className="z-10 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center flex-shrink-0">
            <div className="w-[100px] h-[100px] bg-emerald-950 text-emerald-300 flex items-center justify-center rounded">
              <svg className="w-14 h-14 mx-auto" fill="currentColor" viewBox="0 0 24 24" opacity={0.4}>
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm7 4h6v2h-6V8zm-3 6h6v2H7v-2zm0-4h2v2H7v-2z" />
              </svg>
            </div>
          </div>

          <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
        </div>
      </div>

      {/* Monthly Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-emerald-600">Hadir Tepat Waktu</span>
          <p className="text-2xl font-extrabold text-emerald-800 mt-1">{hadirCount} Hari</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-amber-600">Terlambat</span>
          <p className="text-2xl font-extrabold text-amber-800 mt-1">{terlambatCount} Hari</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-blue-600">Izin / Sakit</span>
          <p className="text-2xl font-extrabold text-blue-800 mt-1">{izinSakitCount} Hari</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
          <span className="text-[10px] font-bold uppercase text-rose-600">Alpha</span>
          <p className="text-2xl font-extrabold text-rose-800 mt-1">{alphaCount} Hari</p>
        </div>
      </div>
    </DashboardShell>
  );
}