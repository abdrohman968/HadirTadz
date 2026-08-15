import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import UserManager from '@/components/admin/UserManager';
import type { User, RoleRow } from '@/components/admin/UserManager';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role_id?: string; search?: string };
}) {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const roleFilter = searchParams.role_id || '';
  const search = (searchParams.search || '').trim();

  const [roles] = await pool.query<RowDataPacket[]>(`SELECT * FROM roles ORDER BY id`);

  let sql = `
    SELECT u.*, r.role_name, r.role_code
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.deleted_at IS NULL AND u.school_id = ?
  `;
  const params: any[] = [schoolId];
  if (roleFilter) {
    sql += ' AND u.role_id = ?';
    params.push(roleFilter);
  }
  if (search) {
    sql += ' AND (u.full_name LIKE ? OR u.identifier LIKE ? OR u.email LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY u.role_id, u.full_name';

  const [users] = await pool.query<RowDataPacket[]>(sql, params);

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <UserManager initialUsers={users as unknown as User[]} roles={roles as unknown as RoleRow[]} roleFilter={roleFilter} search={search} />
    </DashboardShell>
  );
}