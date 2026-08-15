import { redirect } from 'next/navigation';
import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import { todayStr } from '@/lib/queries';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import {
  getAttendanceStats,
  getRecentAttendance,
  getPendingPermissions,
  getAttendanceTrend,
  getRecentActivities,
  statusBadge,
  formatDateIndo,
  formatTime,
} from '@/lib/dashboard-data';
import TrendChart from '@/components/dashboard/TrendChart';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const user = await requireRole(['admin']);

  const today = todayStr();
  const schoolId = user.school_id;

  const [[countRows]] = await pool.query<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM students WHERE school_id = ? AND deleted_at IS NULL) AS students,
       (SELECT COUNT(*) FROM teachers WHERE school_id = ? AND deleted_at IS NULL) AS teachers`,
    [schoolId, schoolId]
  );
  const totalStudents = Number(countRows.students) || 0;
  const totalTeachers = Number(countRows.teachers) || 0;

  const todayStats = await getAttendanceStats(today, schoolId);
  const recentList = await getRecentAttendance(today, 6, schoolId);
  const pendingPerm = await getPendingPermissions(5, schoolId);

  const [trendDaily, trendWeekly, trendMonthly, trendYearly] = await Promise.all([
    getAttendanceTrend('daily', 14, schoolId),
    getAttendanceTrend('weekly', 8, schoolId),
    getAttendanceTrend('monthly', 12, schoolId),
    getAttendanceTrend('yearly', 6, schoolId),
  ]);
  const recentActs = await getRecentActivities(8, schoolId);

  const totalAtt = todayStats.hadir + todayStats.terlambat;
  const attendanceRate = totalStudents > 0 ? Math.round((totalAtt / totalStudents) * 1000) / 10 : 0;


  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 mb-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateIndo(today, true)}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {(user.full_name || '').split(' ')[0]}!
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              Pantau seluruh aktivitas absensi siswa dan guru secara realtime dengan mudah dan akurat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/scan"
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <span>Buka Kiosk Scanner</span>
            </a>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
      </div>

      {/* KPI Statistic Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hadir Tepat Waktu</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{todayStats.hadir}</span>
            <span className="text-xs text-slate-500">Siswa / Guru</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Terlambat</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{todayStats.terlambat}</span>
            <span className="text-xs text-slate-500">Siswa</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Izin & Sakit</span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600">{todayStats.izin + todayStats.sakit}</span>
            <span className="text-xs text-slate-500">{todayStats.izin} Izin, {todayStats.sakit} Sakit</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa Terdaftar</span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-800">{totalStudents}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">{attendanceRate}% Hadir</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">+{totalTeachers} Guru Pengajar Aktif</div>
        </div>
      </div>

      {/* 3. Grafik Tren Kehadiran + Log Presensi Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {[
            { k: 'Harian', v: trendDaily, s: '14 hari terakhir' },
            { k: 'Mingguan', v: trendWeekly, s: '8 minggu terakhir' },
            { k: 'Bulanan', v: trendMonthly, s: '12 bulan terakhir' },
            { k: 'Tahunan', v: trendYearly, s: '6 tahun terakhir' },
          ].map((c) => (
            <div key={c.k} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Grafik Tren Kehadiran {c.k}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{c.s}</p>
              </div>
              <TrendChart data={c.v} height={170} />
            </div>
          ))}
        </div>

        {/* Log Presensi Terkini */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Aktivitas Presensi Terkini Hari Ini</h2>
              <p className="text-xs text-slate-500">Log kehadiran langsung dari scanner & mobile</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {recentList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Belum ada rekaman presensi yang masuk hari ini.
              </div>
            ) : (
              recentList.map((row, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {(row.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{row.full_name}</h4>
                      <p className="text-[11px] text-slate-400">
                        {row.class_name || row.role_name} &bull;{' '}
                        <span className="font-mono">{row.identifier}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2.5">
                    <div className="text-xs font-mono font-bold text-slate-700">
                      {formatTime(row.time_out || row.time_in)}
                    </div>
                    {statusBadge(row.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Menunggu Persetujuan Izin + Aksi Cepat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Menunggu Persetujuan Izin</h2>
              <p className="text-xs text-slate-500">Pengajuan izin / surat sakit terbaru</p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingPerm.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                <svg className="w-6 h-6 text-emerald-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tidak ada pengajuan izin yang tertunda.
              </div>
            ) : (
              pendingPerm.map((p, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{p.full_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                        {p.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.reason}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatDateIndo(p.start_date || '', false)} s/d {formatDateIndo(p.end_date || '', false)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Aksi Cepat */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/scan', icon: 'scan', label: 'Buka Scanner', desc: 'Kiosk QR' },
              { href: '/admin/students', icon: 'user', label: 'Kelola Siswa', desc: 'Data & kelas' },
              { href: '/admin/teachers', icon: 'teacher', label: 'Kelola Guru', desc: 'Tenaga pendidik' },
              { href: '/admin/reports', icon: 'report', label: 'Laporan', desc: 'Rekap & export' },
              { href: '/admin/permissions', icon: 'perm', label: 'Persetujuan Izin', desc: 'Ada {pendingPerm.length} berkas' },
              { href: '/admin/audit', icon: 'audit', label: 'Riwayat Audit', desc: 'Log aktivitas' },
            ].map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {a.icon === 'scan' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    ) : a.icon === 'user' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
                    ) : a.icon === 'teacher' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    ) : a.icon === 'report' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    ) : a.icon === 'perm' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    )}
                  </svg>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{a.label}</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{a.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Aktivitas Sistem (Audit Log) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Aktivitas Sistem Terbaru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Sinopsis event terbaru dari audit log</p>
          </div>
          <a href="/admin/audit" className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs transition">
            Lihat Semua &rarr;
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {recentActs.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 col-span-full">Belum ada aktivitas sistem tercatat.</div>
          ) : (
            recentActs.map((a, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {a.action}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-auto truncate">{formatTime(a.created_at)}</span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-2 truncate">{a.full_name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{a.details || a.entity_type || '-'}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
