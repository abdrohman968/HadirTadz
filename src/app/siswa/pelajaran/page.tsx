import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import { todayStr } from '@/lib/queries';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { siswaNavGroups } from '@/lib/nav';
import { getStudentByUserId, formatDateIndo } from '@/lib/dashboard-data';

export const dynamic = 'force-dynamic';

export default async function SiswaPelajaranPage() {
  const user = await requireRole(['siswa']);
  const today = todayStr();

  const student = await getStudentByUserId(user.id);
  const classId = student?.class_id || null;

  let sessions: RowDataPacket[] = [];
  let attendances: RowDataPacket[] = [];

  if (classId) {
    const [sessRows] = await pool.query<RowDataPacket[]>(
      `SELECT ls.*, c.class_name
       FROM lesson_sessions ls
       JOIN classes c ON ls.class_id = c.id
       WHERE ls.class_id = ? AND ls.session_date = ? AND ls.status = 'open' AND ls.deleted_at IS NULL
       ORDER BY ls.start_time ASC`,
      [classId, today]
    );
    sessions = sessRows;

    if (sessions.length > 0) {
      const sessionIds = sessions.map((s: any) => s.id);
      const [attRows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM lesson_attendance WHERE session_id IN (?) AND student_user_id = ?`,
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
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Absen Pelajaran</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sesi pelajaran aktif untuk kelas <strong>{student?.class_name || '-'}</strong> hari ini ({formatDateIndo(today, false)}).
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-center py-12 shadow-sm">
            <svg className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-bold text-slate-500">Belum ada sesi pelajaran aktif hari ini.</p>
            <p className="text-[11px] text-slate-400 mt-1">Presensi akan muncul saat guru membuka sesi pelajaran.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s: any) => {
              const attStatus = attMap[s.id] || null;
              return (
                <div key={s.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{s.subject}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">Aktif</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Jam {s.start_time?.slice(0, 5)} WIB &bull; {s.class_name}
                        {s.topic && <span> &bull; {s.topic}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {attStatus ? (
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        attStatus === 'HADIR' ? 'bg-emerald-100 text-emerald-800' :
                        attStatus === 'TERLAMBAT' ? 'bg-amber-100 text-amber-800' :
                        attStatus === 'IZIN' ? 'bg-blue-100 text-blue-800' :
                        attStatus === 'SAKIT' ? 'bg-purple-100 text-purple-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {attStatus === 'HADIR' ? 'Hadir' :
                         attStatus === 'TERLAMBAT' ? 'Terlambat' :
                         attStatus === 'IZIN' ? 'Izin' :
                         attStatus === 'SAKIT' ? 'Sakit' : 'Alpha'}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Belum Diisi Guru
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
