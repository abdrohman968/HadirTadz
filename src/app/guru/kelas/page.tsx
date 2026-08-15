import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { guruNavGroups } from '@/lib/nav';
import ClassAttendanceEditor from '@/components/guru/ClassAttendanceEditor';
import { todayStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function GuruKelasPage({
  searchParams,
}: {
  searchParams: { class_id?: string; date?: string };
}) {
  const user = await requireRole(['guru', 'admin']);
  const schoolId = user.school_id;

  const filterClass = searchParams.class_id || '';
  const filterDate = searchParams.date || todayStr();

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM classes WHERE school_id = ? AND deleted_at IS NULL ORDER BY grade, class_name`,
    [schoolId]
  );

  const defaultClass = filterClass || (classes[0] as any)?.id || '';

  const [students] = await pool.query<RowDataPacket[]>(
    `SELECT s.*, u.identifier,
            a.id AS attendance_id, a.status AS attendance_status, a.time_in, a.time_out
     FROM students s
     JOIN users u ON s.user_id = u.id
     LEFT JOIN attendance a ON s.user_id = a.user_id AND a.date = ?
     WHERE s.class_id = ? AND s.deleted_at IS NULL AND u.school_id = ? AND u.deleted_at IS NULL
     ORDER BY u.full_name`,
    [filterDate, defaultClass, schoolId]
  );

  return (
    <DashboardShell user={user} navGroups={guruNavGroups}>
      <ClassAttendanceEditor
        classes={classes as unknown as ClassRow[]}
        students={students as unknown as StudentRow[]}
        filterClass={filterClass}
        filterDate={filterDate}
        defaultClass={defaultClass}
      />
    </DashboardShell>
  );
}

export interface ClassRow {
  id: number;
  class_name: string;
  major: string | null;
}
export interface StudentRow {
  id: number;
  user_id: number;
  full_name: string;
  nisn: string;
  gender: string;
  identifier: string;
  attendance_id: number | null;
  attendance_status: string | null;
}