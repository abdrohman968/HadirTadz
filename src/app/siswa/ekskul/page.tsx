import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import { todayStr } from '@/lib/queries';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { siswaNavGroups } from '@/lib/nav';
import { getStudentByUserId, formatDateIndo } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function SiswaEkskulPage() {
  const user = await requireRole(['siswa']);
  const today = todayStr();
  const dayOfWeek = new Date(today + 'T00:00:00Z').getUTCDay();

  const student = await getStudentByUserId(user.id);
  const classId = student?.class_id || null;

  let sessions: RowDataPacket[] = [];
  let attendances: RowDataPacket[] = [];

  if (classId) {
    const [sessRows] = await pool.query<RowDataPacket[]>(
      `SELECT es.*, ex.name AS exkul_name, ex.coach_user_id
       FROM exkul_sessions es
       JOIN extracurriculars ex ON es.exkul_id = ex.id
       WHERE es.session_date = ? AND es.status = 'open' AND es.deleted_at IS NULL AND ex.deleted_at IS NULL
       ORDER BY es.start_time ASC`,
      [today]
    );
    sessions = sessRows;

    if (sessions.length > 0) {
      const sessionIds = sessions.map((s: any) => s.id);
      const [attRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM exkul_attendance WHERE session_id IN (?) AND student_user_id = ?`,
        [sessionIds, user.id]
      );
      attendances = attRows;
    }
  }

  const attMap: Record<number, string> = {};
  attendances.forEach((a: any) => {
    attMap[a.session_id] = a.status;
  });

  return (
    <DashboardShell user={user} navGroups={siswaNavGroups}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Absen Ekstrakurikuler</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sesi ekstrakurikuler aktif hari ini ({formatDateIndo(today, false)}).
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center py-12 shadow-sm">
            <svg className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p className="text-xs font-bold text-slate-500">Tidak ada sesi ekstrakurikuler aktif hari ini.</p>
            <p className="text-[11px] text-slate-400 mt-1">Presensi ekskul akan muncul saat sesi dibuka oleh admin.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s: any) => {
              const attStatus = attMap[s.id] || null;
              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.exkul_name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">Aktif</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Jam {s.start_time?.slice(0, 5)} &ndash; {s.end_time?.slice(0, 5) || '-'} WIB
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {attStatus ? (
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        attStatus === 'HADIR' ? 'bg-emerald-100 text-emerald-800' :
                        attStatus === 'IZIN' ? 'bg-blue-100 text-blue-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {attStatus === 'HADIR' ? 'Hadir' :
                         attStatus === 'IZIN' ? 'Izin' : 'Alpha'}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Belum Diabsen
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
