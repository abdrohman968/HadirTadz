import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import { todayStr } from '@/lib/queries';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { guruNavGroups } from '@/lib/nav';
import {
  getPersonalAttendance,
  getTeacherByUserId,
  statusBadge,
  formatDateIndo,
  formatTime,
} from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function GuruDashboardPage() {
  const user = await requireRole(['guru']);

  const today = todayStr();
  const monthStart = `${today.slice(0, 7)}-01`;

  const teacher = await getTeacherByUserId(user.id);

  const [[attRows]] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM attendance WHERE user_id = ? AND date = ? AND deleted_at IS NULL LIMIT 1`,
    [user.id, today]
  );
  const todayAtt = attRows || null;

  const [[journalCount]] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM journals WHERE teacher_user_id = ? AND date >= ? AND deleted_at IS NULL`,
    [user.id, monthStart]
  );
  const totalJournals = Number(journalCount.total) || 0;

  const [[classRows]] = await pool.query<RowDataPacket[]>(
    `SELECT c.* FROM classes c JOIN teachers t ON c.homeroom_teacher_id = t.id
     WHERE t.user_id = ? AND c.deleted_at IS NULL LIMIT 1`,
    [user.id]
  );
  const myClass = classRows || null;

  const recentHistory = await getPersonalAttendance(user.id, 5);


  return (
    <DashboardShell user={user} navGroups={guruNavGroups}>
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-700 to-emerald-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-emerald-200 mb-2">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateIndo(today, true)}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {user.full_name}!
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
              NIP: <span className="font-mono font-bold">{teacher?.nip || user.identifier}</span> &bull;{' '}
              Pengampu {teacher?.subject_specialty || 'Mata Pelajaran'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/guru/kelas"
              className="px-4 py-3 rounded-2xl bg-emerald-900/60 hover:bg-emerald-900/90 border border-emerald-500/40 text-white font-semibold text-xs transition flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>Presensi Siswa di Kelas</span>
            </a>
          </div>
        </div>
      </div>

      {/* Today Status & Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Kehadiran Hari Ini */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Kehadiran Hari Ini</span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 8a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
            </div>

            {todayAtt ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-emerald-700 font-medium">Jam Masuk:</span>
                  <span className="font-mono font-bold text-emerald-800 text-sm">{formatTime(todayAtt.time_in)} WIB</span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-emerald-700 font-medium">Jam Pulang:</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">{formatTime(todayAtt.time_out)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center">
                  <span className="text-xs text-emerald-700 font-medium">Status:</span>
                  {statusBadge(todayAtt.status)}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center py-5">
                <svg className="w-6 h-6 text-amber-500 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-bold text-amber-800">Anda belum presensi masuk hari ini.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Metode: {todayAtt?.method || '-'}</span>
            <a href="/guru/riwayat" className="text-emerald-700 font-bold hover:underline">Riwayat &rarr;</a>
          </div>
        </div>

        {/* Jurnal Pembelajaran */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jurnal Pembelajaran</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-800">{totalJournals}</span>
              <span className="text-xs text-slate-500">Jurnal terisi bulan ini</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Catat materi ajar harian dan absensi siswa di kelas untuk rekaman administrasi guru.
            </p>
          </div>

          <a
            href="/guru/jurnal"
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs text-center transition block"
          >
            + Isi Jurnal Baru
          </a>
        </div>

        {/* Wali Kelas Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Peran Wali Kelas</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>

            {myClass ? (
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                <h4 className="text-sm font-bold text-purple-900">{myClass.class_name}</h4>
                <p className="text-xs text-purple-700 mt-0.5">{myClass.major}</p>
                <p className="text-[11px] font-mono text-purple-600 mt-2">Tahun Ajaran: {myClass.academic_year}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Anda saat ini tidak bertugas sebagai wali kelas khusus.</p>
            )}
          </div>

          <a
            href="/guru/kelas"
            className="mt-5 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs text-center transition block"
          >
            Presensi Kelas
          </a>
        </div>
      </div>

      {/* Recent Personal Attendance History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Riwayat Kehadiran Pribadi Terkini</h3>
            <p className="text-xs text-slate-500">5 hari aktivitas terakhir Anda</p>
          </div>
          <a href="/guru/riwayat" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
            Lihat Semua
          </a>
        </div>

        <div className="divide-y divide-slate-100">
          {recentHistory.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">Belum ada riwayat absensi.</div>
          ) : (
            recentHistory.map((h, i) => (
              <div key={i} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-mono font-bold text-xs">
                    {new Date(h.date + 'T00:00:00').getDate()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{formatDateIndo(h.date, true)}</div>
                    <div className="text-[11px] text-slate-400">
                      Masuk: {formatTime(h.time_in)} &bull; Pulang: {formatTime(h.time_out)}
                    </div>
                  </div>
                </div>
                <div>{statusBadge(h.status)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
