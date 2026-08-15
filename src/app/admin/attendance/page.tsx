import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import AttendanceManager from '@/components/admin/AttendanceManager';
import { todayStr } from '@/lib/queries';
import type { AttendanceRow, ClassRow, UserRow } from '@/components/admin/AttendanceManager';

export const dynamic = 'force-dynamic';

export default async function AdminAttendancePage({
  searchParams,
}: {
  searchParams: { date?: string; class_id?: string; status?: string; search?: string };
}) {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const filterDate = searchParams.date || todayStr();
  const filterClass = searchParams.class_id || '';
  const filterStatus = searchParams.status || '';
  const search = (searchParams.search || '').trim();

  const [classes] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM classes WHERE school_id = ? AND deleted_at IS NULL ORDER BY grade, class_name`,
    [schoolId]
  );

  const [usersList] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.identifier, u.full_name, r.role_name, c.class_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN students s ON u.id = s.user_id
     LEFT JOIN classes c ON s.class_id = c.id
     WHERE u.status = 'active' AND u.deleted_at IS NULL AND u.school_id = ?
     ORDER BY r.id, u.full_name`,
    [schoolId]
  );

  let sql = `
    SELECT a.*, u.full_name, u.identifier, u.avatar_url, r.role_name, r.role_code, c.class_name
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.date = ? AND a.school_id = ?
  `;
  const params: any[] = [filterDate, schoolId];
  if (filterClass) {
    sql += ' AND a.class_id = ?';
    params.push(filterClass);
  }
  if (filterStatus) {
    sql += ' AND a.status = ?';
    params.push(filterStatus);
  }
  if (search) {
    sql += ' AND (u.full_name LIKE ? OR u.identifier LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY a.updated_at DESC';

  const [records] = await pool.query<RowDataPacket[]>(sql, params);

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <AttendanceManager
        initialRecords={records as unknown as AttendanceRow[]}
        classes={classes as unknown as ClassRow[]}
        usersList={usersList as unknown as UserRow[]}
        filterDate={filterDate}
        filterClass={filterClass}
        filterStatus={filterStatus}
        search={search}
      />
    </DashboardShell>
  );
}