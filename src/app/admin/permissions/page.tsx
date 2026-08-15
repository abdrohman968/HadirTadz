import pool from '@/lib/db';
import type { RowDataPacket } from 'mysql2';
import { requireRole } from '@/lib/session';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { adminNavGroups } from '@/lib/nav';
import PermissionManager from '@/components/admin/PermissionManager';
import type { Permission } from '@/components/admin/PermissionManager';

export const dynamic = 'force-dynamic';

export default async function AdminPermissionsPage() {
  const user = await requireRole(['admin']);
  const schoolId = user.school_id;

  const [permissions] = await pool.query<RowDataPacket[]>(
    `SELECT p.*, u.full_name, u.identifier, r.role_name, c.class_name,
            v.full_name AS verifier_name
     FROM permissions p
     JOIN users u ON p.user_id = u.id AND u.school_id = ?
     JOIN roles r ON u.role_id = r.id
     LEFT JOIN students s ON u.id = s.user_id
     LEFT JOIN classes c ON s.class_id = c.id
     LEFT JOIN users v ON p.verified_by_user_id = v.id
     WHERE p.deleted_at IS NULL AND p.school_id = ?
     ORDER BY (p.status = 'pending') DESC, p.created_at DESC`,
    [schoolId, schoolId]
  );

  return (
    <DashboardShell user={user} navGroups={adminNavGroups}>
      <PermissionManager initialPermissions={permissions as unknown as Permission[]} />
    </DashboardShell>
  );
}