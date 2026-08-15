import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import StudentManager from '@/components/admin/StudentManager';
import type { Student, ClassRow } from '@/components/admin/StudentManager';

export const dynamic = 'force-dynamic';

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: { class_id?: string; search?: string };
}) {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const filterClass = searchParams.class_id || '';
  const search = (searchParams.search || '').trim();

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM classes WHERE school_id = ? AND deleted_at IS NULL ORDER BY grade, class_name`,
    [schoolId]
  );

  let sql = `
    SELECT s.*, c.class_name, c.grade, c.major, u.status AS user_status, u.last_login_at
    FROM students s
    JOIN users u ON s.user_id = u.id AND u.school_id = ?
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.deleted_at IS NULL AND s.school_id = ?
  `;
  const params: any[] = [schoolId, schoolId];
  if (filterClass) {
    sql += ' AND s.class_id = ?';
    params.push(filterClass);
  }
  if (search) {
    sql += ' AND (s.full_name LIKE ? OR s.nisn LIKE ? OR s.parent_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY c.grade, c.class_name, s.full_name';

  const [students] = await pool.query<RowDataPacket[]>(sql, params);

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <StudentManager
        initialStudents={students as unknown as Student[]}
        classes={classes as unknown as ClassRow[]}
        filterClass={filterClass}
        search={search}
        user={user}
      />
    </DashboardShell>
  );
}
