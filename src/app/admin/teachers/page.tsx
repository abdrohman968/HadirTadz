import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import TeacherManager from '@/components/admin/TeacherManager';
import type { Teacher } from '@/components/admin/TeacherManager';

export const dynamic = 'force-dynamic';

export default async function AdminTeachersPage({ searchParams }: { searchParams: { search?: string } }) {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;
  const search = (searchParams.search || '').trim();

  let sql = `
    SELECT t.*, u.phone, u.email, u.last_login_at
    FROM teachers t
    JOIN users u ON t.user_id = u.id AND u.school_id = ?
    WHERE t.deleted_at IS NULL AND t.school_id = ?
  `;
  const params: any[] = [schoolId, schoolId];
  if (search) {
    sql += ' AND (t.full_name LIKE ? OR t.nip LIKE ? OR t.subject_specialty LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY t.full_name';

  const [teachers] = await pool.query<RowDataPacket[]>(sql, params);

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <TeacherManager initialTeachers={teachers as unknown as Teacher[]} search={search} />
    </DashboardShell>
  );
}