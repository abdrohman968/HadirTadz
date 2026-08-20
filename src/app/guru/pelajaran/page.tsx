import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { guruNavGroups } from '@/lib/nav';
import LessonSessionManager from '@/components/guru/LessonSessionManager';
import { todayStr } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function GuruPelajaranPage() {
  const user = await requireRole(['guru', 'admin']);
  const schoolId = user.school_id;

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM classes WHERE school_id = ? AND deleted_at IS NULL ORDER BY grade, class_name`,
    [schoolId]
  );

  const [[teacherRows]] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM teachers WHERE user_id = ? AND school_id = ? AND deleted_at IS NULL LIMIT 1`,
    [user.id, schoolId]
  );
  const teacher = teacherRows || null;

  const today = todayStr();

  const [sessions] = await pool.query<RowDataPacket[]>(
    `SELECT ls.*, c.class_name
     FROM lesson_sessions ls
     JOIN classes c ON ls.class_id = c.id
     WHERE ls.teacher_user_id = ? AND ls.school_id = ? AND ls.session_date = ? AND ls.deleted_at IS NULL
     ORDER BY ls.start_time DESC`,
    [user.id, schoolId, today]
  );

  const classIds = Array.from(new Set(classes.map((c: any) => c.id))) as number[];
  let studentsByClass: Record<number, StudentRow[]> = {};
  if (classIds.length > 0) {
    const [allStudents] = await pool.query<RowDataPacket[]>(
      `SELECT s.*, u.identifier
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.class_id IN (?) AND s.deleted_at IS NULL AND u.school_id = ? AND u.deleted_at IS NULL
       ORDER BY s.class_id, u.full_name`,
      [classIds, schoolId]
    );
    for (const s of allStudents) {
      const cid = Number(s.class_id);
      if (!studentsByClass[cid]) studentsByClass[cid] = [];
      studentsByClass[cid].push(s as unknown as StudentRow);
    }
  }

  return (
    <DashboardShell user={user} navGroups={guruNavGroups}>
      <LessonSessionManager
        classes={classes as unknown as ClassRow[]}
        teacher={teacher as unknown as TeacherRow}
        sessions={sessions as unknown as SessionRow[]}
        studentsByClass={studentsByClass}
        schoolId={schoolId}
        today={today}
      />
    </DashboardShell>
  );
}

export interface ClassRow {
  id: number;
  class_name: string;
  major: string | null;
}
export interface TeacherRow {
  id: number;
  user_id: number;
  full_name: string;
  subject_specialty: string | null;
}
export interface SessionRow {
  id: number;
  class_id: number;
  subject: string;
  topic: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  status: string;
  class_name: string;
}
export interface StudentRow {
  id: number;
  user_id: number;
  full_name: string;
  nisn: string;
  gender: string;
  identifier: string;
}
