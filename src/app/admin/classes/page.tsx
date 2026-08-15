import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import ClassManager from '@/components/admin/ClassManager';
import type { ClassRow, TeacherRow } from '@/components/admin/ClassManager';

export const dynamic = 'force-dynamic';

export default async function AdminClassesPage() {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const [teachers] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM teachers WHERE school_id = ? AND deleted_at IS NULL ORDER BY full_name`,
    [schoolId]
  );

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT c.*, t.full_name AS homeroom_name, t.nip AS homeroom_nip,
            COUNT(s.id) AS student_count
     FROM classes c
     LEFT JOIN teachers t ON c.homeroom_teacher_id = t.id
     LEFT JOIN students s ON c.id = s.class_id AND s.deleted_at IS NULL
     WHERE c.deleted_at IS NULL AND c.school_id = ?
     GROUP BY c.id
     ORDER BY c.grade, c.class_name`,
    [schoolId]
  );

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <ClassManager initialClasses={classes as unknown as ClassRow[]} teachers={teachers as unknown as TeacherRow[]} />
    </DashboardShell>
  );
}